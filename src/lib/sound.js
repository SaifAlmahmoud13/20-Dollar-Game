// Sound effects synthesised with the Web Audio API, so there are no files to load.
// Browsers only allow sound after a tap, and every effect here follows one.

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

// A short filtered noise burst: the wooden knock of a gavel.
function knock(ac, at = 0) {
  const t = ac.currentTime + at;
  const buf = ac.createBuffer(1, ac.sampleRate * 0.08, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 3;
  const src = ac.createBufferSource();
  const filter = ac.createBiquadFilter();
  const gain = ac.createGain();
  src.buffer = buf;
  filter.type = 'lowpass';
  filter.frequency.value = 900;
  gain.gain.value = 0.9;
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start(t);
  note(ac, { freq: 180, to: 90, type: 'sine', at, dur: 0.12, vol: 0.35 });
}

const play = (fn) => () => {
  const ac = audio();
  if (ac) fn(ac);
};

export const sfx = {
  tap: play((ac) => note(ac, { freq: 520, type: 'triangle', dur: 0.05, vol: 0.12 })),
  bidUp: play((ac) => note(ac, { freq: 600, to: 900, type: 'square', dur: 0.08, vol: 0.06 })),
  bidDown: play((ac) => note(ac, { freq: 700, to: 450, type: 'square', dur: 0.08, vol: 0.06 })),
  // Gavel twice, then a cash-register "ka-ching".
  sold: play((ac) => {
    knock(ac, 0);
    knock(ac, 0.16);
    note(ac, { freq: 1319, type: 'triangle', at: 0.34, dur: 0.12, vol: 0.18 });
    note(ac, { freq: 1760, type: 'triangle', at: 0.42, dur: 0.35, vol: 0.18 });
  }),
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
