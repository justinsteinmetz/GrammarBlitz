// ── AUDIO ENGINE — ARCADE STYLE ───────────────────────────

let ctx = null;
let unlocked = false;
let muted = localStorage.getItem('gb_muted') === 'true';

function getCtx(){
  if(!ctx){
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return ctx;
}

function unlock(){
  if(unlocked) return;
  unlocked = true;
  try{
    getCtx().resume();
  }catch{}
}

document.addEventListener('pointerdown', unlock, { once:true });

// ── CORE SYNTH ────────────────────────────────────────────
function tone(freq, type='square', dur=0.1, vol=0.2, delay=0){
  if(muted) return;

  const c = getCtx();
  const t = c.currentTime + delay;

  const osc = c.createOscillator();
  const gain = c.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);

  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

  osc.connect(gain);
  gain.connect(c.destination);

  osc.start(t);
  osc.stop(t + dur + 0.02);
}

// ── DRUMS (NOISE BURST) ───────────────────────────────────
function noise(dur=0.05, vol=0.2, delay=0){
  if(muted) return;

  const c = getCtx();
  const t = c.currentTime + delay;

  const buffer = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
  const data = buffer.getChannelData(0);

  for(let i=0;i<data.length;i++){
    data[i] = Math.random()*2-1;
  }

  const src = c.createBufferSource();
  const gain = c.createGain();

  src.buffer = buffer;
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

  src.connect(gain);
  gain.connect(c.destination);

  src.start(t);
}

// ── UI SFX ────────────────────────────────────────────────
export function playClick(){
  tone(600,'square',0.03,0.12);
}

export function playCorrect(){
  setTimeout(()=>{
    tone(600,'square',0.05,0.18);
    tone(900,'square',0.05,0.18,0.05);
    tone(1200,'square',0.08,0.2,0.1);
  }, 30);
}

export function playWrong(){
  tone(200,'sawtooth',0.12,0.3);
  tone(120,'sawtooth',0.12,0.3,0.08);
  noise(0.08,0.2);
}

export function playStreak(){
  [600,700,900,1100].forEach((f,i)=>tone(f,'square',0.05,0.2,i*0.04));
}

export function playTimeout(){
  tone(300,'sawtooth',0.15,0.3);
  noise(0.1,0.25,0.05);
}

export function playVictory(){
  [523,659,784,1047,1319].forEach((f,i)=>tone(f,'square',0.1,0.22,i*0.08));
}

export function playLifeLost(){
  tone(250,'sawtooth',0.1,0.3);
  tone(180,'sawtooth',0.12,0.3,0.1);
}

export function playGameOver(){
  const c = getCtx();
  if(muted) return;

  // Impact hit — layered noise burst + low tone
  noise(0.15, 0.6, 0);
  tone(80, 'sawtooth', 0.3, 0.5, 0);
  tone(160, 'square',  0.2, 0.4, 0);

  // Falling chromatic phrase — each note darker, slower
  const fall = [440, 370, 311, 262, 220, 185, 156, 131];
  fall.forEach((f, i) => {
    const delay = 0.12 + i * 0.11;
    tone(f, 'sawtooth', 0.12 + i*0.015, 0.38, delay);
  });

  // Final low thud + noise tail
  tone(55, 'sawtooth', 0.35, 0.6, 0.12 + fall.length * 0.11);
  noise(0.25, 0.4, 0.12 + fall.length * 0.11);
}

export function playBlitzStinger(){
  tone(900,'square',0.05,0.2);
  tone(1200,'square',0.08,0.22,0.05);
  tone(1600,'square',0.12,0.25,0.1);
}

export const BLITZ_STINGER_MS = 400;
export const GAME_OVER_SOUND_MS = 1600;

// ── MOON PATROL STYLE THEME ───────────────────────────────
// 120bpm, 8-bar phrase, chromatic walking bass, melodic lead with shape

let themeTimer = null;

export function startTheme(){
  stopTheme();

  const bpm   = 120;
  const b     = 60000 / bpm;   // one beat in ms
  const s     = b / 2;         // one 8th note

  // ── LEAD MELODY (8 bars, 16th-note grid) ─────────────────
  // Moon Patrol flavour: swagger, slight melancholy, ends on a lift
  const LEAD = [
    // bar 1
    [0,   659, 0.14],   // E5
    [s,   587, 0.12],   // D5
    [s*2, 523, 0.13],   // C5
    [s*3, 494, 0.10],   // B4
    // bar 2
    [b*2, 440, 0.14],   // A4
    [b*2+s, 494, 0.10], // B4
    [b*3, 523, 0.14],   // C5
    [b*3+s, 587, 0.10], // D5
    // bar 3
    [b*4, 659, 0.15],   // E5
    [b*4+s, 659, 0.10],
    [b*5, 587, 0.13],
    [b*5+s, 523, 0.10],
    // bar 4
    [b*6, 494, 0.14],
    [b*6+s*2, 440, 0.16], // resolve down
    // bar 5 — call
    [b*8,  784, 0.14],  // G5
    [b*8+s,698, 0.11],  // F5
    [b*9,  659, 0.14],  // E5
    [b*9+s,587, 0.10],  // D5
    // bar 6
    [b*10, 523, 0.14],
    [b*10+s,494,0.10],
    [b*11, 440, 0.15],
    // bar 7 — lift
    [b*12, 523, 0.13],
    [b*12+s,587,0.11],
    [b*13, 659, 0.14],
    [b*13+s,784,0.12],
    // bar 8 — peak and resolve
    [b*14, 880, 0.16],
    [b*14+s,784,0.12],
    [b*15, 659, 0.14],
    [b*15+s,587,0.10],
  ];

  // ── WALKING BASS (chromatic, 1 note per beat) ─────────────
  const BASS = [
    [0,     110, 0.22],  // A2
    [b,     117, 0.20],  // Bb2
    [b*2,   123, 0.22],  // B2
    [b*3,   131, 0.20],  // C3
    [b*4,   123, 0.20],  // B2
    [b*5,   110, 0.22],  // A2
    [b*6,    98, 0.20],  // G2
    [b*7,   110, 0.22],  // A2
    [b*8,   110, 0.22],
    [b*9,   117, 0.20],
    [b*10,  131, 0.22],
    [b*11,  147, 0.20],  // D3
    [b*12,  131, 0.20],
    [b*13,  123, 0.22],
    [b*14,  110, 0.22],
    [b*15,  117, 0.20],
  ];

  // ── KICK + SNARE pattern (on beat, snare on 2 & 4) ────────
  function kick(ms){ noise(0.06, 0.35, ms/1000); }
  function snare(ms){
    noise(0.08, 0.28, ms/1000);
    tone(220, 'triangle', 0.04, 0.10, ms/1000);
  }
  function hihat(ms){ noise(0.02, 0.10, ms/1000); }

  function loop(){
    if(muted) return;

    // Lead
    LEAD.forEach(([off, freq, vol]) =>
      tone(freq, 'square', 0.09, vol, off/1000)
    );

    // Bass
    BASS.forEach(([off, freq, vol]) =>
      tone(freq, 'triangle', 0.18, vol, off/1000)
    );

    // Drums — kick/snare/hihat across 8 bars
    for(let bar=0; bar<8; bar++){
      const o = bar * b;
      kick(o);
      hihat(o + s);
      snare(o + b);
      hihat(o + b + s);
      kick(o + b*2);
      hihat(o + b*2 + s);
      snare(o + b*3);
      hihat(o + b*3 + s);
    }

    themeTimer = setTimeout(loop, b * 16);
  }

  loop();
}

export function stopTheme(){
  if(themeTimer) clearTimeout(themeTimer);
  themeTimer = null;
}

// ── BLITZ THEME (FASTER / MORE INTENSE) ───────────────────

let blitzTimer = null;

export function startBlitzTheme(){
  stopTheme();
  stopBlitzTheme();

  const tempo = 170;
  const beat = 60 / tempo;

  function loop(){
    if(muted) return;

    tone(880,'square',0.08,0.2,0);
    tone(1100,'square',0.08,0.2,beat);
    tone(1320,'square',0.08,0.2,beat*2);
    tone(1100,'square',0.08,0.2,beat*3);

    tone(150,'triangle',0.15,0.14,0);
    tone(180,'triangle',0.15,0.14,beat*2);

    noise(0.02,0.15,0);
    noise(0.02,0.15,beat);
    noise(0.02,0.15,beat*2);
    noise(0.02,0.15,beat*3);

    blitzTimer = setTimeout(loop, beat*4000);
  }

  loop();
}

export function stopBlitzTheme(){
  if(blitzTimer) clearTimeout(blitzTimer);
  blitzTimer = null;
}

// ── MUTE ─────────────────────────────────────────────────
export function toggleMute(){
  muted = !muted;
  localStorage.setItem('gb_muted', muted);
  return muted;
}

export function isMuted(){
  return muted;
}
