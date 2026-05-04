// ── BANK ─────────────────────────────────────────────────
const B = {
  S: ['I','She','He','They','We'],
  T: ['yesterday','last week','last night','two days ago','last summer'],
  P: ['Prague','Berlin','Tokyo','New York','Oslo'],
  N: [1,2,3,4,5,6],
  U: ['day','week','month','year'],
  ADJ: ['best','most interesting','worst','most difficult','most beautiful'],
  NOUN: ['film','meal','book','game','trip'],
};

// ── VERB-OBJECT PAIRS ────────────────────────────────────
// Each entry: base form, past, past participle, objects that make sense with it
const PAIRS = [
  { v:'see',    past:'saw',      pp:'seen',      o:['the film','the exhibition','the game','the show'] },
  { v:'eat',    past:'ate',      pp:'eaten',     o:['breakfast','lunch','the cake','dinner'] },
  { v:'write',  past:'wrote',    pp:'written',   o:['the report','an email','the essay','the letter'] },
  { v:'break',  past:'broke',    pp:'broken',    o:['the window','a cup','the record','the screen'] },
  { v:'forget', past:'forgot',   pp:'forgotten', o:['the meeting','her name','the password','the deadline'] },
  { v:'take',   past:'took',     pp:'taken',     o:['the wrong train','a break','the bus','too long'] },
  { v:'give',   past:'gave',     pp:'given',     o:['a presentation','the wrong answer','feedback','a speech'] },
  { v:'speak',  past:'spoke',    pp:'spoken',    o:['to the manager','to her','to anyone','to the class'] },
  { v:'drive',  past:'drove',    pp:'driven',    o:['to work','there','that route','to school'] },
  { v:'choose', past:'chose',    pp:'chosen',    o:['the wrong option','a new path','that one','carefully'] },
];

const rndPair = () => PAIRS[Math.floor(Math.random()*PAIRS.length)];
const rndO = pair => pair.o[Math.floor(Math.random()*pair.o.length)];

const p  = v => { const pr=PAIRS.find(x=>x.v===v); return pr?pr.past:v+'ed'; };
const pp = v => { const pr=PAIRS.find(x=>x.v===v); return pr?pr.pp:v+'ed'; };
const h  = s => (s==='She'||s==='He') ? 'has' : 'have';
const rnd = a => a[Math.floor(Math.random()*a.length)];
const opt = (a,b) => {
  // Guard: if answer === wrong, manufacture a plausible distractor
  if(a === b){
    const fallbacks = ['have done','did','has done','had done','do'];
    const alt = fallbacks.find(f=>f!==a) || 'did';
    return Math.random()>0.5 ? [a,alt] : [alt,a];
  }
  return Math.random()>0.5 ? [a,b] : [b,a];
};

// ── ITEM ─────────────────────────────────────────────────
const mk = (tag,sentence,hint,answer,wrong,rule,contra) => ({
  tag, sentence, hint,
  options: opt(answer,wrong), answer,
  expl:`<strong>${rule}</strong>`,
  contra:`<em>${contra}</em>`
});

// ── PATTERN FACTORIES ────────────────────────────────────
// ctxPat: modal-style pattern — pick from context array, fixed answer/wrong
const ctxPat = (tag, rule, contra, ctxs, ans, wrg) => ({
  tag, build(){
    const c = rnd(ctxs);
    return mk(tag, c.s, c.h, c.a||ans, c.w||wrg, rule, contra);
  }
});

// tensePat: PP vs PS pattern driven by signal word + builder function
const tensePat = (tag, rule, contra, buildFn) => ({
  tag, build: buildFn.bind({tag,rule,contra})
});

// ── TENSE PATTERNS ───────────────────────────────────────
const TP = {

  // ── CLUSTER: finished time (3 error types) ───────────────
  // Each variant: locked finished-time signal in stem, pure distractor

  // A: PP misuse — "I have seen him yesterday"
  pp_finished_time_A: tensePat(
    'Signal: finished time',
    'Finished time → past simple. No present perfect with finished time.',
    null,
    function(){
      const s=rnd(B.S),pair=rndPair(),t=rnd(B.T),o=rndO(pair),v=pair.v;
      return mk(this.tag,
        `${s} ___ ${o} ${t}.`, `(signal: ${t})`,
        p(v), `${h(s)} ${pp(v)}`,
        this.rule,
        `❌ ${s} ${h(s)} ${pp(v)} ${o} ${t}. → ✔ ${s} ${p(v)} ${o} ${t}.`);
    }
  ),

  // B: did + base — "I did see him yesterday"
  pp_finished_time_B: tensePat(
    'Signal: finished time',
    "Past simple = past form alone. 'did' + base = questions/negatives only.",
    null,
    function(){
      const s=rnd(B.S),pair=rndPair(),t=rnd(B.T),o=rndO(pair),v=pair.v;
      return mk(this.tag,
        `${s} ___ ${o} ${t}.`, `(signal: ${t})`,
        p(v), `did ${v}`,
        this.rule,
        `❌ ${s} did ${v} ${o} ${t}. → ✔ ${s} ${p(v)} ${o} ${t}.`);
    }
  ),

  // C: base form — "She see him yesterday" (L1 transfer / overgeneralisation)
  // Weighted toward he/she to expose agreement failure
  pp_finished_time_C: tensePat(
    'Signal: finished time',
    'Past simple requires the past form, not the base form.',
    null,
    function(){
      const s=rnd(['She','He','They','We']),pair=rndPair(),t=rnd(B.T),o=rndO(pair),v=pair.v;
      return mk(this.tag,
        `${s} ___ ${o} ${t}.`, `(signal: ${t})`,
        p(v), v,
        this.rule,
        `❌ ${s} ${v} ${o} ${t}. → ✔ ${s} ${p(v)} ${o} ${t}.`);
    }
  ),

  // ── CLUSTER: since/for (3 error types) ───────────────────
  // A: since/for swap — uses 'since' with duration or 'for' with point
  pp_since_for_A: tensePat(
    'Signal: since/for',
    "'since' = point in time. 'for' = duration.",
    null,
    function(){
      if(Math.random()>0.5){
        // Test: duration → should use 'for'
        const s=rnd(B.S),n=rnd([1,2,3,4,5]),u=rnd(['month','year']),pl=rnd(B.P);
        const dur=`${n} ${u}${n>1?'s':''}`;
        return mk(this.tag,
          `${s} ${h(s)} lived in ${pl} ___ ${dur}.`, `(how long? for or since?)`,
          `for`, `since`,
          this.rule,
          `❌ since ${dur} → ✔ for ${dur}  |  'since' needs a point: since 2020`);
      } else {
        // Test: point in time → should use 'since'
        const s=rnd(['She','He']),pl=rnd(B.P),yr=2015+Math.floor(Math.random()*8);
        return mk(this.tag,
          `${s} has lived in ${pl} ___ ${yr}.`, `(starting when? for or since?)`,
          `since`, `for`,
          this.rule,
          `❌ for ${yr} → ✔ since ${yr}  |  'for' needs a duration: for 3 years`);
      }
    }
  ),

  // B: past simple instead of PP with 'since'
  pp_since_for_B: tensePat(
    'Signal: since',
    "'since' + present state → present perfect, not past simple.",
    null,
    function(){
      const s=rnd(['She','He']),pl=rnd(B.P),yr=2015+Math.floor(Math.random()*8);
      return mk(this.tag,
        `${s} ___ in ${pl} since ${yr}.`, '(signal: since — still true)',
        `${h(s)} lived`, `lived`,
        this.rule,
        `❌ ${s} lived in ${pl} since ${yr}. → ✔ ${s} ${h(s)} lived in ${pl} since ${yr}.`);
    }
  ),

  // C: drop auxiliary — "She lived here for three years" (when still living there)
  pp_since_for_C: tensePat(
    'Signal: for (ongoing)',
    "Ongoing state + 'for' → present perfect. Past simple = finished.",
    null,
    function(){
      const s=rnd(['She','He','I','We']),pl=rnd(B.P),n=rnd([1,2,3]),u=rnd(['month','year']);
      const dur=`${n} ${u}${n>1?'s':''}`;
      return mk(this.tag,
        `${s} ___ in ${pl} for ${dur} (and still ${s==='I'?'do':'does'}).`, '(still ongoing)',
        `${h(s)} lived`, `lived`,
        this.rule,
        `❌ ${s} lived here for ${dur} (but not finished). → ✔ ${s} ${h(s)} lived here for ${dur}.`);
    }
  ),

  // ── CLUSTER: modal deduction (3 error types) ─────────────
  // A: must vs might — certainty gradient
  // Contexts deliberately signal strong evidence to prevent guessing
  modal_deduction_A: ctxPat('Deduction',
    "Strong evidence → must. Weak/no evidence → might.",
    "She must be tired (I can see it clearly). / She might be tired (I'm not sure).",
    [{s:"She's been awake for 24 hours — she ___ be exhausted.",h:"(clear evidence: 24h awake)"},
     {s:"He hasn't eaten since yesterday — he ___ be starving.",h:"(clear evidence: no food)"},
     {s:"They drove 800km today — they ___ be tired.",h:"(clear evidence: 800km)"}],
    "must","might"),

  // B: must vs should — deduction vs advice
  modal_deduction_B: ctxPat('Deduction',
    "must = logical deduction from evidence. should = advice or expectation.",
    "She must be tired (I can see it). / She should rest (my advice).",
    [{s:"Look at her — she ___ be exhausted.",h:"(deduction from visible evidence)"},
     {s:"The lights are off — they ___ have left already.",h:"(logical conclusion)"},
     {s:"He scored 100% — he ___ have studied hard.",h:"(deduction)"}],
    "must","should"),

  // C: modal + to — form error ("she must to go")
  modal_deduction_C: {
    tag:'Modal form',
    build(){
      const ctxs=[
        {s:"She ___ be at home — her car is outside.",h:"(no 'to' after modal)",a:"must",w:"must to"},
        {s:"They ___ have left — the door is locked.",h:"(no 'to' after modal)",a:"must have",w:"must to have"},
        {s:"He ___ be right — everything checks out.",h:"(no 'to' after modal)",a:"must",w:"must to"},
      ];
      const c=rnd(ctxs);
      return mk(this.tag,c.s,c.h,c.a,c.w,
        "Modal verbs never take 'to' (except 'ought to').",
        `❌ She must to be here. → ✔ She must be here.`);
    }
  },

  pp_already: tensePat(
    'Signal: already',
    "'already' → present perfect.",
    'I have already seen it. / I saw it yesterday.',
    function(){ const s=rnd(B.S),pair=rndPair(),o=rndO(pair),v=pair.v;
      return mk(this.tag,`${s} ___ ${o} already.`,'(signal: already)',`${h(s)} ${pp(v)}`,`${p(v)}`,this.rule,this.contra); }
  ),

  pp_ever: tensePat(
    'Signal: ever',
    "'ever' → present perfect (life experience).",
    'Have you ever been? / Did you go last year?',
    function(){ const pl=rnd(B.P);
      return mk(this.tag,`Have you ever ___ to ${pl}?`,'(signal: ever)','been','went',this.rule,this.contra); }
  ),

  pp_since: tensePat(
    'Signal: since',
    "'since' + present state → present perfect.",
    'She has lived here since 2018. / She lived here in 2018.',
    function(){ const s=rnd(['She','He']),pl=rnd(B.P),yr=2015+Math.floor(Math.random()*8);
      return mk(this.tag,`${s} ___ in ${pl} since ${yr}.`,'(signal: since)',`${h(s)} lived`,'lived',this.rule,this.contra); }
  ),

  pp_just: tensePat(
    'Signal: just',
    "'just' → present perfect.",
    'I have just finished. / I finished an hour ago.',
    function(){ const s=rnd(B.S),pair=rndPair(),o=rndO(pair),v=pair.v;
      return mk(this.tag,`${s} ${h(s)} just ___ ${o}.`,'(signal: just)',pp(v),p(v),this.rule,this.contra); }
  ),

  pp_never: tensePat(
    'Signal: never',
    "'never' → present perfect (life total).",
    'I have never seen it. / I never saw it there.',
    function(){ const s=rnd(B.S),pair=rndPair(),o=rndO(pair),v=pair.v;
      return mk(this.tag,`${s} ${h(s)} never ___ ${o}.`,'(signal: never)',pp(v),p(v),this.rule,this.contra); }
  ),

  pp_ago: tensePat(
    'Signal: ago',
    "'ago' → always past simple.",
    'She got it two months ago. / She has already got it.',
    function(){ const s=rnd(B.S),pair=rndPair(),o=rndO(pair),v=pair.v,n=rnd(B.N),u=rnd(B.U);
      return mk(this.tag,`${s} ___ ${o} ${n} ${u}${n>1?'s':''} ago.`,'(signal: ago)',p(v),`${h(s)} ${pp(v)}`,this.rule,this.contra); }
  ),

  pp_for: tensePat(
    'Signal: for',
    "'for' + ongoing state → present perfect.",
    'I have lived here for three years. / I lived there for a year (then left).',
    function(){ const s=rnd(B.S),pl=rnd(B.P),n=rnd([1,2,3,4,5]),u=rnd(['month','year']);
      return mk(this.tag,`${s} ___ in ${pl} for ${n} ${u}${n>1?'s':''}.`,'(signal: for)',`${h(s)} lived`,'lived',this.rule,this.contra); }
  ),

  pp_superlative: tensePat(
    'Superlative + ever',
    'Superlative + ever → present perfect.',
    'This is the best I have ever seen. / It was the best I saw that year.',
    function(){ const adj=rnd(B.ADJ),noun=rnd(B.NOUN);
      return mk(this.tag,`This is the ${adj} ${noun} I have ever ___.`,'(superlative + ever)','seen','saw',this.rule,this.contra); }
  ),

  pp_yet: tensePat(
    'Signal: yet',
    "'yet' → present perfect (question/negative).",
    "Haven't you finished yet? / Did you finish already?",
    function(){ const pair=rndPair(),o=rndO(pair),v=pair.v;
      return mk(this.tag,`Have you ___ ${o} yet?`,'(signal: yet)',pp(v),p(v),this.rule,this.contra); }
  ),
};

// ── MODAL PATTERNS ───────────────────────────────────────
const MP = {

  neednt_mustnt: ctxPat('Core modal',
    "needn't = not necessary. mustn't = forbidden.",
    "You needn't bring cash. / You mustn't bring weapons.",
    [{s:"You ___ bring extra cash — everything is paid for.",h:"(not required)"},
     {s:"You ___ worry — it's all arranged.",h:"(no necessity)"},
     {s:"You ___ bring a gift — it's not expected.",h:"(not required)"}],
    "needn't","mustn't"),

  cant_neednt: ctxPat('Core modal',
    "can't = not allowed. needn't = not necessary.",
    "You can't use your phone. / You needn't bring your phone.",
    [{s:"You ___ use your phone during the exam.",h:"(not permitted)"},
     {s:"You ___ park here — it's a bus lane.",h:"(not allowed)"},
     {s:"You ___ enter without a pass.",h:"(not permitted)"}],
    "can't","needn't"),

  should_must: ctxPat('Core modal',
    "should = advice. must = strong obligation.",
    "You should eat more vegetables. / You must wear a seatbelt.",
    [{s:"It's cold outside — you ___ take a coat.",h:"(advice)"},
     {s:"You ___ get more sleep — you look exhausted.",h:"(advice)"},
     {s:"You ___ try the food here — it's excellent.",h:"(recommendation)"}],
    "should","must"),

  must_should: ctxPat('Core modal',
    "must = internal necessity (you feel it). should = advice or recommendation.",
    "I must call her — I feel terrible. / You should call her — it would be nice.",
    [{s:"I ___ stop eating so much sugar — my health is suffering.",h:"(personal necessity)"},
     {s:"She ___ get more sleep — she's exhausted every day.",h:"(strong personal need)"},
     {s:"I ___ finish this before I do anything else.",h:"(internal pressure)"}],
    "must","should"),

  must_deduction: ctxPat('Deduction',
    "must = strong logical deduction.",
    "She must be tired. / She might be tired.",
    [{s:"She's been studying all night — she ___ be exhausted.",h:"(near-certain)"},
     {s:"He's answered everything right — he ___ have prepared well.",h:"(near-certain)"},
     {s:"They've been travelling for 20 hours — they ___ be hungry.",h:"(near-certain)"}],
    "must","might"),

  cant_deduction: ctxPat('Deduction',
    "can't = logical impossibility.",
    "That can't be right. / That mustn't be right (different meaning).",
    [{s:"The numbers don't add up — that ___ be right.",h:"(impossibility)"},
     {s:"She left an hour ago — she ___ be here already.",h:"(logically impossible)"},
     {s:"He said he was in London — he ___ be in Paris too.",h:"(impossibility)"}],
    "can't","mustn't"),

  neednt_have: ctxPat('Past modal',
    "needn't have = did it, but it was unnecessary.",
    "You needn't have bought flowers (but you did). / You shouldn't have (it was wrong).",
    [{s:"You ___ brought a gift — just coming was enough.",h:"(unnecessary, but done)"},
     {s:"She ___ bought so much food — there were only three of us.",h:"(unnecessary, but done)"},
     {s:"They ___ worried — everything was fine.",h:"(unnecessary, but done)"}],
    "needn't have","shouldn't have"),

  cant_have: ctxPat('Past modal',
    "can't have = past logical impossibility.",
    "She can't have passed (impossible). / She might not have passed (uncertain).",
    [{s:"She never studied — she ___ passed the exam.",h:"(past impossibility)"},
     {s:"He left at 6am — he ___ arrived by 7am.",h:"(past impossibility)"},
     {s:"They had no money — they ___ bought that car.",h:"(past impossibility)"}],
    "can't have","mustn't have"),

  must_have: ctxPat('Past modal',
    "must have = strong past deduction.",
    "He must have forgotten. / He might have forgotten.",
    [{s:"I reminded him three times — he ___ forgotten.",h:"(past deduction)"},
     {s:"She was smiling all day — she ___ received good news.",h:"(past deduction)"},
     {s:"They didn't answer — they ___ already left.",h:"(past deduction)"}],
    "must have","might have"),

  subjunctive: {
    tag:'Subjunctive',
    build(){
      const v=rnd(['attend','listen','submit','arrive','complete']);
      const ctxs=[
        {s:`It's essential that every student ___ the exam.`,h:"(subjunctive — base form)"},
        {s:`The teacher suggested that he ___ more carefully.`,h:"(subjunctive after 'suggested')"},
        {s:`It's important that she ___ the form today.`,h:"(subjunctive)"},
      ];
      const c=rnd(ctxs);
      return mk(this.tag,c.s,c.h,v,v+'s',
        "After 'essential/suggest that' → base form (no -s).",
        `It's essential that he ${v}. / It's essential that he ${v}s. ✗`);
    }
  },

  future_sub: ctxPat('Future sub',
    "'Should you need' = formal conditional inversion.",
    "Should you need help, call us. = If you should need help.",
    [{s:"___ you need any help, please call.",h:"(formal conditional)"},
     {s:"___ anyone call while I'm out, take a message.",h:"(formal — rare)"},
     {s:"___ you wish to cancel, notify us in writing.",h:"(formal conditional)"}],
    "Should","Would"),
};

// ── PATTERN REGISTRY ────────────────────────────────────
const PATTERNS = {...TP, ...MP};

const TENSE_IDS = [
  'pp_finished_time_A','pp_finished_time_B','pp_finished_time_C',
  'pp_since_for_A','pp_since_for_B','pp_since_for_C',
  'pp_already','pp_ever','pp_just','pp_never',
  'pp_ago','pp_superlative','pp_yet'
];
const MODAL_IDS = [
  ...Object.keys(MP),
  'modal_deduction_A','modal_deduction_B','modal_deduction_C'
];

// ── STATS — [correct, wrong] ─────────────────────────────
const _s = {};

export function updateStats(id, ok){
  const e = _s[id] || (_s[id] = [0,0]);
  if(ok){
    e[0]++;
    // decay: correct answer reduces wrong count (pattern recovers)
    e[1] = Math.max(0, e[1] - 1);
  } else {
    e[1]++;
  }
}

export function getStats(){ return {..._s}; }

// ── DIAGNOSIS ─────────────────────────────────────────────
// Cluster groups collapse variants under one label for the summary
const CLUSTERS = {
  pp_finished_time_A: 'finished_time',
  pp_finished_time_B: 'finished_time',
  pp_finished_time_C: 'finished_time',
  pp_since_for_A:     'since_for',
  pp_since_for_B:     'since_for',
  pp_since_for_C:     'since_for',
  modal_deduction_A:  'modal_deduction',
  modal_deduction_B:  'modal_deduction',
  modal_deduction_C:  'modal_deduction',
};

const CLUSTER_LABELS = {
  finished_time:   { label:'You used present perfect with a finished time expression', tip:'Spot the time marker: yesterday, last week, two days ago → past simple.' },
  since_for:       { label:'You mixed up "since" (point in time) and "for" (duration)', tip:'since 2020 / for three years — swap to see which fits.' },
  modal_deduction: { label:'You confused must / might / should for deduction', tip:'Strong evidence → must. Weak → might. Advice → should.' },
};

const DIAGNOSES = {
  pp_already:    { label:'You missed "already" as a present perfect signal',          tip:'already = PP signal: I have already seen it.' },
  pp_ever:       { label:'You missed "ever" as a present perfect signal',             tip:'ever = PP signal (life experience): Have you ever been?' },
  pp_just:       { label:'You missed "just" as a present perfect signal',             tip:'just = PP signal: I have just finished.' },
  pp_never:      { label:'You missed "never" as a present perfect signal',            tip:'never = PP signal: I have never seen it.' },
  pp_ago:        { label:'You used present perfect with "ago" — it needs past simple', tip:'ago always takes past simple: She got it two months ago.' },
  pp_superlative:{ label:'You missed superlative + "ever" triggering present perfect', tip:'Best/worst I have ever seen — superlative + ever = PP.' },
  pp_yet:        { label:'You missed "yet" as a present perfect signal',               tip:'yet = PP: Have you finished yet? / I haven\'t finished yet.' },
  pp_for:        { label:'You missed "for" (ongoing state) as a present perfect signal', tip:'for + ongoing state = PP: I have lived here for three years.' },
  pp_since:      { label:'You missed "since" as a present perfect signal',             tip:'since + point = PP: She has worked here since January.' },
  neednt_mustnt: { label:'You confused "needn\'t" (not necessary) and "mustn\'t" (forbidden)', tip:'needn\'t = not necessary. mustn\'t = forbidden. Very different.' },
  cant_neednt:   { label:'You confused "can\'t" (not allowed) and "needn\'t" (not necessary)', tip:'can\'t = not allowed. needn\'t = not necessary (but allowed).' },
  should_must:   { label:'You used "should" where "must" was needed (or vice versa)',  tip:'should = advice. must = strong obligation.' },
  must_should:   { label:'You used "must" where "should" was needed (or vice versa)',  tip:'must = internal personal necessity. should = advice or recommendation. External rules → have to.' },
  must_deduction:{ label:'You avoided "must" for deduction when evidence was strong',  tip:'Strong evidence = must (near certain). Use must, not might.' },
  cant_deduction:{ label:'You didn\'t use "can\'t" for logical impossibility',         tip:'Impossible = can\'t (not mustn\'t). mustn\'t = forbidden.' },
  neednt_have:   { label:'You confused "needn\'t have" and "shouldn\'t have"',         tip:'needn\'t have = did it, unnecessary. shouldn\'t have = was wrong.' },
  cant_have:     { label:'You confused "can\'t have" and "mustn\'t have"',             tip:'can\'t have = past impossibility. mustn\'t have = was forbidden.' },
  must_have:     { label:'You confused "must have" and "might have"',                 tip:'must have = almost certain past. might have = just possible.' },
  subjunctive:   { label:'You didn\'t use the subjunctive after "essential/suggest that"', tip:'essential/suggest that → base form: It\'s essential that he attend.' },
  future_sub:    { label:'You didn\'t recognise formal conditional inversion',         tip:'"Should you need" = formal "If you should need".' },
};

// getDiagnosis:
// - threshold: wrong >= 2 only
// - clusters variants (A/B/C) under one entry, summing wrongs
// - returns top 3, each with label + actionable tip
export function getDiagnosis(){
  // Aggregate by cluster or individual id
  const agg = {};
  for(const [id,[,wrong]] of Object.entries(_s)){
    if(wrong < 2) continue;
    const key = CLUSTERS[id] || id;
    agg[key] = (agg[key]||0) + wrong;
  }
  // Build output
  return Object.entries(agg)
    .sort((a,b)=>b[1]-a[1])
    .slice(0,3)
    .map(([key,wrong])=>{
      const def = CLUSTER_LABELS[key] || DIAGNOSES[key] || {label:key, tip:''};
      return { key, label:def.label, tip:def.tip, wrong };
    });
}

// ── ROUND BUILDER ────────────────────────────────────────
function pickN(ids, n){
  const sorted = [...ids].sort((x,y)=>((_s[y]||[0,0])[1])-((_s[x]||[0,0])[1]));
  const mid = Math.ceil(sorted.length/2);
  const top = sorted.slice(0,mid);
  for(let i=top.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[top[i],top[j]]=[top[j],top[i]];}
  return [...top,...sorted.slice(mid)].slice(0,n);
}

function build(ids, n){
  return pickN(ids,n).map(id=>{ const q=PATTERNS[id].build(); q._patternId=id; return q; });
}

// insertRepeats:
// - only patterns with wrong ≥ 2
// - max 1 repeat per pattern (no overfitting a single mistake)
// - min gap of 2 items between original and repeat
// - never adjacent to another repeat
// - escalated to typed (_forceWrite)
// - cap at 12 total items
const MIN_GAP = 2;
function insertRepeats(items){
  const seen = new Set();
  const weak = items.filter(q=>{
    const w = (_s[q._patternId]||[0,0])[1];
    if(w < 2 || seen.has(q._patternId)) return false;
    seen.add(q._patternId);
    return true;
  }).slice(0,2); // max 2 patterns get a repeat per round

  if(!weak.length) return items;

  const result = [...items];

  for(const q of weak){
    if(result.length >= 12) break;
    const origIdx = result.findIndex(x => x._patternId === q._patternId && !x._isRepeat);
    if(origIdx === -1) continue;

    // Enforce minGap + avoid adjacent repeats
    let insertAt = origIdx + MIN_GAP + Math.floor(Math.random()*2);
    while(insertAt < result.length && result[insertAt]?._isRepeat) insertAt++;
    insertAt = Math.min(insertAt, result.length - 1);

    const repeat = PATTERNS[q._patternId].build(); // fresh surface (slots re-randomised)
    repeat._patternId = q._patternId;
    repeat._isRepeat = true;
    repeat._forceWrite = true; // escalate: typed on second exposure

    result.splice(insertAt, 0, repeat);
  }

  return result.slice(0, 12);
}

export function getRound(mode='modals'){
  const ids = mode==='tenses' ? TENSE_IDS
    : mode==='mixed' ? shuffle([...MODAL_IDS,...TENSE_IDS])
    : MODAL_IDS;
  let items = build(ids, 10);
  items = insertRepeats(items);
  // Apply round structure to non-repeat items
  const nonRepeats = items.filter(q=>!q._isRepeat);
  nonRepeats.slice(6,9).forEach(q=>{ if(!q._forceWrite) q._forceWrite=true; });
  // Last item: blitz (no hint, short timer)
  const last = items[items.length-1];
  if(last && !last._isRepeat){ last.hint=''; last._blitz=true; }
  return items;
}

export function getMultiRound(mode='modals'){
  const ids = mode==='tenses' ? TENSE_IDS
    : mode==='mixed' ? shuffle([...MODAL_IDS,...TENSE_IDS])
    : MODAL_IDS;
  return build(ids, 10);
}

// ── UTILITIES ────────────────────────────────────────────
export function shuffle(arr){
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a;
}
export function levenshtein(a,b){
  const m=a.length,n=b.length;
  const d=Array.from({length:m+1},(_,i)=>Array.from({length:n+1},(_,j)=>i||j));
  for(let i=1;i<=m;i++) for(let j=1;j<=n;j++) d[i][j]=a[i-1]===b[j-1]?d[i-1][j-1]:1+Math.min(d[i-1][j],d[i][j-1],d[i-1][j-1]);
  return d[m][n];
}
export function saveSession(d){ sessionStorage.setItem('gb_session',JSON.stringify(d)); }
export function loadSession(){ try{ return JSON.parse(sessionStorage.getItem('gb_session')||'{}'); }catch{ return {}; } }

// ── CHARS ────────────────────────────────────────────────
export const CHARS = {
  owlbert:{name:'OWLBERT',desc:"The Pedant — corrects you even when you're right.",colour:'#47c8ff',emoji:'🦉',
    speech:{idle:'...',correct:'Acceptable. Barely.',wrong:'Predictable error.',streak:'Unexpected competence.'},
    svg:{
      idle:`<svg viewBox="0 0 40 44" width="40" height="44"><rect x="8" y="4" width="24" height="28" rx="4" fill="#8B6914"/><rect x="10" y="6" width="20" height="24" rx="3" fill="#C4930A"/><rect x="11" y="10" width="7" height="7" rx="1" fill="white"/><rect x="22" y="10" width="7" height="7" rx="1" fill="white"/><rect x="13" y="12" width="3" height="3" fill="#1a1a2e"/><rect x="24" y="12" width="3" height="3" fill="#1a1a2e"/><rect x="17" y="19" width="6" height="3" rx="1" fill="#8B4513"/><rect x="4" y="14" width="6" height="10" rx="2" fill="#8B6914"/><rect x="30" y="14" width="6" height="10" rx="2" fill="#8B6914"/><rect x="12" y="32" width="6" height="8" rx="1" fill="#8B6914"/><rect x="22" y="32" width="6" height="8" rx="1" fill="#8B6914"/><rect x="14" y="8" width="12" height="3" rx="1" fill="#5a4500" opacity="0.6"/></svg>`,
      correct:`<svg viewBox="0 0 40 44" width="40" height="44"><rect x="8" y="3" width="24" height="28" rx="4" fill="#8B6914"/><rect x="10" y="5" width="20" height="24" rx="3" fill="#C4930A"/><rect x="11" y="9" width="7" height="7" rx="1" fill="white"/><rect x="22" y="9" width="7" height="7" rx="1" fill="white"/><rect x="13" y="11" width="3" height="3" fill="#1a1a2e"/><rect x="24" y="11" width="3" height="3" fill="#1a1a2e"/><rect x="16" y="18" width="8" height="3" rx="1" fill="#4a8c4a"/><rect x="4" y="11" width="6" height="10" rx="2" fill="#8B6914"/><rect x="30" y="11" width="6" height="10" rx="2" fill="#8B6914"/><rect x="12" y="31" width="6" height="8" rx="1" fill="#8B6914"/><rect x="22" y="31" width="6" height="8" rx="1" fill="#8B6914"/><circle cx="8" cy="5" r="3" fill="#e8ff47" opacity="0.9"/><circle cx="32" cy="5" r="3" fill="#e8ff47" opacity="0.9"/></svg>`,
      wrong:`<svg viewBox="0 0 40 44" width="40" height="44"><rect x="8" y="6" width="24" height="28" rx="4" fill="#8B6914"/><rect x="10" y="8" width="20" height="24" rx="3" fill="#C4930A"/><rect x="11" y="12" width="7" height="6" rx="1" fill="white"/><rect x="22" y="12" width="7" height="6" rx="1" fill="white"/><rect x="13" y="13" width="3" height="3" fill="#1a1a2e"/><rect x="24" y="13" width="3" height="3" fill="#1a1a2e"/><rect x="15" y="21" width="10" height="2" rx="1" fill="#8B4513"/><rect x="4" y="16" width="6" height="10" rx="2" fill="#8B6914"/><rect x="30" y="16" width="6" height="10" rx="2" fill="#8B6914"/><rect x="10" y="9" width="7" height="2" rx="1" fill="#5a4500" transform="rotate(-15 13 10)"/><rect x="23" y="9" width="7" height="2" rx="1" fill="#5a4500" transform="rotate(15 26 10)"/></svg>`
    }
  },
  rex:{name:'REX',desc:'The Enthusiast — celebrates everything, including mistakes.',colour:'#e8ff47',emoji:'🐕',
    speech:{idle:"LET'S GO!!!",correct:'YES!! YESYESYES!!',wrong:"IT'S FINE I'M FINE!!",streak:'I AM UNSTOPPABLE!!'},
    svg:{
      idle:`<svg viewBox="0 0 40 44" width="40" height="44"><rect x="10" y="8" width="20" height="20" rx="6" fill="#C4930A"/><rect x="6" y="4" width="10" height="12" rx="3" fill="#C4930A"/><rect x="24" y="4" width="10" height="12" rx="3" fill="#C4930A"/><rect x="13" y="14" width="5" height="5" rx="1" fill="white"/><rect x="22" y="14" width="5" height="5" rx="1" fill="white"/><rect x="14" y="15" width="3" height="3" fill="#1a1a2e"/><rect x="23" y="15" width="3" height="3" fill="#1a1a2e"/><ellipse cx="20" cy="22" rx="5" ry="3" fill="#ff6b9d"/><rect x="8" y="28" width="6" height="12" rx="2" fill="#C4930A"/><rect x="26" y="28" width="6" height="12" rx="2" fill="#C4930A"/><rect x="12" y="30" width="16" height="10" rx="3" fill="#C4930A"/><rect x="2" y="22" width="8" height="3" rx="2" fill="#C4930A" transform="rotate(-20 6 24)"/></svg>`,
      correct:`<svg viewBox="0 0 40 44" width="40" height="44"><rect x="10" y="4" width="20" height="20" rx="6" fill="#C4930A"/><rect x="6" y="0" width="10" height="12" rx="3" fill="#C4930A"/><rect x="24" y="0" width="10" height="12" rx="3" fill="#C4930A"/><rect x="13" y="10" width="5" height="5" rx="1" fill="white"/><rect x="22" y="10" width="5" height="5" rx="1" fill="white"/><rect x="14" y="11" width="3" height="3" fill="#1a1a2e"/><rect x="23" y="11" width="3" height="3" fill="#1a1a2e"/><ellipse cx="20" cy="18" rx="6" ry="4" fill="#ff6b9d"/><rect x="8" y="24" width="6" height="12" rx="2" fill="#C4930A"/><rect x="26" y="24" width="6" height="12" rx="2" fill="#C4930A"/><rect x="12" y="26" width="16" height="10" rx="3" fill="#C4930A"/><rect x="30" y="16" width="10" height="3" rx="2" fill="#C4930A" transform="rotate(30 35 18)"/><circle cx="4" cy="3" r="3" fill="#e8ff47"/><circle cx="36" cy="3" r="3" fill="#e8ff47"/><circle cx="20" cy="1" r="3" fill="#e8ff47"/></svg>`,
      wrong:`<svg viewBox="0 0 40 44" width="40" height="44"><rect x="10" y="10" width="20" height="20" rx="6" fill="#C4930A"/><rect x="6" y="8" width="10" height="10" rx="3" fill="#C4930A"/><rect x="24" y="8" width="10" height="10" rx="3" fill="#C4930A"/><rect x="13" y="16" width="5" height="5" rx="1" fill="white"/><rect x="22" y="16" width="5" height="5" rx="1" fill="white"/><rect x="14" y="17" width="3" height="3" fill="#1a1a2e"/><rect x="23" y="17" width="3" height="3" fill="#1a1a2e"/><rect x="16" y="24" width="8" height="2" rx="1" fill="#8B4513"/><rect x="8" y="30" width="6" height="12" rx="2" fill="#C4930A"/><rect x="26" y="30" width="6" height="12" rx="2" fill="#C4930A"/><rect x="12" y="32" width="16" height="8" rx="3" fill="#C4930A"/><rect x="2" y="30" width="8" height="3" rx="2" fill="#C4930A" transform="rotate(20 6 31)"/></svg>`
    }
  },
  claw:{name:'MME CLAW',desc:'The Judge — visibly unimpressed.',colour:'#c47aff',emoji:'🐱',
    speech:{idle:'...',correct:'Adequate.',wrong:'Disgraceful.',streak:"I suppose you're not completely useless."},
    svg:{
      idle:`<svg viewBox="0 0 40 44" width="40" height="44"><rect x="8" y="8" width="24" height="22" rx="5" fill="#9b59b6"/><polygon points="8,12 2,2 14,8" fill="#9b59b6"/><polygon points="32,12 38,2 26,8" fill="#9b59b6"/><rect x="13" y="14" width="6" height="5" rx="1" fill="#1a1a2e"/><rect x="21" y="14" width="6" height="5" rx="1" fill="#1a1a2e"/><rect x="14" y="15" width="4" height="3" rx="1" fill="#c47aff" opacity="0.5"/><rect x="22" y="15" width="4" height="3" rx="1" fill="#c47aff" opacity="0.5"/><rect x="17" y="21" width="6" height="2" rx="1" fill="#7d3c98"/><rect x="9" y="30" width="7" height="12" rx="2" fill="#9b59b6"/><rect x="24" y="30" width="7" height="12" rx="2" fill="#9b59b6"/><rect x="12" y="30" width="16" height="10" rx="3" fill="#9b59b6"/><rect x="28" y="32" width="10" height="3" rx="2" fill="#9b59b6"/></svg>`,
      correct:`<svg viewBox="0 0 40 44" width="40" height="44"><rect x="8" y="8" width="24" height="22" rx="5" fill="#9b59b6"/><polygon points="8,12 2,2 14,8" fill="#9b59b6"/><polygon points="32,12 38,2 26,8" fill="#9b59b6"/><rect x="13" y="14" width="6" height="4" rx="1" fill="#1a1a2e"/><rect x="21" y="14" width="6" height="4" rx="1" fill="#1a1a2e"/><rect x="14" y="15" width="4" height="2" rx="1" fill="#c47aff" opacity="0.9"/><rect x="22" y="15" width="4" height="2" rx="1" fill="#c47aff" opacity="0.9"/><path d="M15 22 Q20 26 25 22" stroke="#7d3c98" stroke-width="2" fill="none"/><rect x="9" y="30" width="7" height="12" rx="2" fill="#9b59b6"/><rect x="24" y="30" width="7" height="12" rx="2" fill="#9b59b6"/><rect x="12" y="30" width="16" height="10" rx="3" fill="#9b59b6"/><rect x="28" y="29" width="10" height="3" rx="2" fill="#9b59b6" transform="rotate(-15 33 30)"/></svg>`,
      wrong:`<svg viewBox="0 0 40 44" width="40" height="44"><rect x="8" y="9" width="24" height="22" rx="5" fill="#9b59b6"/><polygon points="8,13 2,3 14,9" fill="#9b59b6"/><polygon points="32,13 38,3 26,9" fill="#9b59b6"/><rect x="13" y="15" width="6" height="3" rx="1" fill="#1a1a2e"/><rect x="21" y="15" width="6" height="3" rx="1" fill="#1a1a2e"/><rect x="16" y="22" width="8" height="2" rx="1" fill="#7d3c98"/><rect x="9" y="31" width="7" height="12" rx="2" fill="#9b59b6"/><rect x="24" y="31" width="7" height="12" rx="2" fill="#9b59b6"/><rect x="12" y="31" width="16" height="10" rx="3" fill="#9b59b6"/><text x="5" y="9" font-size="8" fill="#c47aff" opacity="0.7">...</text></svg>`
    }
  },
  turbo:{name:'TURBO',desc:'The Hamster — always running. Vibrates at rest.',colour:'#ff4d6d',emoji:'🐹',
    speech:{idle:'gogoGOGOgogo',correct:'ZOOOOM!!',wrong:'whyyyy',streak:'MAXIMUM SPEED!!'},
    svg:{
      idle:`<svg viewBox="0 0 40 44" width="40" height="44"><ellipse cx="20" cy="22" rx="14" ry="12" fill="#e8a87c"/><ellipse cx="10" cy="14" rx="5" ry="6" fill="#e8a87c"/><ellipse cx="30" cy="14" rx="5" ry="6" fill="#e8a87c"/><ellipse cx="10" cy="14" rx="3" ry="4" fill="#ffb3a7"/><ellipse cx="30" cy="14" rx="3" ry="4" fill="#ffb3a7"/><rect x="14" y="16" width="5" height="5" rx="1" fill="#1a1a2e"/><rect x="21" y="16" width="5" height="5" rx="1" fill="#1a1a2e"/><rect x="15" y="17" width="3" height="3" rx="1" fill="#ff6b9d"/><rect x="22" y="17" width="3" height="3" rx="1" fill="#ff6b9d"/><ellipse cx="20" cy="24" rx="4" ry="2" fill="#ffb3a7"/><rect x="10" y="30" width="5" height="8" rx="2" fill="#e8a87c"/><rect x="25" y="30" width="5" height="8" rx="2" fill="#e8a87c"/><rect x="13" y="32" width="14" height="8" rx="3" fill="#e8a87c"/></svg>`,
      correct:`<svg viewBox="0 0 40 44" width="40" height="44"><ellipse cx="20" cy="20" rx="14" ry="12" fill="#e8a87c"/><ellipse cx="10" cy="12" rx="5" ry="6" fill="#e8a87c"/><ellipse cx="30" cy="12" rx="5" ry="6" fill="#e8a87c"/><ellipse cx="10" cy="12" rx="3" ry="4" fill="#ffb3a7"/><ellipse cx="30" cy="12" rx="3" ry="4" fill="#ffb3a7"/><rect x="14" y="14" width="5" height="5" rx="1" fill="#1a1a2e"/><rect x="21" y="14" width="5" height="5" rx="1" fill="#1a1a2e"/><rect x="15" y="15" width="3" height="3" rx="1" fill="#e8ff47"/><rect x="22" y="15" width="3" height="3" rx="1" fill="#e8ff47"/><path d="M14 22 Q20 27 26 22" stroke="#ffb3a7" stroke-width="2" fill="none"/><rect x="4" y="26" width="5" height="8" rx="2" fill="#e8a87c"/><rect x="31" y="26" width="5" height="8" rx="2" fill="#e8a87c"/><rect x="13" y="28" width="14" height="10" rx="3" fill="#e8a87c"/><circle cx="6" cy="9" r="3" fill="#e8ff47"/><circle cx="34" cy="9" r="3" fill="#e8ff47"/><circle cx="20" cy="5" r="3" fill="#e8ff47"/></svg>`,
      wrong:`<svg viewBox="0 0 40 44" width="40" height="44"><ellipse cx="20" cy="26" rx="14" ry="12" fill="#e8a87c"/><ellipse cx="10" cy="18" rx="5" ry="6" fill="#e8a87c"/><ellipse cx="30" cy="18" rx="5" ry="6" fill="#e8a87c"/><ellipse cx="10" cy="18" rx="3" ry="4" fill="#ffb3a7"/><ellipse cx="30" cy="18" rx="3" ry="4" fill="#ffb3a7"/><rect x="14" y="20" width="5" height="4" rx="1" fill="#1a1a2e"/><rect x="21" y="20" width="5" height="4" rx="1" fill="#1a1a2e"/><rect x="16" y="28" width="8" height="2" rx="1" fill="#c47a5a"/><rect x="10" y="34" width="5" height="8" rx="2" fill="#e8a87c"/><rect x="25" y="34" width="5" height="8" rx="2" fill="#e8a87c"/><rect x="13" y="34" width="14" height="8" rx="3" fill="#e8a87c"/><line x1="16" y1="18" x2="12" y2="14" stroke="#c47a5a" stroke-width="2"/><line x1="24" y1="18" x2="28" y2="14" stroke="#c47a5a" stroke-width="2"/></svg>`
    }
  },
  frog:{name:'SR. FROG',desc:'The Philosopher — still, then unhinged on a streak.',colour:'#52d98a',emoji:'🐸',
    speech:{idle:'...',correct:'Yes.',wrong:'Interesting. Wrong, but interesting.',streak:'THE COSMOS SPEAKS THROUGH ME.'},
    svg:{
      idle:`<svg viewBox="0 0 40 44" width="40" height="44"><ellipse cx="20" cy="26" rx="14" ry="12" fill="#2ecc71"/><ellipse cx="10" cy="14" rx="7" ry="7" fill="#2ecc71"/><ellipse cx="30" cy="14" rx="7" ry="7" fill="#2ecc71"/><ellipse cx="10" cy="14" rx="5" ry="5" fill="#27ae60"/><ellipse cx="30" cy="14" rx="5" ry="5" fill="#27ae60"/><rect x="7" y="11" width="6" height="6" rx="1" fill="#1a1a2e"/><rect x="27" y="11" width="6" height="6" rx="1" fill="#1a1a2e"/><rect x="8" y="12" width="4" height="4" rx="1" fill="#52d98a" opacity="0.6"/><rect x="28" y="12" width="4" height="4" rx="1" fill="#52d98a" opacity="0.6"/><ellipse cx="20" cy="30" rx="8" ry="4" fill="#27ae60"/><rect x="16" y="28" width="8" height="3" rx="1" fill="#1a6b3a"/><rect x="6" y="34" width="7" height="8" rx="3" fill="#2ecc71"/><rect x="27" y="34" width="7" height="8" rx="3" fill="#2ecc71"/></svg>`,
      correct:`<svg viewBox="0 0 40 44" width="40" height="44"><ellipse cx="20" cy="24" rx="14" ry="12" fill="#2ecc71"/><ellipse cx="10" cy="12" rx="7" ry="7" fill="#2ecc71"/><ellipse cx="30" cy="12" rx="7" ry="7" fill="#2ecc71"/><ellipse cx="10" cy="12" rx="5" ry="5" fill="#27ae60"/><ellipse cx="30" cy="12" rx="5" ry="5" fill="#27ae60"/><rect x="7" y="9" width="6" height="6" rx="1" fill="#1a1a2e"/><rect x="27" y="9" width="6" height="6" rx="1" fill="#1a1a2e"/><rect x="8" y="10" width="4" height="4" rx="1" fill="#e8ff47" opacity="0.9"/><rect x="28" y="10" width="4" height="4" rx="1" fill="#e8ff47" opacity="0.9"/><path d="M13 26 Q20 32 27 26" stroke="#1a6b3a" stroke-width="2" fill="none"/><rect x="6" y="32" width="7" height="10" rx="3" fill="#2ecc71"/><rect x="27" y="32" width="7" height="10" rx="3" fill="#2ecc71"/><text x="2" y="8" font-size="7" fill="#e8ff47">✦</text><text x="32" y="8" font-size="7" fill="#e8ff47">✦</text></svg>`,
      wrong:`<svg viewBox="0 0 40 44" width="40" height="44"><ellipse cx="20" cy="26" rx="14" ry="12" fill="#2ecc71"/><ellipse cx="10" cy="14" rx="7" ry="7" fill="#2ecc71"/><ellipse cx="30" cy="14" rx="7" ry="7" fill="#2ecc71"/><ellipse cx="10" cy="14" rx="5" ry="5" fill="#27ae60"/><ellipse cx="30" cy="14" rx="5" ry="5" fill="#27ae60"/><rect x="7" y="11" width="6" height="5" rx="1" fill="#1a1a2e"/><rect x="27" y="11" width="6" height="5" rx="1" fill="#1a1a2e"/><rect x="8" y="12" width="4" height="2" rx="1" fill="#52d98a" opacity="0.2"/><rect x="28" y="12" width="4" height="2" rx="1" fill="#52d98a" opacity="0.2"/><rect x="16" y="29" width="8" height="2" rx="1" fill="#1a6b3a"/><rect x="6" y="34" width="7" height="8" rx="3" fill="#2ecc71"/><rect x="27" y="34" width="7" height="8" rx="3" fill="#2ecc71"/><text x="14" y="10" font-size="7" fill="#1a6b3a">...</text></svg>`
    }
  }
};

// ── TONE SYSTEM ──────────────────────────────────────────
const TONE = {
  evocative:   [
    "The screen is still on.",
    "The sign is flickering.",
    "The tape is playing.",
    "The music is fading.",
    "The room is empty.",
    "The lights are low.",
    "The street is quiet.",
    "The window is glowing.",
    "Something is coming through.",
    "The signal is weak.",
    "The clock is running.",
    "The door is open."
  ],
  rule: [
    "Don't cross the streams.",
    "Never feed them after midnight.",
    "Don't press the button.",
    "Don't open the door.",
    "We must prepare.",
    "Stay on the road.",
    "Don't look directly at it."
  ],
  instruction: [
    "If you lose, try again.",
    "If something moves, don't touch it.",
    "If the screen goes dark, wait.",
    "If something goes wrong, call for help.",
    "If I'm not back by dawn, call the president.",
    "When in doubt, say nothing.",
    "Keep moving."
  ],
  aftermath: [
    "We really shook the pillars of heaven, didn't we, Wang?",
    "I guess we just saved the world.",
    "It's over… isn't it?",
    "It's all in the reflexes.",
    "Groovy.",
    "That'll do.",
    "We made it out."
  ],
  reflective: [
    "Life moves fast.",
    "If you don't stop, you could miss it.",
    "It's quiet now.",
    "The moment is passing.",
    "Nobody notices until it's gone.",
    "This is the part they never show you."
  ],
  cool: [
    "Trust me.",
    "I told you.",
    "That worked.",
    "We're fine.",
    "It's handled.",
    "No problem.",
    "Just like that."
  ]
};

// Sequence: evocative bookends intensity, aftermath closes
const TONE_SEQUENCE = [
  'evocative',
  'instruction',
  'evocative',
  'rule',
  'evocative',
  'cool',
  'instruction',
  'evocative',
  'reflective',
  'aftermath'
];

const _toneUsed = {};

function pickLine(toneKey){
  const pool = TONE[toneKey];
  if(!pool) return '';
  // avoid immediate repeat
  const available = pool.filter(l => l !== _toneUsed[toneKey]);
  const line = available[Math.floor(Math.random()*available.length)];
  _toneUsed[toneKey] = line;
  return line;
}

export function getToneSequence(){
  return TONE_SEQUENCE.map(t => ({ tone: t, line: pickLine(t) }));
}
