/**
 * Endpoint /api/agent.php para `vite dev` e `vite preview` — mesmo contrato do api/agent.php (produção).
 *
 *   GET  ?action=health                         → { llm, provider, tts, stt }
 *   POST { action:'chat', lang, messages, state, voice } → NDJSON: {t:'text'|'tool'|'fallback'|'done'}
 *   POST { action:'tts', lang, text }           → áudio (wav/mp3)
 *   POST { action:'stt', mime, audio(base64) }  → { text }
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { buildSystem, loadBrain, safeLang, type Brain } from './brain';
import { isInjection, normalizeHistory, originAllowed, rateLimit } from './guard';
import { chat, stt, sttSupported, tts, ttsSupported, type AgentEvent, type ProviderConfig, type ProviderId } from './providers';

type Env = Record<string, string | undefined>;
const KEY_VAR: Record<string, string> = { gemini: 'GEMINI_API_KEY', openai: 'OPENAI_API_KEY', anthropic: 'ANTHROPIC_API_KEY' };

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

const log = (action: string, provider: string, status: string, t0: number) =>
  // Sem conteúdo das mensagens, sem IP, sem dados pessoais.
  console.info(`[agent] ${action} provider=${provider} status=${status} ms=${Date.now() - t0}`);

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

export function createAgentMiddleware(env: Env) {
  const extraOrigins = (env.AGENT_ALLOWED_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean);

  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (!req.url || !req.url.startsWith('/api/agent.php')) return next();
    const t0 = Date.now();
    const brain = loadBrain();
    const origin = req.headers.origin;
    if (!originAllowed(origin, req.headers.host, brain, extraOrigins)) return json(res, 403, { error: 'origin' });
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    }
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.statusCode = 204;
      return res.end();
    }
    const cfg = resolveConfig(env, brain);

    if (req.method === 'GET') {
      return json(res, 200, {
        llm: !!cfg,
        provider: cfg?.provider ?? null,
        tts: !!cfg && ttsSupported(cfg.provider) && env.AGENT_TTS !== 'off',
        stt: !!cfg && sttSupported(cfg.provider),
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

    if (!cfg) {
      log(action, 'none', 'unavailable', t0);
      if (action === 'chat') return ndjson(res, [{ t: 'fallback', reason: 'unavailable' }]);
      return json(res, 503, { error: 'unavailable' });
    }
    if (!rateLimit(ip, brain, Date.now(), Number(env.AGENT_DAILY_CAP) || brain.limits.maxGlobalPerDay)) {
      log(action, cfg.provider, 'rate_limited', t0);
      if (action === 'chat') return ndjson(res, [{ t: 'fallback', reason: 'busy' }]);
      return json(res, 429, { error: 'busy' });
    }

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), cfg.timeoutMs);
    req.on('close', () => !res.writableEnded && ctrl.abort());
    try {
      if (action === 'tts') {
        if (!ttsSupported(cfg.provider) || env.AGENT_TTS === 'off') return json(res, 501, { error: 'tts' });
        const text = String(body.text ?? '').slice(0, brain.limits.ttsMaxChars).trim();
        if (!text) return json(res, 400, { error: 'text' });
        const audio = await tts(cfg, text, lang, ctrl.signal);
        res.setHeader('Content-Type', audio.mime);
        res.setHeader('Cache-Control', 'no-store');
        res.end(audio.data);
        return log('tts', cfg.provider, 'ok', t0);
      }
      if (action === 'stt') {
        if (!sttSupported(cfg.provider)) return json(res, 501, { error: 'stt' });
        const audio = Buffer.from(String(body.audio ?? ''), 'base64');
        if (!audio.length || audio.length > brain.limits.sttMaxBytes) return json(res, 400, { error: 'audio' });
        const mime = /^audio\/[\w.+-]+(;.*)?$/.test(String(body.mime)) ? String(body.mime).split(';')[0] : 'audio/webm';
        const text = (await stt(cfg, audio, mime, ctrl.signal)).slice(0, brain.limits.maxMessageChars);
        log('stt', cfg.provider, 'ok', t0);
        return json(res, 200, { text });
      }

      // chat
      const history = normalizeHistory(body.messages, brain);
      if (!history) return json(res, 400, { error: 'messages' });
      if (body.voice === true) history[history.length - 1].text += '\n[The visitor is using voice.]';
      startStream(res);
      const emit = (e: AgentEvent) => res.write(`${JSON.stringify(e)}\n`);
      if (isInjection(history[history.length - 1].text, brain)) {
        emit({ t: 'text', d: brain.guard.redirect[lang] ?? brain.guard.redirect.en });
        emit({ t: 'done', provider: 'guard' });
        log('chat', cfg.provider, 'guard', t0);
        return res.end();
      }
      try {
        await chat(cfg, buildSystem(brain, lang, body.state), history, brain.tools, emit, ctrl.signal);
        emit({ t: 'done', provider: cfg.provider });
        log('chat', cfg.provider, 'ok', t0);
      } catch (e) {
        emit({ t: 'fallback', reason: 'provider' });
        log('chat', cfg.provider, `error:${(e as { status?: number }).status ?? (ctrl.signal.aborted ? 'timeout' : 'net')}`, t0);
      }
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
