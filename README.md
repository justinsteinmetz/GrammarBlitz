# GRAMMARBLITZ

https://justinsteinmetz.github.io/GRAMMARBLITZ/

A diagnostic grammar game. Runs in the browser, no install, no account. Multiplayer via Firebase.

---

## What it does

Players choose a character, pick a mode, and work through a round of grammar questions. The system tracks which mistake types a student makes — not just whether they're right or wrong — and feeds that back at the end of the round with an actionable tip.

It's not a quiz. It's a pattern-recognition engine that adapts to specific error types in real time.

---

## Files

```
index.html        Home screen, character select, mode select, multiplayer lobby
game.html         Solo game (all four modes)
multiplayer.html  Multiplayer: waiting room, countdown, game, podium
shared.js         Re-exports only — single import point for everything
audio.js          Web Audio API sound engine
ui.js             DOM templates, feedback, timer, string constants
content.js        Pattern engine, question banks, stats, diagnosis
style.css         Shared stylesheet
```

**Deploy all eight files to the same directory.** GitHub Pages works out of the box.

---

## Modes

| Mode | What it does |
|---|---|
| Modals | must · should · might · can't · needn't + past forms + subjunctive |
| Tenses | Present perfect vs past simple — signal words and form |
| Write It | Typed answers, both grammar areas |
| Blitz | Mixed, timed, no hints |
| VS Mode | Firebase multiplayer, MC only, live leaderboard |

**Round structure (solo):**
- Q1–6: 2-option MC
- Q7–9: typed (forced production)
- Q10: no hint, 10-second timer
- Weak patterns (wrong ≥ 2): repeated 2–3 questions later, escalated to typed

---

## How the engine works

Questions are not stored as static items. Each pattern has a `build()` function that draws from slot banks (subjects, verbs, times, places, objects) to generate a fresh item on every call. One pattern → many surface variations.

**Pattern types:**

```
tensePat(tag, rule, contrast, buildFn)   — tense patterns with slot substitution
ctxPat(tag, rule, contrast, ctxs, a, w)  — modal patterns with context arrays
```

**Diagnostic clusters** — three error-type variants per key confusion:

| Cluster | A | B | C |
|---|---|---|---|
| Finished time | PP misuse ("I have seen him yesterday") | did + base ("I did see him") | Base form ("She see him") |
| Since / for | Since/for swap | Past simple with "since" | Auxiliary dropped (ongoing state) |
| Modal deduction | must vs might (certainty) | must vs should (deduction vs advice) | must to (form error) |

Each variant has its own pattern ID. Stats track them independently.

---

## Adaptive logic

```
stats[patternId] = [correct, wrong]
```

- Wrong answers increase the wrong count
- Correct answers decrease it by 1 (patterns recover)
- Patterns with higher wrong counts surface more often in future rounds
- Patterns with wrong ≥ 2 get an in-round repeat with a fresh surface and typed escalation
- Typed correct on a repeat scores +11 instead of +10

---

## Diagnosis summary

At the end of each solo round, if any pattern has wrong ≥ 2, the results screen shows a **Pattern Diagnosis** panel — up to three misconceptions, clustered (so A/B/C variants of the same error type count as one), with:

- Wrong count
- Plain-English description of the mistake
- One actionable tip

Example:
```
✗ ×3  Finished time → past simple (not present perfect)
▶ Spot the time marker: yesterday, last week, two days ago → past simple.
```

---

## Typed answers — grammar rejection

The levenshtein fuzzy matcher tolerates typos but rejects grammar errors. If the correct answer doesn't use an auxiliary, answers starting with `have / has / had / did / will / would / must to` are marked wrong even if they're within edit distance. Typos are forgiven. Wrong tense is not.

---

## Multiplayer

Rooms are created with a 4-letter code. Up to ~8 players. Host controls start and round advancement. All players see a live score chip row during the game. Final podium shows top 3 characters on their blocks.

Firebase config is embedded in `index.html` and `multiplayer.html`. The project uses Realtime Database (Europe West region). Questions are serialised to JSON and stored in the room object; all clients deserialise the same pool.

---

## Characters

Five pixel-art characters, each with idle / correct / wrong / streak SVG states and personality speech lines. Players pick one before the game starts; their character appears in the game, on the multiplayer live board, and on the results screen.

| Character | Personality |
|---|---|
| OWLBERT | The Pedant — corrects you even when you're right |
| REX | The Enthusiast — celebrates everything, including mistakes |
| MME CLAW | The Judge — visibly unimpressed |
| TURBO | The Hamster — always running, vibrates at rest |
| SR. FROG | The Philosopher — still, then unhinged on a streak |

---

## Adding patterns

In `content.js`, add to `TP` (tense) or `MP` (modal):

```js
my_pattern: tensePat(
  'Tag label',
  'Rule line — one sentence.',
  'Contrast — ❌ wrong form → ✔ correct form.',
  function(){
    const s=rnd(B.S), v=rnd(B.V), t=rnd(B.T), o=rnd(B.O);
    return mk(this.tag,
      `${s} ___ ${o} ${t}.`, `(signal: ${t})`,
      p(v), `${h(s)} ${pp(v)}`,
      this.rule, this.contra);
  }
),
```

Add the ID to `TENSE_IDS` or `MODAL_IDS`. Add a diagnosis entry to `DIAGNOSES`. Done.

---

## Tech

- Vanilla JS, no framework
- ES modules (`type="module"`)
- Web Audio API — all sounds synthesised, no files
- Firebase Realtime Database (multiplayer only)
- GitHub Pages compatible
- Press Start 2P + Space Mono (Google Fonts)
