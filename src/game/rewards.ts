import { VERBS } from '../engine/conjugate';
import { TRACK, TRACK_INFO, type Mode } from './levels';
import { allLevels, mastered, stars, unlocked, type Save } from './save';

/** [minimum XP, name, icon] */
export type Rank = [number, string, string];
export const RANKS: Rank[] = [[0, 'Débutant', '🐣'], [150, 'Apprenti', '📘'], [400, 'Élève', '✏️'], [800, 'Voyageur', '🧳'], [1500, 'Bavard', '💬'],
  [2500, 'Connaisseur', '🍷'], [4000, 'Expert', '🎓'], [6000, 'Virtuose', '🎻'], [9000, 'Maître', '👑'], [13000, 'Académicien', '🏛️']];
export function rankOf(xp: number): number {
  let i = 0;
  RANKS.forEach((r, k) => { if (xp >= r[0]) i = k; });
  return i;
}

/** The round that was just finished, for round-based badges */
export interface RoundInfo { correct: number; total: number; mode: Mode | 'mixed'; review: boolean }
export interface Badge { id: string; i: string; n: string; d: string; t: (s: Save, r?: RoundInfo) => boolean }

export const BADGES: Badge[] = [
  { id: 'first', i: '🎯', n: 'Premier pas', d: 'Rond je eerste ronde af', t: s => s.rounds >= 1 },
  { id: 'perfect', i: '💯', n: 'Sans faute', d: 'Een ronde zonder fouten', t: (_, r) => !!r && r.correct === r.total },
  { id: 'typist', i: '✒️', n: "Plume d'or", d: 'Een foutloze typ-ronde', t: (_, r) => !!r && r.mode === 'type' && r.correct === r.total },
  { id: 'c100', i: '🥉', n: 'Cent', d: '100 goede antwoorden', t: s => s.correct >= 100 },
  { id: 'c500', i: '🥈', n: 'Cinq cents', d: '500 goede antwoorden', t: s => s.correct >= 500 },
  { id: 'c1000', i: '🥇', n: 'Mille', d: '1000 goede antwoorden', t: s => s.correct >= 1000 },
  { id: 'm25', i: '🌱', n: 'Jeune pousse', d: '25 werkwoorden beheerst', t: s => mastered(s) >= 25 },
  { id: 'm50', i: '🌿', n: 'Jardinier', d: '50 werkwoorden beheerst', t: s => mastered(s) >= 50 },
  { id: 'm100', i: '🌳', n: 'La forêt', d: 'Alle werkwoorden beheerst', t: s => mastered(s) >= VERBS.length },
  { id: 'clean', i: '🧹', n: 'Le nettoyeur', d: 'Een foutenreview foutloos afronden', t: (_, r) => !!r && r.review && r.correct === r.total },
  ...TRACK.map((t): Badge => ({
    id: 'tr-' + t, i: '⭐', n: 'Maître: ' + TRACK_INFO[t].fr, d: '3 sterren op beide ' + TRACK_INFO[t].fr + '-niveaus',
    t: s => stars(s, `${t}-mc`) === 3 && stars(s, `${t}-type`) === 3,
  })),
  { id: 'unlock', i: '🔓', n: 'Toutes les portes', d: 'Alle niveaus ontgrendeld', t: s => allLevels().every(id => unlocked(s, id)) },
  { id: 'rank', i: '👑', n: 'Couronné', d: 'Bereik de rang Maître', t: s => s.xp >= 9000 },
];
