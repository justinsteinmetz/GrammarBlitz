// ── SHARED — central export surface ───────────────────────
// This file intentionally contains NO logic.
// It simply re-exports modules so the rest of the app
// can import everything from one place.

// ── AUDIO ────────────────────────────────────────────────
export {
  isMuted,
  toggleMute,

  playClick,
  playCorrect,
  playWrong,
  playStreak,
  playTimeout,
  playVictory,
  playLifeLost,
  playGameOver,
  playBlitzStinger,

  BLITZ_STINGER_MS,
  GAME_OVER_SOUND_MS,

  startTheme,
  stopTheme,
  startBlitzTheme,
  stopBlitzTheme

} from './audio.js';


// ── UI ───────────────────────────────────────────────────
export {
  buildGameScreen,
  buildFeedbackLayer,
  flashFeedback,
  showStreak,
  renderOptions,
  setQTag,
  startTimer,
  updateLives,
  S

} from './ui.js';


// ── CONTENT / ENGINE ─────────────────────────────────────
export {
  CHARS,
  getRound,
  getMultiRound,
  updateStats,
  getDiagnosis,
  shuffle,
  levenshtein,
  saveSession,
  loadSession,
  getToneSequence

} from './content.js';
