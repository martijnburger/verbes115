import type { Tense } from '../engine/types';

export const TRACK = ['inf', 'pres', 'fp', 'pc', 'imp', 'fut', 'cond', 'subj', 'mix'] as const;
export type Track = Extract<Tense, typeof TRACK[number]> | 'mix';
export type Mode = 'mc' | 'type';
export type LevelId = `${Track}-${Mode}`;

export const TRACK_INFO: Record<Track, { fr: string; nl: string; ex: string }> = {
  inf:  { fr: 'Infinitif',      nl: 'Het hele werkwoord',                  ex: 'gaan → aller' },
  pres: { fr: 'Présent',        nl: 'Tegenwoordige tijd',                  ex: 'wij gaan → nous allons' },
  fp:   { fr: 'Futur proche',   nl: 'Nabije toekomst (aller + infinitief)', ex: 'ik ga eten → je vais manger' },
  pc:   { fr: 'Passé composé',  nl: 'Voltooid tegenwoordige tijd',         ex: 'ik ben gegaan → je suis allé(e)' },
  imp:  { fr: 'Imparfait',      nl: 'Onvoltooid verleden tijd',            ex: "ik ging → j'allais" },
  fut:  { fr: 'Futur simple',   nl: 'Toekomende tijd',                     ex: "ik zal gaan → j'irai" },
  cond: { fr: 'Conditionnel',   nl: 'Voorwaardelijke wijs',                ex: "ik zou gaan → j'irais" },
  subj: { fr: 'Subjonctif',     nl: 'Aanvoegende wijs (dat-zin)',          ex: "dat ik ga → que j'aille" },
  mix:  { fr: 'Grand mélange',  nl: 'Alle tijden door elkaar',             ex: 'de eindbaas 👑' },
};
export const ROUND_LEN = 10;

