// Saved progress (localStorage). The shape and key are the same as in the original single-file app,
// so existing progress is kept.
import { TRACK, type LevelId } from './levels';

export type Dir = 'nl2fr' | 'fr2nl';
export interface Settings {
  dir: Dir | 'both';
  /** only verbs with frequency rank <= pool */
  pool: number;
  /** an accent mistake counts as wrong */
  strict: boolean;
  /** chance of a negative question */
  neg: number;
  /** speech rate */
  rate: number;
  /** speech voice name, '' = automatic */
  voice: string;
}
/** Per verb: correct/wrong counts and Leitner box 0..5 (>= 4 = mastered) */
export interface VerbStat { c: number; w: number; box: number }

export interface Save {
  xp: number;
  rounds: number;
  answered: number;
  correct: number;
  stars: Partial<Record<LevelId, number>>;
  /** keyed by verb index */
  verbs: Record<string, VerbStat>;
  /** keyed by question key "verb|tense|person|neg" */
  mistakes: Record<string, { n: number }>;
  /** badge id -> date earned (yyyy-mm-dd) */
  badges: Record<string, string>;
  settings: Settings;
}

const STORE = 'verbes100-v1';

export const fresh = (): Save => ({
  xp: 0, rounds: 0, answered: 0, correct: 0, stars: {}, verbs: {}, mistakes: {}, badges: {},
  settings: { dir: 'both', pool: 999, strict: false, neg: 0.3, rate: 0.9, voice: '' },
});

export function loadSave(): Save {
  let s: Save;
  try { s = Object.assign(fresh(), JSON.parse(localStorage.getItem(STORE) || '{}')); } catch { s = fresh(); }
  // older saves had "pool:100 = all verbs"; now there are more than 100
  if (s.settings && s.settings.neg === undefined && s.settings.pool === 100) s.settings.pool = 999;
  s.settings = Object.assign(fresh().settings, s.settings);
  return s;
}
export function persist(s: Save) {
  try { localStorage.setItem(STORE, JSON.stringify(s)); } catch { /* storage full or blocked */ }
}

export const stars = (s: Save, id: LevelId) => s.stars[id] || 0;
export const mastered = (s: Save) => Object.values(s.verbs).filter(v => v.box >= 4).length;

/** A level opens with ★★ on the previous "Kiezen" level; "Typen" opens with ★★ on its own "Kiezen" level */
export function unlocked(s: Save, id: LevelId): boolean {
  const [t, m] = id.split('-') as [typeof TRACK[number], string];
  const i = TRACK.indexOf(t);
  if (stars(s, id) > 0) return true; // already played (e.g. before a new level was inserted)
  if (m === 'mc') return i === 0 || stars(s, `${TRACK[i - 1]}-mc`) >= 2;
  return stars(s, `${t}-mc`) >= 2;
}
export const allLevels = (): LevelId[] => TRACK.flatMap(t => [`${t}-mc`, `${t}-type`] as LevelId[]);
