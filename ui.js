// ── UI ───────────────────────────────────────────────────
import { isMuted, toggleMute } from './audio.js';

// ── STRINGS ──────────────────────────────────────────────
export const S = {
  ready:       'Ready?',
  correct:     '✓ CORRECT!',
  wrong:       '✗ WRONG',
  close:       'CLOSE!',
  time:        'TIME!',
  next:        'NEXT ▶',
  check:       'CHECK ▶',
  waiting:     'WAITING FOR OTHERS…',
  placeholder: 'Type your answer…',
  q:           (i,n) => `Q ${i} / ${n}`,
};

// ── TAG CLASSIFIER ───────────────────────────────────────
export function setQTag(tag){
  const el = document.getElementById('qTag');
  if(!el) return;

  el.textContent = tag;
  el.className = 'q-tag';

  const t = tag.toLowerCase();

  if(t.includes('perfect')||t.includes('signal')||t.includes('superlative')) el.classList.add('tag-pp');
  else if(t.includes('simple')) el.classList.add('tag-ps');
  else if(t.includes('sub')||t.includes('future')) el.classList.add('tag-sub');
  else el.classList.add('tag-modal');
}

// ── GAME SCREEN BUILDER ──────────────────────────────────
export function buildGameScreen(el, mode='solo'){
  const isMulti = mode === 'multi';
  const isWrite = mode === 'write';

  el.innerHTML = `
    <div class="game-header">
      <div class="game-title" id="gameTitle">MODALS</div>
      <div class="hud">
        ${!isMulti ? '<div class="lives" id="livesDisp">❤️❤️❤️</div>' : ''}
        <div class="score-disp" id="scoreDisp">⚡<span id="scoreVal">0</span></div>
        <div class="timer-ring">
          <svg width="40" height="40" viewBox="0 0 40 40">
            <circle class="timer-bg" cx="20" cy="20" r="16"/>
            <circle class="timer-fg" id="timerCircle" cx="20" cy="20" r="16"
              stroke-dasharray="100" stroke-dashoffset="0"/>
          </svg>
          <div class="timer-txt" id="timerTxt">15</div>
        </div>
      </div>
    </div>

    <div class="progress-wrap">
      <div class="progress-fill" id="progressFill"></div>
    </div>

    ${isMulti ? '<div class="live-board" id="liveBoard"></div>' : ''}

    <div class="game-body">
      <div class="q-meta">
        <div class="q-counter" id="qCounter">${S.q(1,12)}</div>
        <div class="q-tag" id="qTag"></div>
      </div>

      <div class="transmission" id="transmission"></div>

      <div class="char-area">
        <div id="charSprite" style="width:40px;height:44px"></div>
        <div class="char-speech" id="charSpeech">${S.ready}</div>
      </div>

      <div class="sentence-box" id="sentenceBox"></div>
      <div class="hint-txt" id="hintTxt"></div>

      <div class="options-grid" id="optGrid"></div>

      ${!isMulti ? `
        <div id="writeArea" style="display:none;flex-direction:column;gap:10px">
          <input class="write-input" id="writeInput"
            placeholder="${S.placeholder}"/>
          <button class="write-submit" id="writeSubmit">${S.check}</button>
        </div>
        <div class="correct-reveal" id="correctReveal"></div>
      ` : ''}

      <div class="expl" id="expl"></div>

      ${isMulti ? `<div class="wait-msg" id="waitOthers">${S.waiting}</div>` : ''}
    </div>

    <button class="next-btn" id="nextBtn">${S.next}</button>
  `;
}

// ── LIVES ───────────────────────────────────────────────
export function updateLives(lives){
  const el = document.getElementById('livesDisp');
  if(!el) return;

  el.textContent =
    '❤️'.repeat(Math.max(0,lives)) +
    '🖤'.repeat(Math.max(0,3-lives));

  if(lives < 3){
    el.style.animation='none';
    void el.offsetWidth;
    el.style.animation='shake 0.4s ease';
  }
}

// ── FEEDBACK LAYER ───────────────────────────────────────
export function buildFeedbackLayer(parent=document.body){
  const flash  = document.createElement('div');
  flash.className='flash'; flash.id='flash';

  const streak = document.createElement('div');
  streak.className='streak'; streak.id='streakBadge';

  const mute = document.createElement('button');
  mute.className='mute-btn'; mute.id='muteBtn';
  mute.textContent = isMuted() ? '🔇' : '🔊';

  mute.onclick = () => {
    mute.textContent = toggleMute() ? '🔇' : '🔊';
  };

  parent.append(flash, streak, mute);
}

// ── FEEDBACK ─────────────────────────────────────────────
export function flashFeedback(msg, type=''){
  const f = document.getElementById('flash');
  if(!f) return;

  f.textContent = msg;
  f.className = 'flash' + (type ? ' '+type : '');

  void f.offsetWidth;
  f.classList.add('show');

  setTimeout(()=>f.classList.remove('show'), 1000);
}

export function showStreak(n){
  const b = document.getElementById('streakBadge');
  if(!b) return;

  b.textContent = `🔥 ${n}x COMBO!`;
  b.style.display = 'block';

  setTimeout(()=>b.style.display='none', 1500);
}

// ── OPTIONS ──────────────────────────────────────────────
export function renderOptions(opts, onAnswer){
  const og = document.getElementById('optGrid');
  if(!og) return;

  og.innerHTML = '';

  opts.forEach(opt=>{
    const btn = document.createElement('button');
    btn.className = 'opt-btn';
    btn.textContent = opt;
    btn.onclick = ()=>onAnswer(btn, opt);
    og.appendChild(btn);
  });
}

// ── TIMER ────────────────────────────────────────────────
export function startTimer(secs, onTimeout){
  const circ = document.getElementById('timerCircle');
  const txt  = document.getElementById('timerTxt');

  if(!circ||!txt) return null;

  let t = secs;
  txt.textContent = t;

  const id = setInterval(()=>{
    t--;
    txt.textContent = t;

    circ.style.strokeDashoffset = 100*(1-t/secs);

    if(t<=3) circ.style.stroke = 'var(--accent2)';
    if(t<=0){
      clearInterval(id);
      onTimeout?.();
    }
  },1000);

  return id;
}
