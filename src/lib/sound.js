// Sound effects: a recorded cash-register "cha-ching" for sales, the rest synthesised
// with the Web Audio API. Browsers only allow sound after a tap, and every effect here follows one.
// The recording is inlined into the bundle (25 KB) so it works in the single-file Artifact build too.
import chaChingUrl from '../assets/cha-ching.mp3?inline';

let ctx = null;
let enabled = true;

export const setSoundEnabled = (on) => {
  enabled = on;
};

function audio() {
  if (!enabled) return null;
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch {
    return null; // no Web Audio: play silently
  }
}

// One note: a waveform with a quick attack and an exponential fade.
function note(ac, { freq, to, type = 'sine', at = 0, dur = 0.15, vol = 0.2 }) {
  const t = ac.currentTime + at;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

// Decode the recording once, the first time a sound plays.
let chaChing = null;
function loadChaChing(ac) {
  // Decode the base64 data URL by hand: an Artifact page may not fetch() data: URLs.
  chaChing ??= Promise.resolve()
    .then(() => {
      const bin = atob(chaChingUrl.slice(chaChingUrl.indexOf(',') + 1));
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return ac.decodeAudioData(bytes.buffer);
    })
    .catch(() => null);
  return chaChing;
}

async function playRecording(ac, bufferPromise, vol = 0.9) {
  const buffer = await bufferPromise;
  if (!buffer) return;
  const src = ac.createBufferSource();
  const gain = ac.createGain();
  src.buffer = buffer;
  gain.gain.value = vol;
  src.connect(gain).connect(ac.destination);
  src.start();
}

const play = (fn) => () => {
  const ac = audio();
  if (ac) fn(ac);
};

export const sfx = {
  tap: play((ac) => note(ac, { freq: 520, type: 'triangle', dur: 0.05, vol: 0.12 })),
  bidUp: play((ac) => note(ac, { freq: 600, to: 900, type: 'square', dur: 0.08, vol: 0.06 })),
  bidDown: play((ac) => note(ac, { freq: 700, to: 450, type: 'square', dur: 0.08, vol: 0.06 })),
  // Cash register "cha-ching" whenever someone buys an item.
  sold: play((ac) => playRecording(ac, loadChaChing(ac))),
  // Called when an auction starts so the first sale doesn't wait for decoding.
  preload: play((ac) => loadChaChing(ac)),
  free: play((ac) => note(ac, { freq: 400, to: 1200, type: 'sine', dur: 0.18, vol: 0.18 })),
  undo: play((ac) => note(ac, { freq: 900, to: 300, type: 'sawtooth', dur: 0.22, vol: 0.06 })),
  // Rising arpeggio for the theme reveal.
  reveal: play((ac) => {
    [523, 659, 784, 1047].forEach((freq, i) => note(ac, { freq, type: 'triangle', at: i * 0.09, dur: 0.25, vol: 0.15 }));
  }),
  // Short brass-ish fanfare for the winner.
  win: play((ac) => {
    const seq = [
      [392, 0, 0.14],
      [523, 0.15, 0.14],
      [659, 0.3, 0.14],
      [784, 0.45, 0.5],
    ];
    for (const [freq, at, dur] of seq) {
      note(ac, { freq, type: 'sawtooth', at, dur, vol: 0.07 });
      note(ac, { freq: freq * 2, type: 'triangle', at, dur, vol: 0.05 });
    }
  }),
};
