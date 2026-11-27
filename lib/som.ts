/**
 * Som da Dominion: um "pika" curto e animado, gerado na hora (sem arquivo de áudio).
 * Toca dentro do app quando chega aviso, postagem ou notificação. (O som do celular com o app
 * fechado é do sistema e não dá para trocar pelo site.)
 */

const CHAVE = "dm_som";
let ctx: AudioContext | null = null;
let ultimo = 0;

export function somLigado(): boolean {
  try {
    return localStorage.getItem(CHAVE) !== "off";
  } catch {
    return true;
  }
}

export function definirSom(ligado: boolean) {
  try {
    localStorage.setItem(CHAVE, ligado ? "on" : "off");
  } catch {
    // sem armazenamento: o som fica sempre ligado
  }
}

function contexto(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  return ctx;
}

/** Os navegadores só liberam áudio depois de um toque: chamamos isto no primeiro toque da pessoa. */
export function liberarAudio() {
  const c = contexto();
  if (c && c.state === "suspended") void c.resume();
}

function nota(c: AudioContext, quando: number, de: number, ate: number, dur: number, volume: number, tipo: OscillatorType) {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = tipo;
  osc.frequency.setValueAtTime(de, quando);
  osc.frequency.exponentialRampToValueAtTime(ate, quando + dur * 0.8);
  g.gain.setValueAtTime(0.0001, quando);
  g.gain.exponentialRampToValueAtTime(volume, quando + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, quando + dur);
  osc.connect(g).connect(c.destination);
  osc.start(quando);
  osc.stop(quando + dur + 0.02);
}

/** "Pika-pika!": dois pulinhos agudos e um brilho no final. `forcar` ignora a chave liga/desliga (botão de teste). */
export function tocarSom(forcar = false) {
  if (!forcar && !somLigado()) return;
  // realtime e push podem chegar juntos: toca uma vez só
  if (!forcar && Date.now() - ultimo < 3000) return;
  ultimo = Date.now();
  const c = contexto();
  if (!c) return;
  if (c.state === "suspended") void c.resume();
  const t = c.currentTime + 0.02;
  nota(c, t, 700, 1500, 0.11, 0.2, "square"); // pi
  nota(c, t + 0.14, 900, 1900, 0.11, 0.2, "square"); // ka
  nota(c, t + 0.3, 1400, 2800, 0.2, 0.12, "triangle"); // brilho
  nota(c, t + 0.3, 2100, 4200, 0.2, 0.05, "sine");
  try {
    navigator.vibrate?.([120, 60, 120]);
  } catch {
    // vibrar é opcional
  }
}
