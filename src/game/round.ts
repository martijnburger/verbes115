// Question generation, answering and scoring. Functions that change state work on immer drafts.
import { BY_FREQ, CONJ_TENSES, NL_SAME, TENSES, VERBS, full, persons } from '../engine/conjugate';
import { checkAnswer, norm, type CheckResult } from '../engine/check';
import type { ConjTense, Lang, Person, Tense, Verb } from '../engine/types';
import { ROUND_LEN, TRACK_INFO, type LevelId, type Mode, type Track } from './levels';
import { pick, shuffle } from './random';
import { BADGES, RANKS, rankOf, type Rank } from './rewards';
import { allLevels, stars, unlocked, type Dir, type Save } from './save';

export type Result = CheckResult | 'overruled';

export interface Question {
  /** verb index */
  vi: number;
  t: Tense;
  /** person, -1 for the infinitive */
  p: Person;
  dir: Dir;
  mode: Mode;
  /** language of the answer */
  tgt: Lang;
  neg: boolean;
  prompt: string;
  answer: string;
  accepted: string[];
  /** "verb|tense|person|neg", used for the mistakes list */
  key: string;
  options?: string[];
  given?: string;
  result?: Result;
  xp?: number;
}

export interface RoundOutcome {
  stars: number;
  bonus: number;
  newUnlocks: LevelId[];
  rankUp: Rank | null;
  newBadges: string[];
}

export interface Round {
  level: LevelId | 'review';
  review: boolean;
  mode: Mode | 'mixed';
  qs: Question[];
  /** current question */
  i: number;
  correct: number;
  xp: number;
  showTable: boolean;
  /** set when the round is finished */
  outcome?: RoundOutcome;
}

export interface Game {
  save: Save;
  round: Round | null;
}

// ---------- question generation ----------
function verbWeight(s: Save, i: number) {
  const st = s.verbs[i];
  return st ? [6, 4, 3, 2, 1, .5][st.box] : 3;
}
/** Weighted pick: verbs you don't know well yet come up more often */
function pickVerb(s: Save): Verb {
  const pool = BY_FREQ.filter(v => v.rank <= s.settings.pool);
  const ws = pool.map(v => verbWeight(s, v.idx));
  let r = Math.random() * ws.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) { r -= ws[i]; if (r <= 0) return pool[i]; }
  return pool[pool.length - 1];
}
const pickDir = (s: Save): Dir => (s.settings.dir === 'both' ? pick(['nl2fr', 'fr2nl'] as const) : s.settings.dir);

export function buildQ(v: Verb, t: Tense, p: Person, dir: Dir, mode: Mode, neg = false): Question {
  const src = dir === 'nl2fr' ? 'nl' : 'fr', tgt = dir === 'nl2fr' ? 'fr' : 'nl';
  const ans = full(v, tgt, t, p, neg);
  const q: Question = {
    vi: v.idx, t, p, dir, mode, tgt, neg,
    prompt: full(v, src, t, p, neg).d, answer: ans.d, accepted: ans.a, key: `${v.idx}|${t}|${p}|${neg ? 1 : 0}`,
  };
  if (src === 'nl' && p === 5) q.prompt = q.prompt.replace(/^(dat )?zij /, '$1zij (mv.) ');
  if (mode === 'mc') q.options = shuffle([ans.d, ...distractors(v, tgt, t, p, neg, ans.d)]);
  return q;
}

/**
 * Wrong options. French: may contain wrongly conjugated forms (that is what you practise).
 * Dutch: only correct Dutch -- other verbs, another tense, or (with negation) the positive form.
 */
export function distractors(v: Verb, lang: Lang, t: Tense, p: Person, neg: boolean, correct: string): string[] {
  const seen = new Set([norm(correct)]), out: string[] = [];
  const add = (s: string) => { const k = norm(s); if (!seen.has(k) && out.length < 3) { seen.add(k); out.push(s); } };
  const others = shuffle(VERBS.filter(x => x !== v && x.nl !== v.nl));
  if (t === 'inf') {
    others.forEach(x => add(lang === 'fr' ? x.fr : x.nl));
    return out;
  }
  // pres and subj often translate to the same Dutch, so don't offer one as a wrong answer for the other
  const tenseOk = (x: ConjTense) => x !== t && !(lang === 'nl' && NL_SAME.some(g => g.includes(x) && g.includes(t)));
  const tenses = shuffle(CONJ_TENSES.filter(tenseOk)).map(x => full(v, lang, x, p, neg).d);
  const flip = full(v, lang, t, p, !neg).d;
  if (lang === 'fr') {
    const wrongPerson = shuffle(persons(v).filter(q => q !== p)).map(q => full(v, 'fr', t, p, neg, q).d);
    wrongPerson.slice(0, 2).forEach(add); add(tenses[0]);
    if (neg && Math.random() < .5) add(flip);
    wrongPerson.forEach(add); tenses.forEach(add);
    others.forEach(x => add(full(x, 'fr', t, x.imp ? 2 : p, neg).d));
  } else {
    add(tenses[0]);
    if (neg) add(flip);
    others.forEach(x => add(full(x, 'nl', t, pick(persons(x)), neg).d));
  }
  return out;
}

export function makeRound(s: Save, level: LevelId): Round {
  const [t, mode] = level.split('-') as [Track, Mode];
  const used = new Set<string>(), qs: Question[] = [];
  let guard = 0;
  while (qs.length < ROUND_LEN && guard++ < 500) {
    const v = pickVerb(s);
    const tt: Tense = t === 'mix' ? pick(CONJ_TENSES) : t;
    const p = tt === 'inf' ? -1 : pick(persons(v));
    const key = tt === 'inf' ? `${v.idx}|inf` : `${v.idx}|${tt}|${p}`;
    if (used.has(key) || (tt === 'inf' && used.has('v' + v.idx))) continue;
    used.add(key); used.add('v' + v.idx);
    const neg = tt !== 'inf' && Math.random() < s.settings.neg;
    qs.push(buildQ(v, tt, p, pickDir(s), mode, neg));
  }
  return { level, review: false, mode, qs, i: 0, correct: 0, xp: 0, showTable: false };
}

/** Up to 10 of the forms you got wrong, most-missed first */
export function makeReview(s: Save): Round {
  const items = shuffle(Object.entries(s.mistakes)).sort((a, b) => b[1].n - a[1].n).slice(0, ROUND_LEN);
  const qs = items.map(([key]) => {
    const [vi, t, p, neg] = key.split('|') as [string, Tense, string, string];
    const mode: Mode = unlocked(s, `${t}-type`) ? 'type' : 'mc';
    return buildQ(VERBS[+vi], t, +p, pickDir(s), mode, neg === '1');
  });
  return { level: 'review', review: true, mode: 'mixed', qs: shuffle(qs), i: 0, correct: 0, xp: 0, showTable: false };
}

// ---------- answering ----------
export const xpFor = (q: Question) => (10 + 4 * TENSES[q.t].rank + (q.neg ? 4 : 0)) * (q.mode === 'type' ? 2 : 1);

function record(s: Save, q: Question, ok: boolean) {
  const st = s.verbs[q.vi] || (s.verbs[q.vi] = { c: 0, w: 0, box: 0 });
  s.answered++;
  if (ok) { st.c++; st.box = Math.min(5, st.box + 1); s.correct++; delete s.mistakes[q.key]; }
  else { st.w++; st.box = Math.max(0, st.box - 2); const m = s.mistakes[q.key] || (s.mistakes[q.key] = { n: 0 }); m.n++; }
}

export function submit(g: Game, given: string) {
  const R = g.round!, q = R.qs[R.i];
  if (q.result) return;
  q.given = given;
  let res: CheckResult = q.mode === 'mc' ? (norm(given) === norm(q.answer) ? 'ok' : 'wrong') : checkAnswer(given, q.accepted);
  if (res === 'accent' && g.save.settings.strict) res = 'wrong';
  q.result = res;
  const ok = res !== 'wrong';
  q.xp = ok ? (res === 'accent' ? Math.round(xpFor(q) / 2) : xpFor(q)) : 0;
  if (ok) { R.correct++; R.xp += q.xp; g.save.xp += q.xp; }
  record(g.save, q, ok);
}

/** "Ik had het goed": count a typed answer as correct after all (e.g. a valid synonym) */
export function overrule(g: Game) {
  const R = g.round!, q = R.qs[R.i], s = g.save;
  if (q.result !== 'wrong') return;
  q.result = 'overruled'; q.xp = xpFor(q);
  R.correct++; R.xp += q.xp; s.xp += q.xp;
  // undo the mistake bookkeeping
  const st = s.verbs[q.vi]; st.w--; st.c++; st.box = Math.min(5, st.box + 3); s.correct++;
  delete s.mistakes[q.key];
}

export function finishRound(g: Game) {
  const R = g.round!, s = g.save;
  if (R.outcome) return;
  const total = R.qs.length, acc = R.correct / total;
  const st = acc >= 1 ? 3 : acc >= .8 ? 2 : acc >= .6 ? 1 : 0;
  const before = allLevels().filter(id => unlocked(s, id));
  const rankBefore = rankOf(s.xp);
  const bonus = st * 10 + (acc === 1 ? 25 : 0);
  s.xp += bonus; R.xp += bonus;
  s.rounds++;
  if (R.level !== 'review') s.stars[R.level] = Math.max(stars(s, R.level), st);
  const info = { correct: R.correct, total, mode: R.mode, review: R.review };
  const newBadges = BADGES.filter(b => !s.badges[b.id] && b.t(s, info)).map(b => b.id);
  newBadges.forEach(id => s.badges[id] = new Date().toISOString().slice(0, 10));
  R.outcome = {
    stars: st, bonus, newBadges,
    newUnlocks: allLevels().filter(id => unlocked(s, id) && !before.includes(id)),
    rankUp: rankOf(s.xp) > rankBefore ? RANKS[rankOf(s.xp)] : null,
  };
}

export const levelName = (id: LevelId) => {
  const [t, m] = id.split('-') as [Track, Mode];
  return `${TRACK_INFO[t].fr} · ${m === 'mc' ? 'Kiezen' : 'Typen'}`;
};
