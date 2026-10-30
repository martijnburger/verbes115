export type Tense = 'inf' | 'pres' | 'fp' | 'pc' | 'imp' | 'fut' | 'cond' | 'subj';
export type ConjTense = Exclude<Tense, 'inf'>;
export type Lang = 'fr' | 'nl';
/** 0..5 = je, tu, il, nous, vous, ils */
export type Person = number;

/**
 * French spec of a verb.
 * t = er/ir/re for regular verbs, else p = present (6 forms, comma separated, '-' for unused persons);
 * pp = past participle, e = uses être, r = reflexive, imp = impersonal (only "il"),
 * f = futur stem, i = imparfait stem, s = subjonctif (6 forms), np = Dutch trailing word,
 * sp = regular verb with a spelling change: explanation for the learner
 */
export interface FrSpec {
  t?: 'er' | 'ir' | 're';
  p?: string;
  pp?: string;
  e?: 1;
  r?: 1;
  imp?: 1;
  f?: string;
  i?: string;
  s?: string;
  np?: string;
  sp?: string;
}

/** [french infinitive, dutch spec, french spec, dutch alternatives (comma separated)] */
export type VerbEntry = [fr: string, nlSpec: string, frSpec: FrSpec, alts?: string];

/** A French finite form; pp only in passé composé, inf only in futur proche */
export interface FrForm {
  fin: string;
  pp: { d: string; a: string[] } | null;
  inf?: string;
}

/** A Dutch form: finite verb (with accepted alternatives) and the rest of the verb group */
export interface NlForm {
  fin: string[];
  rest: string;
}

/** regular: -er, -ir (nous finissons) or -re (vendre); spelling: regular with a spelling change (j'achète) */
export type VerbKind = 'regular' | 'spelling' | 'irregular';

export interface Verb {
  /** index in VERB_DATA; saved progress refers to it */
  idx: number;
  fr: string;
  s: FrSpec;
  refl: boolean;
  imp: boolean;
  etre: boolean;
  kind: VerbKind;
  /** position in the frequency list, 1 = most used */
  rank: number;
  frForms: Record<ConjTense, FrForm[]>;
  nlForms: Record<ConjTense, NlForm[]>;
  nl: string;
  nlAlts: string[];
  nlRefl: boolean;
}

/** d = display form, a = all accepted answers */
export interface Form {
  d: string;
  a: string[];
}
