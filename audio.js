// ── AUDIO ENGINE — CLOCKED ARCADE SYNTH ──────────────────

let ctx;
let master, musicBus, sfxBus;
let unlocked = false;
let muted = localStorage.getItem('gb_muted') === 'true';

const LOOKAHEAD      = 25;   // ms — scheduler polling interval
const SCHEDULE_AHEAD = 0.1;  // sec — how far ahead to schedule notes

let nextNoteTime = 0;
let step         = 0;
let timerID      = null;

// ── CONTEXT ──────────────────────────────────────────────
function getCtx(){
  if(!ctx){
    ctx = new (window.AudioContext || window.webkitAudioContext)();

    master   = ctx.createGain();
    musicBus = ctx.createGain();
    sfxBus   = ctx.createGain();

    musicBus.gain.value = 0.6;
    sfxBus.gain.value   = 0.9;
    master.gain.value   = muted ? 0 : 1;

    musicBus.connect(master);
    sfxBus.connect(master);
    master.connect(ctx.destination);
  }
  return ctx;
}

export function isMuted(){ return muted; }

export function toggleMute(){
  muted = !muted;
  localStorage.setItem('gb_muted', muted);
  if(master) master.gain.value = muted ? 0 : 1;
  return muted;
}

function unlock(){
  if(unlocked) return;
  unlocked = true;
  getCtx().resume();
}
document.addEventListener('pointerdown', unlock, { once:true });

// ── SYNTH BUILDERS ───────────────────────────────────────
function osc(type, freq, t, dur, vol, bus){
  const c = getCtx();
  const o = c.createOscillator();
  const g = c.createGain();

  o.type = type;
  o.frequency.setValueAtTime(freq, t);

  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);

  o.connect(g);
  g.connect(bus || sfxBus);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(t, dur, vol){
  const c      = getCtx();
  const buffer = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
  const data   = buffer.getChannelData(0);

  for(let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  const src = c.createBufferSource();
  const g   = c.createGain();

  src.buffer = buffer;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);

  src.connect(g);
  g.connect(sfxBus);
  src.start(t);
}

// ── THEME CLOCK ──────────────────────────────────────────
// Moon Patrol flavour: chromatic bass walk, call/response lead, kick+snare

const BASS = [55,55,58,55,  65,65,62,60,  55,55,58,55,  48,50,52,53];

const LEAD = [
  null,659,null,587,
  523, null,494,null,
  null,659,null,587,
  523, null,440,null
];

function scheduleStep(i, t){
  const b = BASS[i % BASS.length];
  if(b) osc('square', b, t, 0.12, 0.18, musicBus);

  const l = LEAD[i % LEAD.length];
  if(l) osc('square', l, t, 0.10, 0.12, musicBus);

  if(i % 4 === 0) noise(t, 0.05, 0.25); // kick
  if(i % 8 === 4) noise(t, 0.03, 0.15); // snare
}

function scheduler(){
  const c = getCtx();
  while(nextNoteTime < c.currentTime + SCHEDULE_AHEAD){
    scheduleStep(step, nextNoteTime);
    nextNoteTime += (60 / 120) / 2; // 8th notes at 120bpm
    step = (step + 1) % 32;
  }
  timerID = setTimeout(scheduler, LOOKAHEAD);
}

export function startTheme(){
  stopTheme();
  nextNoteTime = getCtx().currentTime;
  step = 0;
  scheduler();
}

export function stopTheme(){
  if(timerID){ clearTimeout(timerID); timerID = null; }
}

// ── DUCKING ──────────────────────────────────────────────
function duck(){
  if(!musicBus) return;
  const now = getCtx().currentTime;
  musicBus.gain.cancelScheduledValues(now);
  musicBus.gain.setValueAtTime(0.6, now);
  musicBus.gain.linearRampToValueAtTime(0.2, now + 0.02);
  musicBus.gain.linearRampToValueAtTime(0.6, now + 0.25);
}

// ── SFX ──────────────────────────────────────────────────
export function playClick(){
  duck();
  osc('square', 600, getCtx().currentTime, 0.04, 0.15);
}

export function playCorrect(){
  duck();
  const t = getCtx().currentTime;
  [600,900,1200].forEach((f,i) => osc('square', f, t+i*0.05, 0.08, 0.2));
}

export function playWrong(){
  duck();
  const t = getCtx().currentTime;
  osc('sawtooth', 200, t,      0.12, 0.3);
  osc('sawtooth', 120, t+0.08, 0.12, 0.3);
  noise(t, 0.08, 0.2);
}

export function playStreak(){
  duck();
  const t = getCtx().currentTime;
  [600,700,900,1100].forEach((f,i) => osc('square', f, t+i*0.04, 0.05, 0.2));
}

export function playTimeout(){
  duck();
  const t = getCtx().currentTime;
  osc('sawtooth', 300, t,      0.15, 0.3);
  noise(t+0.05, 0.1, 0.25);
}

export function playGameOver(){
  stopTheme();
  const t = getCtx().currentTime;
  noise(t, 0.15, 0.6);
  osc('sawtooth',  80, t, 0.30, 0.5);
  osc('square',   160, t, 0.20, 0.4);
  [440,370,311,262,220,185,156,131].forEach((f,i) => {
    osc('sawtooth', f, t + 0.12 + i*0.11, 0.12, 0.28 + i*0.01);
  });
  const tail = t + 0.12 + 8*0.11;
  osc('sawtooth', 55, tail, 0.3, 0.4);
  noise(tail, 0.25, 0.35);
}

export function playVictory(){
  duck();
  const t = getCtx().currentTime;
  [523,659,784,1047,1319].forEach((f,i) => osc('square', f, t+i*0.08, 0.1, 0.22));
}
