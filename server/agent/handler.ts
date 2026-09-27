/**
 * Endpoint /api/agent.php para `vite dev` e `vite preview` — mesmo contrato do api/agent.php (produção).
 *
 *   GET  ?action=health                                   → { llm, provider, tts, stt, tier }
 *   GET  ?action=admin  (Authorization: Bearer TOKEN)     → resumo do orçamento (sem dados pessoais)
 *   POST { action:'chat', lang, sid, messages, state, voice } → NDJSON: {t:'meta'|'text'|'tool'|'fallback'|'done'}
 *   POST { action:'tts', lang, sid, text }                → áudio (wav/mp3)
 *   POST { action:'stt', sid, mime, audio(base64) }       → { text }
 *   POST { action:'event', sid, type:'booked' }           → 204
 *   POST { action:'admin_reset', scope:'mine'|'all' } (Authorization: Bearer TOKEN) → { ok, scope, clients, rateLimits }
 */
import { timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { fileURLToPath } from 'node:url';
import { buildSystem, loadBrain, safeLang, workdaySlots, type Brain } from './brain';
import {
  budgetConfig,
  clientKey,
  ipHash,
  resetClients,
  touchClient,
  nextWorstEur,
  costEur,
  newClient,
  reserve,
  settle,
  summary,
  tierOf,
  withLedger,
  worstChat,
  worstStt,
  worstTts,
  type Usage,
} from './budget';
import { clearRateLimit, isInjection, normalizeHistory, originAllowed, rateLimit } from './guard';
import { billedModel, chat, stt, sttSupported, tts, ttsSupported, type AgentEvent, type Meter, type ProviderConfig, type ProviderId } from './providers';

type Env = Record<string, string | undefined>;
const KEY_VAR: Record<string, string> = { gemini: 'GEMINI_API_KEY', openai: 'OPENAI_API_KEY', anthropic: 'ANTHROPIC_API_KEY' };
const ROOT = fileURLToPath(new URL('../../', import.meta.url));

export function resolveConfig(env: Env, brain: Brain): ProviderConfig | null {
  if (env.AGENT_DISABLED === '1') return null;
  const provider = (env.AGENT_PROVIDER || brain.defaults.provider) as ProviderId;
  if (!['gemini', 'openai', 'anthropic', 'mock'].includes(provider)) return null;
  const key = provider === 'mock' ? 'mock' : (env[KEY_VAR[provider]] ?? '').trim();
  if (!key) return null;
  const d = brain.defaults;
  const def = provider === 'gemini' ? d.gemini : provider === 'openai' ? d.openai : provider === 'anthropic' ? { ...d.anthropic, tts: '', voice: '', stt: '' } : { model: 'mock', tts: 'mock', voice: 'mock', stt: 'mock' };
  return {
    provider,
    key,
    model: env.AGENT_MODEL || def.model,
    ttsModel: env.AGENT_TTS_MODEL || def.tts,
    voice: env.AGENT_VOICE || def.voice,
    sttModel: (def as { stt?: string }).stt ?? '',
    timeoutMs: brain.limits.timeoutSec * 1000,
    maxTokens: brain.limits.maxOutputTokens,
    maxRounds: brain.limits.maxRounds,
  };
}

const log = (action: string, provider: string, status: string, t0: number, extra = '') =>
  // Sem conteúdo das mensagens, sem IP, sem dados pessoais.
  console.info(`[agent] ${action} provider=${provider} status=${status} ms=${Date.now() - t0}${extra}`);

function readBody(req: IncomingMessage, max: number): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > max) {
        reject(new Error('too_large'));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

const json = (res: ServerResponse, status: number, body: unknown) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
};

/** O visitante já passou pelo diagnóstico guiado (setor + dor + equipa/horas)? Usado no patamar «reserva». */
function qualifiedState(state: unknown): boolean {
  const p = (state as { profile?: Record<string, unknown> } | null)?.profile ?? {};
  return !!p.sector && !!p.pain && (!!p.team || !!p.hours);
}

function adminAllowed(req: IncomingMessage, env: Env): boolean {
  const token = env.AGENT_ADMIN_TOKEN ?? '';
  if (token.length < 24) return false; // painel desligado sem token forte
  const got = String(req.headers.authorization ?? '').replace(/^Bearer\s+/i, '') || String(req.headers['x-admin-token'] ?? '');
  const a = Buffer.from(got);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

const ZERO: Usage = { inText: 0, inAudio: 0, outText: 0, outAudio: 0 };

export function createAgentMiddleware(env: Env) {
  const extraOrigins = (env.AGENT_ALLOWED_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean);

  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (!req.url || !req.url.startsWith('/api/agent.php')) return next();
    const t0 = Date.now();
    const brain = loadBrain();
    const B = budgetConfig(env, brain, ROOT);
    const origin = req.headers.origin;
    if (!originAllowed(origin, req.headers.host, brain, extraOrigins)) return json(res, 403, { error: 'origin' });
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    }
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.statusCode = 204;
      return res.end();
    }
    const cfg = resolveConfig(env, brain);
    const query = new URL(req.url, 'http://x').searchParams;
    const nextWorst = cfg ? nextWorstEur(brain, billedModel(cfg, 'chat'), cfg.provider) : 0;

    if (req.method === 'GET') {
      if (query.get('action') === 'admin') {
        if (!adminAllowed(req, env)) return json(res, 401, { error: 'unauthorized' });
        return json(res, 200, { provider: cfg?.provider ?? null, model: cfg?.model ?? null, ...summary(B, brain, nextWorst) });
      }
      const tier = withLedger(B, brain, (l) => tierOf(B, brain, l, nextWorst));
      const llm = !!cfg && tier !== 'over';
      return json(res, 200, {
        llm,
        provider: cfg?.provider ?? null,
        tts: llm && ttsSupported(cfg!.provider) && env.AGENT_TTS !== 'off' && tier === 'normal',
        stt: llm && sttSupported(cfg!.provider),
        tier,
      });
    }
    if (req.method !== 'POST') return json(res, 405, { error: 'method' });

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(await readBody(req, brain.limits.maxBodyBytes));
    } catch {
      return json(res, 400, { error: 'body' });
    }
    const action = String(body.action ?? 'chat');
    const lang = safeLang(body.lang);
    const ip = req.socket.remoteAddress ?? 'unknown';
    const sid = /^[A-Za-z0-9-]{8,64}$/.test(String(body.sid ?? '')) ? String(body.sid) : '';

    // Reinício pedido pelo dono (painel). Antes do rate limit geral: tem o seu próprio limite.
    if (action === 'admin_reset') {
      if (!adminAllowed(req, env)) return json(res, 401, { error: 'unauthorized' });
      const scope = body.scope === 'all' ? 'all' : 'mine';
      const r = resetClients(B, brain, scope, ipHash(B, ip));
      if (!r) return json(res, 429, { error: 'busy' });
      const rateLimits = clearRateLimit(scope === 'all' ? undefined : ip);
      r.log(rateLimits);
      log('admin_reset', cfg?.provider ?? 'none', 'ok', t0, ` scope=${scope} clients=${r.clients} rl=${rateLimits}`);
      return json(res, 200, { ok: true, scope, clients: r.clients, rateLimits });
    }

    if (!rateLimit(ip, brain)) {
      log(action, cfg?.provider ?? 'none', 'rate_limited', t0);
      if (action === 'chat') return ndjson(res, [{ t: 'fallback', reason: 'busy' }]);
      return json(res, 429, { error: 'busy' });
    }
    const key = clientKey(B, ip, sid);
    const ipH = ipHash(B, ip);

    if (action === 'event') {
      // Agendamento enviado (conta também os do fluxo guiado). Só contadores, sem dados pessoais.
      if (body.type === 'booked') {
        withLedger(B, brain, (l) => {
          const c = touchClient(l, key, ipH);
          if (!c.booked) {
            c.booked = true;
            l.booked++;
          }
        });
      }
      res.statusCode = 204;
      return res.end();
    }

    if (!cfg) {
      log(action, 'none', 'unavailable', t0);
      if (action === 'chat') return ndjson(res, [{ t: 'fallback', reason: 'unavailable' }]);
      return json(res, 503, { error: 'unavailable' });
    }

    const snap = withLedger(B, brain, (l) => ({ tier: tierOf(B, brain, l, nextWorst), client: { ...(l.clients[key] ?? newClient()) } }));
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), cfg.timeoutMs);
    req.on('close', () => !res.writableEnded && ctrl.abort());

    /** Medidor ligado ao ledger: reserva o pior caso antes, liquida o real depois. */
    const makeMeter = (kind: 'chat' | 'tts' | 'stt', worst: (chars: number, maxOut: number) => Usage) => {
      const model = billedModel(cfg, kind);
      const st = { denied: false, eur: 0, tokensIn: 0, tokensOut: 0 };
      let resId: string | null = null;
      let worstEur = 0;
      const meter: Meter = {
        before(chars, maxOut) {
          worstEur = costEur(brain, model, worst(chars, maxOut));
          resId = reserve(B, brain, worstEur);
          if (!resId) st.denied = true;
          return !!resId;
        },
        after(usage) {
          const eur = usage ? costEur(brain, model, usage) : worstEur;
          settle(B, brain, resId!, eur, kind, key, ipH);
          st.eur += eur;
          if (usage) {
            st.tokensIn += usage.inText + usage.inAudio;
            st.tokensOut += usage.outText + usage.outAudio;
          }
        },
      };
      return { meter, st };
    };

    try {
      if (action === 'tts') {
        if (!ttsSupported(cfg.provider) || env.AGENT_TTS === 'off') return json(res, 501, { error: 'tts' });
        if (snap.tier !== 'normal') return json(res, 403, { error: 'tts_off' }); // economia: voz do browser (grátis)
        if (snap.client.tts >= brain.budget.maxProviderTts) return json(res, 429, { error: 'tts_quota' });
        const text = String(body.text ?? '').slice(0, brain.limits.ttsMaxChars).trim();
        if (!text) return json(res, 400, { error: 'text' });
        const { meter, st } = makeMeter('tts', () => worstTts(text));
        if (!meter.before(text.length, 0)) return json(res, 402, { error: 'budget' });
        try {
          const audio = await tts(cfg, text, lang, ctrl.signal);
          meter.after(audio.usage);
          res.setHeader('Content-Type', audio.mime);
          res.setHeader('Cache-Control', 'no-store');
          res.end(audio.data);
        } catch (e) {
          meter.after((e as { status?: number }).status ? ZERO : null);
          throw e;
        }
        return log('tts', cfg.provider, 'ok', t0, ` eur=${st.eur.toFixed(5)}`);
      }
      if (action === 'stt') {
        if (!sttSupported(cfg.provider)) return json(res, 501, { error: 'stt' });
        if (snap.tier === 'over') return json(res, 402, { error: 'budget' });
        const audio = Buffer.from(String(body.audio ?? ''), 'base64');
        if (!audio.length || audio.length > brain.limits.sttMaxBytes) return json(res, 400, { error: 'audio' });
        const mime = /^audio\/[\w.+-]+(;.*)?$/.test(String(body.mime)) ? String(body.mime).split(';')[0] : 'audio/webm';
        const { meter, st } = makeMeter('stt', () => worstStt(audio.length));
        if (!meter.before(0, 0)) return json(res, 402, { error: 'budget' });
        try {
          const r = await stt(cfg, audio, mime, ctrl.signal);
          meter.after(r.usage);
          log('stt', cfg.provider, 'ok', t0, ` eur=${st.eur.toFixed(5)}`);
          return json(res, 200, { text: r.text.slice(0, brain.limits.maxMessageChars) });
        } catch (e) {
          meter.after((e as { status?: number }).status ? ZERO : null);
          throw e;
        }
      }

      // ─── chat ───
      const history = normalizeHistory(body.messages, brain);
      if (!history) return json(res, 400, { error: 'messages' });
      const c = snap.client;
      const progress = Math.max(c.eur / B.clientEur, c.turns / B.maxTurns);
      const refuse = (reason: string) => {
        log('chat', cfg.provider, reason, t0);
        return ndjson(res, [{ t: 'fallback', reason }]);
      };
      if (snap.tier === 'over') return refuse('budget');
      if (c.mode === 'closed') return refuse('closed');
      if (progress >= 1) return refuse('client_limit');
      if (snap.tier === 'reserve' && c.turns === 0 && !qualifiedState(body.state)) return refuse('reserve');

      const check = c.mode === 'check' || progress >= brain.budget.checkMatchAt;
      if (body.voice === true) history[history.length - 1].text += '\n[The visitor is using voice.]';
      const slotDay = workdaySlots()[0].slice(0, 10);
      const slotTime = brain.budget.proposedTime;
      let system = buildSystem(brain, lang, body.state);
      if (snap.tier !== 'normal') system += brain.prompts.economy;
      if (check) system += brain.prompts.checkMatch.replace('{slotDay}', slotDay).replace('{slotTime}', slotTime);
      const callCfg = { ...cfg, maxTokens: snap.tier === 'normal' ? cfg.maxTokens : brain.budget.economyMaxOutputTokens };

      startStream(res);
      res.write(`${JSON.stringify({ t: 'meta', tier: snap.tier, check })}\n`);
      if (isInjection(history[history.length - 1].text, brain)) {
        res.write(`${JSON.stringify({ t: 'text', d: brain.guard.redirect[lang] ?? brain.guard.redirect.en })}\n`);
        res.write(`${JSON.stringify({ t: 'done', provider: 'guard' })}\n`);
        log('chat', cfg.provider, 'guard', t0);
        return res.end();
      }

      let textOut = false;
      let outcome: 'qualified' | 'disqualified' | null = null;
      let fails: string[] = [];
      let bookingOpened = false;
      const emit = (e: AgentEvent) => {
        if (e.t === 'text' && e.d) textOut = true;
        // qualify_lead só conta em CHECK MATCH (visto num teste real: o modelo chamou-a no 1.º turno)
        if (e.t === 'tool' && e.name === 'qualify_lead' && !check) return;
        if (e.t === 'tool' && e.name === 'qualify_lead') {
          // regra explícita: só é «qualificado» com os 4 critérios verdadeiros (decide o servidor, não o modelo)
          const a = e.args;
          const crit = { company: a.company === true, pain: a.pain === true, automatable: a.automatable === true, decision: a.decision === true };
          outcome = Object.values(crit).every(Boolean) ? 'qualified' : 'disqualified';
          fails = Object.entries(crit).filter(([, v]) => !v).map(([k]) => k);
          e = { ...e, args: { ...crit, qualified: outcome === 'qualified' } };
        }
        if (e.t === 'tool' && e.name === 'open_booking') bookingOpened = true;
        res.write(`${JSON.stringify(e)}\n`);
      };
      const { meter, st } = makeMeter('chat', (chars, maxOut) => worstChat(brain, chars, maxOut));
      try {
        const tools = check ? brain.tools : brain.tools.filter((t) => t.name !== 'qualify_lead');
        await chat(callCfg, system, history, tools, emit, ctrl.signal, meter);
      } catch (e) {
        log('chat', cfg.provider, `error:${(e as { status?: number }).status ?? (ctrl.signal.aborted ? 'timeout' : 'net')}`, t0, ` eur=${st.eur.toFixed(5)}`);
        emit({ t: 'fallback', reason: 'provider' });
        return res.end();
      }
      if (st.denied && !textOut) {
        log('chat', cfg.provider, 'budget', t0);
        emit({ t: 'fallback', reason: 'budget' });
        return res.end();
      }
      if (check && outcome === 'qualified' && !bookingOpened) {
        emit({ t: 'tool', name: 'open_booking', args: { day: slotDay, time: slotTime } }); // proposta de data garantida
      }
      withLedger(B, brain, (l) => {
        const rec = touchClient(l, key, ipH);
        rec.turns++;
        rec.last = Date.now();
        if (check && rec.mode === 'normal') {
          rec.mode = 'check';
          rec.checkAt = Date.now();
        }
        if (outcome && !rec.outcome) {
          rec.outcome = outcome;
          if (outcome === 'disqualified') {
            rec.mode = 'closed'; // termina a conversa com o LLM
            for (const f of fails) l.fails[f as keyof typeof l.fails]++;
          }
        }
      });
      emit({ t: 'done', provider: cfg.provider });
      log('chat', cfg.provider, 'ok', t0, ` eur=${st.eur.toFixed(5)} in=${st.tokensIn} out=${st.tokensOut} tier=${snap.tier} check=${check ? 1 : 0}${outcome ? ` outcome=${outcome}` : ''}`);
      res.end();
    } catch (e) {
      log(action, cfg.provider, `error:${(e as { status?: number }).status ?? 'net'}`, t0);
      if (!res.headersSent) json(res, 502, { error: 'provider' });
      else res.end();
    } finally {
      clearTimeout(timer);
    }
  };
}

function startStream(res: ServerResponse) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Accel-Buffering', 'no');
}

function ndjson(res: ServerResponse, events: AgentEvent[]) {
  startStream(res);
  res.end(events.map((e) => JSON.stringify(e)).join('\n') + '\n');
}
