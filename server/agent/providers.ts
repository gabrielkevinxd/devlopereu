/**
 * Camada de providers trocável (AGENT_PROVIDER=gemini|openai|anthropic|mock).
 * Mesmo comportamento que api/agent.php. As chaves só existem aqui, no servidor.
 * Cada chamada devolve o usage real do provider (tokens) para o orçamento em euros.
 */
import type { JsonSchema, ToolDef } from './brain';
import { noUsage, type Usage } from './budget';
import type { ChatMsg } from './guard';
import { mockReply, mockUsage } from './mock';

export type ProviderId = 'gemini' | 'openai' | 'anthropic' | 'mock';

export type AgentEvent =
  | { t: 'text'; d: string }
  | { t: 'tool'; name: string; args: Record<string, unknown> }
  | { t: 'meta'; tier: string; check: boolean }
  | { t: 'done'; provider: string }
  | { t: 'fallback'; reason: string };

export interface ProviderConfig {
  provider: ProviderId;
  key: string;
  model: string;
  ttsModel: string;
  voice: string;
  sttModel: string;
  timeoutMs: number;
  maxTokens: number;
  maxRounds: number;
}

export class ProviderError extends Error {
  constructor(public status: number) {
    super(`provider status ${status}`);
  }
}

/**
 * Medidor de custos: `before` reserva o pior caso (false = orçamento não permite esta ronda);
 * `after` liquida com o usage real (null = desconhecido → cobra o pior caso reservado).
 */
export interface Meter {
  before(promptChars: number, maxOut: number): boolean;
  after(usage: Usage | null): void;
}

type Emit = (e: AgentEvent) => void;
interface Call {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

const parseArgs = (s: unknown): Record<string, unknown> => {
  if (s && typeof s === 'object') return s as Record<string, unknown>;
  try {
    const v = JSON.parse(String(s || '{}'));
    return v && typeof v === 'object' ? v : {};
  } catch {
    return {};
  }
};

async function post(url: string, headers: Record<string, string>, body: unknown, signal: AbortSignal) {
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body), signal });
  if (!res.ok) throw new ProviderError(res.status);
  return res;
}

/** Executa uma ronda medida: reserva → chamada → liquida. Erros HTTP não são faturados; falhas de rede cobram o pior caso. */
async function metered<T>(meter: Meter, chars: number, maxOut: number, fn: () => Promise<{ value: T; usage: Usage | null }>): Promise<T | null> {
  if (!meter.before(chars, maxOut)) return null;
  try {
    const { value, usage } = await fn();
    meter.after(usage);
    return value;
  } catch (e) {
    meter.after(e instanceof ProviderError ? noUsage() : null);
    throw e;
  }
}

interface GeminiUsageMeta {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  thoughtsTokenCount?: number;
  promptTokensDetails?: { modality?: string; tokenCount?: number }[];
}
/** usageMetadata do Gemini → Usage (tokens de raciocínio são cobrados como saída). */
function geminiUsage(u: GeminiUsageMeta | undefined, audioOut = false): Usage | null {
  if (!u || u.promptTokenCount === undefined) return null;
  const inAudio = (u.promptTokensDetails ?? []).filter((d) => d.modality === 'AUDIO').reduce((n, d) => n + (d.tokenCount ?? 0), 0);
  const out = (u.candidatesTokenCount ?? 0) + (u.thoughtsTokenCount ?? 0);
  return { inText: u.promptTokenCount - inAudio, inAudio, outText: audioOut ? 0 : out, outAudio: audioOut ? out : 0 };
}

/* ───────────────────────── Gemini (streaming SSE) ───────────────────────── */

const toGeminiSchema = (s: JsonSchema): Record<string, unknown> => {
  const out: Record<string, unknown> = { type: s.type.toUpperCase() };
  if (s.description) out.description = s.description;
  if (s.enum) out.enum = s.enum;
  if (s.required) out.required = s.required;
  if (s.items) out.items = toGeminiSchema(s.items);
  if (s.properties) out.properties = Object.fromEntries(Object.entries(s.properties).map(([k, v]) => [k, toGeminiSchema(v)]));
  return out;
};

async function geminiChat(cfg: ProviderConfig, system: string, history: ChatMsg[], tools: ToolDef[], emit: Emit, signal: AbortSignal, meter: Meter) {
  const contents: unknown[] = history.map((m) => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text }] }));
  const functionDeclarations = tools.map((t) =>
    Object.keys(t.parameters.properties ?? {}).length
      ? { name: t.name, description: t.description, parameters: toGeminiSchema(t.parameters) }
      : { name: t.name, description: t.description },
  );
  // Nos modelos Gemini com raciocínio («thinking»), esses tokens contam para maxOutputTokens: sem folga, a
  // resposta pode sair vazia. 2.5 Flash/Flash-Lite permitem desligar o raciocínio; os restantes
  // (2.5 Pro, 3.x, aliases *-latest) recebem folga para pensar antes de responder.
  const noThinking = /^gemini-2\.5-flash/.test(cfg.model);
  const maxOut = noThinking ? cfg.maxTokens : cfg.maxTokens + 2048;
  const generationConfig: Record<string, unknown> = {
    maxOutputTokens: maxOut,
    temperature: 0.6,
    ...(noThinking ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
  };
  const toolsJson = JSON.stringify(functionDeclarations);

  for (let round = 0; round < cfg.maxRounds; round++) {
    const chars = system.length + toolsJson.length + JSON.stringify(contents).length;
    const r = await metered(meter, chars, maxOut, async () => {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cfg.model)}:streamGenerateContent?alt=sse`;
      const body = {
        systemInstruction: { parts: [{ text: system }] },
        contents,
        tools: [{ functionDeclarations }],
        toolConfig: { functionCallingConfig: { mode: 'AUTO' } },
        generationConfig,
      };
      const res = await post(url, { 'x-goog-api-key': cfg.key }, body, signal);
      const parts: Record<string, unknown>[] = [];
      const calls: Call[] = [];
      let text = '';
      let usage: Usage | null = null;
      const handle = (block: string) => {
        for (const line of block.split(/\r?\n/)) {
          if (!line.startsWith('data:')) continue;
          let json: { candidates?: { content?: { parts?: Record<string, unknown>[] } }[]; usageMetadata?: GeminiUsageMeta };
          try {
            json = JSON.parse(line.slice(5).trim());
          } catch {
            continue;
          }
          usage = geminiUsage(json.usageMetadata) ?? usage; // o último bloco traz o total
          for (const part of json.candidates?.[0]?.content?.parts ?? []) {
            parts.push(part);
            if (typeof part.text === 'string' && !part.thought) {
              text += part.text;
              emit({ t: 'text', d: part.text });
            }
            const fc = part.functionCall as { name?: string; args?: unknown } | undefined;
            if (fc?.name) {
              const call = { id: fc.name, name: fc.name, args: parseArgs(fc.args) };
              calls.push(call);
              emit({ t: 'tool', name: call.name, args: call.args });
            }
          }
        }
      };
      const reader = res.body!.getReader();
      const dec = new TextDecoder();
      let buf = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let m: RegExpMatchArray | null;
        while ((m = buf.match(/\r?\n\r?\n/)) && m.index !== undefined) {
          handle(buf.slice(0, m.index));
          buf = buf.slice(m.index + m[0].length);
        }
      }
      handle(buf);
      return { value: { parts, calls, text }, usage };
    });
    if (!r || !r.calls.length || r.text.trim()) return;
    // Só chamou ferramentas: devolve «ok» e pede o texto para o visitante.
    contents.push({ role: 'model', parts: r.parts });
    contents.push({ role: 'user', parts: r.calls.map((c) => ({ functionResponse: { name: c.name, response: { ok: true } } })) });
  }
}

/* ───────────────────────── OpenAI (Chat Completions) ───────────────────────── */

async function openaiChat(cfg: ProviderConfig, system: string, history: ChatMsg[], tools: ToolDef[], emit: Emit, signal: AbortSignal, meter: Meter) {
  const messages: Record<string, unknown>[] = [{ role: 'system', content: system }, ...history.map((m) => ({ role: m.role, content: m.text }))];
  const fns = tools.map((t) => ({ type: 'function', function: { name: t.name, description: t.description, parameters: t.parameters } }));
  for (let round = 0; round < cfg.maxRounds; round++) {
    const chars = JSON.stringify(messages).length + JSON.stringify(fns).length;
    const r = await metered(meter, chars, cfg.maxTokens, async () => {
      const res = await post(
        'https://api.openai.com/v1/chat/completions',
        { authorization: `Bearer ${cfg.key}` },
        { model: cfg.model, messages, tools: fns, tool_choice: 'auto', max_completion_tokens: cfg.maxTokens },
        signal,
      );
      const json = (await res.json()) as {
        choices?: { message?: { content?: string | null; tool_calls?: { id: string; function: { name: string; arguments: string } }[] } }[];
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };
      const usage = json.usage ? { inText: json.usage.prompt_tokens ?? 0, inAudio: 0, outText: json.usage.completion_tokens ?? 0, outAudio: 0 } : null;
      return { value: json.choices?.[0]?.message ?? {}, usage };
    });
    if (!r) return;
    const text = r.content ?? '';
    if (text) emit({ t: 'text', d: text });
    const calls = (r.tool_calls ?? []).map((c) => ({ id: c.id, name: c.function.name, args: parseArgs(c.function.arguments) }));
    calls.forEach((c) => emit({ t: 'tool', name: c.name, args: c.args }));
    if (!calls.length || text.trim()) return;
    messages.push(r as Record<string, unknown>);
    calls.forEach((c) => messages.push({ role: 'tool', tool_call_id: c.id, content: '{"ok":true}' }));
  }
}

/* ───────────────────────── Anthropic (Messages) ───────────────────────── */

async function anthropicChat(cfg: ProviderConfig, system: string, history: ChatMsg[], tools: ToolDef[], emit: Emit, signal: AbortSignal, meter: Meter) {
  const messages: Record<string, unknown>[] = history.map((m) => ({ role: m.role, content: m.text }));
  const defs = tools.map((t) => ({ name: t.name, description: t.description, input_schema: t.parameters }));
  for (let round = 0; round < cfg.maxRounds; round++) {
    const chars = system.length + JSON.stringify(messages).length + JSON.stringify(defs).length;
    const blocks = await metered(meter, chars, cfg.maxTokens, async () => {
      const res = await post(
        'https://api.anthropic.com/v1/messages',
        { 'x-api-key': cfg.key, 'anthropic-version': '2023-06-01' },
        { model: cfg.model, max_tokens: cfg.maxTokens, system, messages, tools: defs },
        signal,
      );
      const json = (await res.json()) as {
        content?: { type: string; text?: string; id?: string; name?: string; input?: unknown }[];
        usage?: { input_tokens?: number; output_tokens?: number; cache_creation_input_tokens?: number; cache_read_input_tokens?: number };
      };
      const u = json.usage;
      const usage = u
        ? { inText: (u.input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0), inAudio: 0, outText: u.output_tokens ?? 0, outAudio: 0 }
        : null;
      return { value: json.content ?? [], usage };
    });
    if (!blocks) return;
    let text = '';
    const calls: Call[] = [];
    for (const b of blocks) {
      if (b.type === 'text' && b.text) {
        text += b.text;
        emit({ t: 'text', d: b.text });
      }
      if (b.type === 'tool_use' && b.name) {
        const call = { id: b.id ?? b.name, name: b.name, args: parseArgs(b.input) };
        calls.push(call);
        emit({ t: 'tool', name: call.name, args: call.args });
      }
    }
    if (!calls.length || text.trim()) return;
    messages.push({ role: 'assistant', content: blocks });
    messages.push({ role: 'user', content: calls.map((c) => ({ type: 'tool_result', tool_use_id: c.id, content: 'ok' })) });
  }
}

/* ───────────────────────── Mock (testes, sem chave) ───────────────────────── */

async function mockChat(cfg: ProviderConfig, system: string, history: ChatMsg[], tools: ToolDef[], emit: Emit, signal: AbortSignal, meter: Meter) {
  const chars = system.length + JSON.stringify(tools).length + JSON.stringify(history).length;
  await metered(meter, chars, cfg.maxTokens, async () => {
    const { text, tools: calls } = mockReply(history, system);
    const chunks = text.match(/.{1,24}(\s|$)/g) ?? [text];
    for (const c of chunks) {
      if (signal.aborted) break;
      emit({ t: 'text', d: c });
      await new Promise((r) => setTimeout(r, 35));
    }
    calls.forEach((tc) => emit({ t: 'tool', name: tc.name, args: tc.args }));
    // usage sintético realista (≈ 4 caracteres por token), faturado como gemini-2.5-flash
    return { value: null, usage: mockUsage(chars, text.length + JSON.stringify(calls).length) };
  });
}

export async function chat(cfg: ProviderConfig, system: string, history: ChatMsg[], tools: ToolDef[], emit: Emit, signal: AbortSignal, meter: Meter) {
  const impl = { gemini: geminiChat, openai: openaiChat, anthropic: anthropicChat, mock: mockChat }[cfg.provider];
  return impl(cfg, system, history, tools, emit, signal, meter);
}

/* ───────────────────────── Voz: TTS e transcrição ───────────────────────── */

/** PCM 16-bit mono → WAV (o Gemini TTS devolve PCM cru). */
export function pcmToWav(pcm: Buffer, rate = 24000): Buffer {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0);
  h.writeUInt32LE(36 + pcm.length, 4);
  h.write('WAVE', 8);
  h.write('fmt ', 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(rate, 24);
  h.writeUInt32LE(rate * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write('data', 36);
  h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

const ACCENT: Record<string, string> = {
  pt: 'European Portuguese from Portugal (not Brazilian)',
  en: 'British English',
  fr: 'French from France',
  es: 'Spanish from Spain',
  de: 'German',
  sv: 'Swedish',
};

export const ttsSupported = (p: ProviderId) => p === 'gemini' || p === 'openai' || p === 'mock';
export const sttSupported = ttsSupported;

/** Modelo usado para faturar cada tipo de chamada. */
export const billedModel = (cfg: ProviderConfig, kind: 'chat' | 'tts' | 'stt') =>
  cfg.provider === 'mock' ? (kind === 'tts' ? 'mock-tts' : 'mock') : kind === 'tts' ? cfg.ttsModel : kind === 'stt' && cfg.provider === 'openai' ? cfg.sttModel : cfg.model;

export async function tts(cfg: ProviderConfig, text: string, lang: string, signal: AbortSignal): Promise<{ mime: string; data: Buffer; usage: Usage | null }> {
  const style = `Speak in a warm, clear, professional tone, in ${ACCENT[lang] ?? 'the language of the text'}.`;
  if (cfg.provider === 'gemini') {
    const res = await post(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cfg.ttsModel)}:generateContent`,
      { 'x-goog-api-key': cfg.key },
      {
        contents: [{ parts: [{ text: `${style}\n\n${text}` }] }],
        generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: cfg.voice } } } },
      },
      signal,
    );
    const json = (await res.json()) as {
      candidates?: { content?: { parts?: { inlineData?: { mimeType?: string; data?: string } }[] } }[];
      usageMetadata?: GeminiUsageMeta;
    };
    const inline = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData;
    if (!inline?.data) throw new ProviderError(502);
    const rate = Number(/rate=(\d+)/.exec(inline.mimeType ?? '')?.[1] ?? 24000);
    return { mime: 'audio/wav', data: pcmToWav(Buffer.from(inline.data, 'base64'), rate), usage: geminiUsage(json.usageMetadata, true) };
  }
  if (cfg.provider === 'openai') {
    const res = await post(
      'https://api.openai.com/v1/audio/speech',
      { authorization: `Bearer ${cfg.key}` },
      { model: cfg.ttsModel, voice: cfg.voice, input: text, instructions: style, response_format: 'mp3' },
      signal,
    );
    // o endpoint de voz não devolve usage → cobra-se o pior caso reservado
    return { mime: 'audio/mpeg', data: Buffer.from(await res.arrayBuffer()), usage: null };
  }
  if (cfg.provider === 'mock') {
    // 0,6 s de tom suave: exercita o caminho de áudio sem custos reais.
    const rate = 24000;
    const n = Math.round(rate * 0.6);
    const pcm = Buffer.alloc(n * 2);
    for (let i = 0; i < n; i++) pcm.writeInt16LE(Math.round(Math.sin((2 * Math.PI * 440 * i) / rate) * 2500 * Math.min(1, (n - i) / 2000)), i * 2);
    return { mime: 'audio/wav', data: pcmToWav(pcm, rate), usage: { inText: Math.ceil(text.length / 4) + 20, inAudio: 0, outText: 0, outAudio: Math.ceil((text.length / 15) * 25) } };
  }
  throw new ProviderError(501);
}

export async function stt(cfg: ProviderConfig, audio: Buffer, mime: string, signal: AbortSignal): Promise<{ text: string; usage: Usage | null }> {
  if (cfg.provider === 'gemini') {
    const res = await post(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cfg.model)}:generateContent`,
      { 'x-goog-api-key': cfg.key },
      {
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { mimeType: mime, data: audio.toString('base64') } },
              { text: 'Transcribe this audio exactly, in its original language. Output only the transcription.' },
            ],
          },
        ],
        generationConfig: { maxOutputTokens: 300, temperature: 0 },
      },
      signal,
    );
    const json = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[]; usageMetadata?: GeminiUsageMeta };
    return { text: (json.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? '').join('').trim(), usage: geminiUsage(json.usageMetadata) };
  }
  if (cfg.provider === 'openai') {
    const form = new FormData();
    form.append('file', new Blob([audio], { type: mime }), `audio.${mime.includes('mp4') ? 'mp4' : 'webm'}`);
    form.append('model', cfg.sttModel);
    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { authorization: `Bearer ${cfg.key}` },
      body: form,
      signal,
    });
    if (!res.ok) throw new ProviderError(res.status);
    const json = (await res.json()) as {
      text?: string;
      usage?: { input_tokens?: number; output_tokens?: number; input_token_details?: { audio_tokens?: number; text_tokens?: number } };
    };
    const u = json.usage;
    const usage =
      u?.input_tokens !== undefined
        ? { inText: u.input_token_details?.text_tokens ?? 0, inAudio: u.input_token_details?.audio_tokens ?? u.input_tokens, outText: u.output_tokens ?? 0, outAudio: 0 }
        : null;
    return { text: String(json.text ?? '').trim(), usage };
  }
  if (cfg.provider === 'mock') {
    return {
      text: 'Tenho uma loja online e perdemos muito tempo a responder a mensagens de clientes',
      usage: { inText: 30, inAudio: Math.ceil((audio.length / 4000) * 32), outText: 25, outAudio: 0 },
    };
  }
  throw new ProviderError(501);
}
