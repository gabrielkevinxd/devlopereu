/**
 * Voz (carregada só quando o visitante carrega no microfone ou quando há resposta falada).
 * Entrada: Web Speech API; sem ela, grava e transcreve no servidor (se o provider suportar).
 * Saída: TTS do provider; sem ele, speechSynthesis do browser com voz do idioma (pt-PT, …).
 */
import { ENDPOINT } from './session';

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

export const canRecognize = () => !!Recognition();
export const canRecord = () => typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

export interface Listening {
  stop(): void;
  result: Promise<string>;
}

/** Reconhecimento no browser. `onInterim` mostra o texto enquanto a pessoa fala. */
export function listen(langTag: string, onInterim: (text: string) => void): Listening {
  const Ctor = Recognition()!;
  const rec = new Ctor();
  rec.lang = langTag;
  rec.interimResults = true;
  rec.continuous = false;
  rec.maxAlternatives = 1;
  let finalText = '';
  const result = new Promise<string>((resolve, reject) => {
    rec.onresult = (e) => {
      let interim = '';
      finalText = '';
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      onInterim((finalText + interim).trim());
    };
    rec.onerror = (e) => (e.error === 'no-speech' || e.error === 'aborted' ? resolve('') : reject(new Error(e.error)));
    rec.onend = () => resolve(finalText.trim());
  });
  rec.start();
  return { stop: () => rec.stop(), result };
}

/** Gravação para transcrição no servidor (browsers sem Web Speech API, p. ex. Firefox). */
export async function record(): Promise<{ stop(): Promise<Blob> }> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((m) => MediaRecorder.isTypeSupported(m)) ?? '';
  const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  rec.start();
  const auto = window.setTimeout(() => rec.state === 'recording' && rec.stop(), 30000); // máx. 30 s
  return {
    stop: () =>
      new Promise<Blob>((resolve) => {
        rec.onstop = () => {
          window.clearTimeout(auto);
          stream.getTracks().forEach((tr) => tr.stop());
          resolve(new Blob(chunks, { type: rec.mimeType || 'audio/webm' }));
        };
        if (rec.state === 'recording') rec.stop();
        else rec.onstop?.(new Event('stop'));
      }),
  };
}

export async function transcribe(blob: Blob, lang: string): Promise<string> {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let bin = '';
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'stt', lang, mime: blob.type, audio: btoa(bin) }),
  });
  if (!res.ok) throw new Error(String(res.status));
  return String(((await res.json()) as { text?: string }).text ?? '').trim();
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

function speakInBrowser(text: string, langTag: string): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) return resolve();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = langTag;
    const v = browserVoice(langTag);
    if (v) u.voice = v;
    u.rate = 1.02;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  });
}

/** Fala a resposta (só é chamada depois de uma interação do visitante — nunca em autoplay). */
export async function speak(text: string, lang: string, langTag: string, serverTts: boolean): Promise<void> {
  stopSpeaking();
  if (serverTts) {
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'tts', lang, text: text.slice(0, 700) }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const url = URL.createObjectURL(await res.blob());
      const audio = new Audio(url);
      current = audio;
      await new Promise<void>((resolve) => {
        audio.onended = audio.onerror = audio.onpause = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        audio.play().catch(() => resolve());
      });
      return;
    } catch {
      /* TTS do provider falhou → voz do browser */
    }
  }
  await speakInBrowser(text, langTag);
}
