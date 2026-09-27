/**
 * Voz (carregada só quando o visitante carrega no microfone ou quando há resposta falada).
 *
 * Entrada — caminho principal: gravação no browser (MediaRecorder, funciona em Chrome, Edge, Firefox e
 * Safari) + transcrição no servidor (Gemini), com deteção automática do fim da fala.
 * Alternativa: Web Speech API do browser, só quando a transcrição no servidor não está disponível.
 * (Diagnóstico em Chrome/Edge reais: a Web Speech API depende da cloud do fabricante e terminava em
 * «no-speech» com o microfone a funcionar — o botão parecia não fazer nada.)
 *
 * Saída: TTS do provider; sem ele, speechSynthesis com voz do idioma (pt-PT, …).
 */
import { ENDPOINT, sid } from './session';

export type VoiceError = 'insecure' | 'denied' | 'no-device' | 'no-speech' | 'unsupported' | 'stt-failed';

/** Erro de voz com uma razão que o interface transforma em mensagem + ação. */
export class VoiceFailure extends Error {
  constructor(public reason: VoiceError) {
    super(reason);
  }
}

interface RecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type RecognitionCtor = new () => RecognitionLike;

const Recognition = (): RecognitionCtor | undefined =>
  (window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }).SpeechRecognition ??
  (window as unknown as { webkitSpeechRecognition?: RecognitionCtor }).webkitSpeechRecognition;

/** O microfone só existe em contexto seguro (https ou localhost). Em http://192.168.x.x está bloqueado. */
export const isSecure = () => window.isSecureContext;
export const canRecognize = () => isSecure() && !!Recognition();
export const canRecord = () => isSecure() && typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

/** Traduz erros do browser em razões compreensíveis (nunca engolidos). */
function classify(e: unknown): VoiceError {
  const name = (e as { name?: string; error?: string })?.name ?? (e as { error?: string })?.error ?? String(e);
  if (/NotAllowed|Security|not-allowed|service-not-allowed|Permission/i.test(name)) return 'denied';
  if (/NotFound|NotReadable|Overconstrained|audio-capture/i.test(name)) return 'no-device';
  if (/no-speech/i.test(name)) return 'no-speech';
  return 'unsupported';
}

/* ───────── Caminho principal: gravar + transcrever no servidor ───────── */

export interface Recording {
  /** termina já e envia */
  stop(): void;
  /** cancela sem enviar */
  cancel(): void;
  /** áudio gravado; `spoke` = foi detetada fala */
  done: Promise<{ blob: Blob; spoke: boolean }>;
}

/**
 * Grava com deteção de fala: mede o ruído de fundo, deteta quando a pessoa fala e termina
 * sozinho após ~1,4 s de silêncio (máx. 30 s). Sem fala em 8 s → termina com spoke=false.
 */
export async function record(onLevel: (level: number) => void): Promise<Recording> {
  if (!isSecure()) throw new VoiceFailure('insecure');
  if (!canRecord()) throw new VoiceFailure('unsupported');
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  } catch (e) {
    throw new VoiceFailure(classify(e));
  }
  const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'].find((m) => MediaRecorder.isTypeSupported(m)) ?? '';
  const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);

  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  const ac = Ctx ? new Ctx() : null;
  const analyser = ac?.createAnalyser();
  if (ac && analyser) ac.createMediaStreamSource(stream).connect(analyser);
  const buf = new Float32Array(analyser?.fftSize ?? 2048);

  let spoke = false;
  let cancelled = false;
  let noise = 0.01;
  let lastVoice = 0;
  const t0 = performance.now();
  let timer = 0;

  const finish = () => {
    window.clearInterval(timer);
    if (rec.state === 'recording') rec.stop();
  };
  const done = new Promise<{ blob: Blob; spoke: boolean }>((resolve) => {
    rec.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      void ac?.close();
      onLevel(0);
      resolve({ blob: new Blob(cancelled ? [] : chunks, { type: rec.mimeType || 'audio/webm' }), spoke: spoke && !cancelled });
    };
  });
  rec.start(250);
  timer = window.setInterval(() => {
    const now = performance.now() - t0;
    let rms = 0;
    if (analyser) {
      analyser.getFloatTimeDomainData(buf);
      rms = Math.sqrt(buf.reduce((n, v) => n + v * v, 0) / buf.length);
    }
    if (now < 350) noise = Math.max(noise, rms); // calibra o ruído de fundo
    const threshold = Math.max(0.02, noise * 2.5);
    onLevel(Math.min(1, rms / (threshold * 3)));
    if (rms > threshold) {
      spoke = true;
      lastVoice = now;
    }
    if (!analyser && now > 6000) spoke = true; // sem medição: grava 6 s
    if ((spoke && now - lastVoice > 1400) || (!spoke && now > 8000) || now > 30000) finish();
  }, 80);

  return {
    stop: () => {
      if (!analyser || performance.now() - t0 > 600) spoke = spoke || !analyser;
      finish();
    },
    cancel: () => {
      cancelled = true;
      finish();
    },
    done,
  };
}

export async function transcribe(blob: Blob, lang: string): Promise<string> {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let bin = '';
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'stt', lang, sid: sid(), mime: blob.type, audio: btoa(bin) }),
  });
  if (!res.ok) throw new VoiceFailure('stt-failed');
  return String(((await res.json()) as { text?: string }).text ?? '').trim();
}

/* ───────── Alternativa: Web Speech API do browser ───────── */

export interface Listening {
  stop(): void;
  result: Promise<string>;
}

/** Reconhecimento no browser. Erros viram VoiceFailure (visíveis); fim sem texto = 'no-speech'. */
export function listen(langTag: string, onInterim: (text: string) => void): Listening {
  if (!isSecure()) throw new VoiceFailure('insecure');
  const Ctor = Recognition();
  if (!Ctor) throw new VoiceFailure('unsupported');
  const rec = new Ctor();
  rec.lang = langTag;
  rec.interimResults = true;
  rec.continuous = false;
  rec.maxAlternatives = 1;
  let finalText = '';
  let interimText = '';
  let failure: VoiceFailure | null = null;
  const result = new Promise<string>((resolve, reject) => {
    rec.onresult = (e) => {
      interimText = '';
      finalText = '';
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interimText += r[0].transcript;
      }
      onInterim((finalText + interimText).trim());
    };
    rec.onerror = (e) => {
      if (e.error !== 'aborted') failure = new VoiceFailure(classify(e));
    };
    rec.onend = () => {
      // Se a pessoa parou antes do resultado final, aproveita o texto provisório.
      const text = (finalText || interimText).trim();
      if (text) resolve(text);
      else reject(failure ?? new VoiceFailure('no-speech'));
    };
  });
  rec.start();
  return { stop: () => rec.stop(), result };
}

/* ───────── Saída ───────── */

let current: HTMLAudioElement | null = null;

export function stopSpeaking(): void {
  current?.pause();
  current = null;
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

function browserVoice(langTag: string): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  const base = langTag.split('-')[0];
  return (
    voices.find((v) => v.lang.replace('_', '-').toLowerCase() === langTag.toLowerCase()) ??
    // pt: evitar pt-BR quando houver pt-PT; noutros idiomas, qualquer variante serve
    voices.find((v) => v.lang.toLowerCase().startsWith(`${base}-`) && !(base === 'pt' && /br/i.test(v.lang))) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(base))
  );
}

function speakInBrowser(text: string, langTag: string): Promise<'played' | 'unavailable'> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) return resolve('unavailable');
    const u = new SpeechSynthesisUtterance(text);
    u.lang = langTag;
    const v = browserVoice(langTag);
    if (v) u.voice = v;
    u.rate = 1.02;
    u.onend = () => resolve('played');
    u.onerror = () => resolve('unavailable');
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  });
}

export type SpeakResult = 'provider' | 'browser' | 'blocked' | 'unavailable';

/**
 * Fala a resposta. Tenta o TTS do provider (recusado em modo economia/quota → voz do browser).
 * Se o browser bloquear o áudio (autoplay), devolve 'blocked' — o interface mostra «Ouvir resposta».
 */
export async function speak(text: string, lang: string, langTag: string, serverTts: boolean): Promise<SpeakResult> {
  stopSpeaking();
  if (serverTts) {
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'tts', lang, sid: sid(), text: text.slice(0, 700) }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const url = URL.createObjectURL(await res.blob());
      const audio = new Audio(url);
      current = audio;
      try {
        await audio.play();
      } catch (e) {
        URL.revokeObjectURL(url);
        if ((e as Error).name === 'NotAllowedError') return 'blocked';
        throw e;
      }
      await new Promise<void>((resolve) => {
        audio.onended = audio.onerror = audio.onpause = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
      });
      return 'provider';
    } catch {
      /* TTS do provider indisponível/recusado → voz do browser */
    }
  }
  const r = await speakInBrowser(text, langTag);
  return r === 'played' ? 'browser' : 'unavailable';
}
