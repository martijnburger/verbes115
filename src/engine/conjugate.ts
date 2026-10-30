// Conjugation engine (no DOM): builds all French and Dutch forms from the compact verb data.
import { FREQ, VERB_DATA } from '../data/verbs';
import type { ConjTense, Form, FrForm, FrSpec, Lang, NlForm, Person, Tense, Verb, VerbEntry, VerbKind } from './types';

export const P_FR = ['je', 'tu', 'il', 'nous', 'vous', 'ils'];
export const P_NL = ['ik', 'jij', 'hij', 'wij', 'jullie', 'zij'];
const P_FR_ALT = [['je'], ['tu'], ['il', 'elle', 'on'], ['nous'], ['vous'], ['ils', 'elles']];
const P_NL_ALT = [['ik'], ['jij', 'je'], ['hij', 'zij', 'ze', 'het'], ['wij', 'we'], ['jullie'], ['zij', 'ze']];
const R_FR = ['me', 'te', 'se', 'nous', 'vous', 'se'];
const R_NL = [['me', 'mij'], ['je'], ['zich'], ['ons'], ['je'], ['zich']];

export const TENSES: Record<Tense, { fr: string; nl: string; rank: number }> = {
  inf:  { fr: 'Infinitif',     nl: 'Het hele werkwoord',               rank: 0 },
  pres: { fr: 'Présent',       nl: 'Tegenwoordige tijd',               rank: 1 },
  fp:   { fr: 'Futur proche',  nl: 'Nabije toekomst (gaan + …)',       rank: 2 },
  pc:   { fr: 'Passé composé', nl: 'Voltooid tegenwoordige tijd',      rank: 2 },
  imp:  { fr: 'Imparfait',     nl: 'Onvoltooid verleden tijd',         rank: 2 },
  fut:  { fr: 'Futur simple',  nl: 'Toekomende tijd (zal …)',          rank: 3 },
  cond: { fr: 'Conditionnel',  nl: 'Voorwaardelijke wijs (zou …)',     rank: 3 },
  subj: { fr: 'Subjonctif',    nl: 'Aanvoegende wijs (que … / dat …)', rank: 4 },
};
export const CONJ_TENSES: ConjTense[] = ['pres', 'fp', 'pc', 'imp', 'fut', 'cond', 'subj'];
// tenses that often translate to the same Dutch: never offer one as a wrong Dutch option for the other
export const NL_SAME: ConjTense[][] = [['pres', 'subj'], ['fut', 'fp']];

const VOW = /^[aeiouyàâäéèêëîïôöûùüœh]/i;
const END = {
  imp:  ['ais', 'ais', 'ait', 'ions', 'iez', 'aient'],
  fut:  ['ai', 'as', 'a', 'ons', 'ez', 'ont'],
  cond: ['ais', 'ais', 'ait', 'ions', 'iez', 'aient'],
};
const AUX_FR = { a: ['ai', 'as', 'a', 'avons', 'avez', 'ont'], e: ['suis', 'es', 'est', 'sommes', 'êtes', 'sont'] };
const AUX_NL: Record<string, string[]> = {
  h: ['heb', 'hebt', 'heeft', 'hebben', 'hebben', 'hebben'],
  z: ['ben', 'bent', 'is', 'zijn', 'zijn', 'zijn'],
};
const ZAL = ['zal', 'zult', 'zal', 'zullen', 'zullen', 'zullen'];
const ZOU = ['zou', 'zou', 'zou', 'zouden', 'zouden', 'zouden'];

function frPresent(inf: string, s: FrSpec): string[] {
  if (s.p) return s.p.split(',');
  const st = inf.slice(0, -2);
  if (s.t === 'er') {
    const nous = st.endsWith('c') ? st.slice(0, -1) + 'ç' : st.endsWith('g') ? st + 'e' : st;
    return [st + 'e', st + 'es', st + 'e', nous + 'ons', st + 'ez', st + 'ent'];
  }
  if (s.t === 'ir') return [st + 'is', st + 'is', st + 'it', st + 'issons', st + 'issez', st + 'issent'];
  if (s.t === 're') return [st + 's', st + 's', st, st + 'ons', st + 'ez', st + 'ent'];
  throw new Error(`No present tense for ${inf}`);
}
function frImpStem(stem: string, ending: string): string {
  // commenç+ions -> commencions, mange+ions -> mangions
  if (ending[0] === 'i') {
    if (stem.endsWith('ç')) return stem.slice(0, -1) + 'c';
    if (stem.endsWith('ge')) return stem.slice(0, -1);
  }
  return stem;
}
// je/me/te/se/ne + vowel -> j'/m'/t'/s'/n'
function elide(w: string, rest: string): string {
  return ['je', 'me', 'te', 'se', 'ne'].includes(w) && VOW.test(rest) ? w[0] + "'" + rest : w + ' ' + rest;
}

export function buildVerb([fr, nlSpec, s, alts]: VerbEntry, idx: number): Verb {
  const refl = !!s.r, imp = !!s.imp, etre = !!(s.e || s.r);
  // regular = fully built from the -er/-ir/-re rules, without exceptions
  const kind: VerbKind = s.sp ? 'spelling' : s.t && !s.p && !s.pp && !s.f && !s.i && !s.s ? 'regular' : 'irregular';
  const base = fr.replace(/^(se |s')/, '');
  // ---- French: per tense, 6 x {fin, pp}  (pp only in passé composé: {d, a})
  const pres = frPresent(base, s);
  const pp = s.pp || (s.t === 'er' ? base.slice(0, -2) + 'é' : s.t === 'ir' ? base.slice(0, -2) + 'i' : base.slice(0, -2) + 'u');
  const iStem = s.i || pres[3].slice(0, -3);
  const impf = END.imp.map(e => frImpStem(iStem, e) + e);
  const fStem = s.f || (base.endsWith('re') ? base.slice(0, -1) : base);
  let subj: string[];
  if (s.s) subj = s.s.split(',');
  else { const st = pres[5].slice(0, -3); subj = [st + 'e', st + 'es', st + 'e', impf[3], impf[4], st + 'ent']; }
  const simple = (arr: string[]): FrForm[] => arr.map(fin => ({ fin, pp: null }));
  const pl = pp.endsWith('s') ? pp : pp + 's';
  const ppForms = (p: Person) => {
    if (!etre) return { d: pp, a: [pp] };
    const d = [pp + '(e)', pp + '(e)', pp, pp + (pp.endsWith('s') ? '(es)' : '(e)s'), pp + (pp.endsWith('s') ? '(es)' : '(e)s'), pl][p];
    const a = [[pp, pp + 'e'], [pp, pp + 'e'], [pp, pp + 'e'], [pl, pp + 'es'], [pp, pp + 'e', pl, pp + 'es'], [pl, pp + 'es']][p];
    return { d, a: [d, ...a] };
  };
  const frForms: Record<ConjTense, FrForm[]> = {
    fp:   ['vais', 'vas', 'va', 'allons', 'allez', 'vont'].map(fin => ({ fin, pp: null, inf: base })),
    pres: simple(pres), imp: simple(impf), subj: simple(subj),
    fut:  simple(END.fut.map(e => fStem + e)),
    cond: simple(END.cond.map(e => fStem + e)),
    pc:   AUX_FR[etre ? 'e' : 'a'].map((fin, p) => ({ fin, pp: ppForms(p) })),
  };

  // ---- Dutch: per tense, 6 x {fin:[alternatives], rest}
  //   main clause:  pron fin [refl] [niet] rest      ("ik kleed me niet aan", "ik heb niet teruggegeven")
  //   subj (dat-):  dat pron [refl] [niet] rest      ("dat ik me niet aankleed")
  let [inf, ik, jh, ovt, nlpp, nlaux] = nlSpec.split('|');
  const nlRefl = inf.startsWith('zich ');
  if (nlRefl) inf = inf.slice(5);
  const [sep, nbase] = inf.includes('+') ? inf.split('+') : ['', inf];
  const [jij, hij] = jh.includes(',') ? jh.split(',') : [jh, jh];
  const [osg, opl] = ovt.split(',');
  const post = s.np || '';
  const words = (...w: string[]) => w.filter(Boolean).join(' ');
  const tail = words(sep.trim(), post);              // after the finite verb in a main clause
  const glued = (x: string) => words(sep + x, post); // particle glued to participle/infinitive
  const nl = (nlRefl ? 'zich ' : '') + glued(nbase);
  const p6 = [ik, jij, hij, nbase, nbase, nbase];
  const o6 = [osg, osg, osg, opl, opl, opl];
  const nlForms: Record<ConjTense, NlForm[]> = {
    pres: p6.map(x => ({ fin: [x], rest: tail })),
    imp:  o6.map(x => ({ fin: [x], rest: tail })),
    pc:   AUX_NL[nlaux].map(a => ({ fin: [a], rest: glued(nlpp) })),
    fut:  ZAL.map((z, p) => ({ fin: p === 1 ? [z, 'zal'] : [z], rest: glued(nbase) })),
    cond: ZOU.map(z => ({ fin: [z], rest: glued(nbase) })),
    subj: p6.map(x => ({ fin: [''], rest: glued(x) })),
    // "zal" is accepted too ("ik ga gaan" / "ik zal gaan")
    fp:   ['ga', 'gaat', 'gaat', 'gaan', 'gaan', 'gaan'].map((g, p) => ({ fin: [g, ZAL[p], ...(p === 1 ? ['zal'] : [])], rest: glued(nbase) })),
  };
  return {
    idx, fr, s, refl, imp, etre, kind,
    rank: FREQ.indexOf(fr) + 1,
    frForms, nlForms, nl, nlRefl,
    nlAlts: [nl, ...(alts ? alts.split(',') : [])],
  };
}

export const VERBS: Verb[] = VERB_DATA.map(buildVerb);
export const BY_FREQ: Verb[] = [...VERBS].sort((a, b) => a.rank - b.rank);

function composeFr(v: Verb, t: Tense, p: Person, pron: string, fin: string, pp: string | null, neg: boolean, inf?: string): string {
  let core = fin;
  if (v.refl && !inf) core = elide(R_FR[p], core);
  if (neg) core = elide('ne', core) + ' pas';
  if (pp) core += ' ' + pp;
  // futur proche: "je vais me lever", "je ne vais pas me lever"
  if (inf) core += ' ' + (v.refl ? elide(R_FR[p], inf) : inf);
  let s = elide(pron, core);
  if (t === 'subj') s = (/^[aeiouéè]/.test(s) ? "qu'" : 'que ') + s;
  return s;
}
function composeNl(t: Tense, pron: string, fin: string, refl: string, rest: string, neg: boolean): string {
  const s = [pron, fin, refl, neg ? 'niet' : '', rest].filter(Boolean).join(' ');
  return t === 'subj' ? 'dat ' + s : s;
}

/** Full form of verb v for person p; the verb form is taken from person q (used for wrong-person options) */
export function full(v: Verb, lang: Lang, t: Tense, p: Person, neg = false, q: Person = p): Form {
  if (t === 'inf') return lang === 'fr' ? { d: v.fr, a: [v.fr] } : { d: v.nl, a: v.nlAlts };
  const a: string[] = [];
  if (lang === 'fr') {
    const f = v.frForms[t][q];
    const prons = v.imp ? ['il'] : P_FR_ALT[p];
    const pps = f.pp ? f.pp.a : [null];
    for (const pr of prons) for (const x of pps) a.push(composeFr(v, t, p, pr, f.fin, x, neg, f.inf));
    return { d: composeFr(v, t, p, P_FR[p], f.fin, f.pp && f.pp.d, neg, f.inf), a };
  }
  const f = v.nlForms[t][q];
  const prons = v.imp ? ['het'] : P_NL_ALT[p];
  const refls = v.nlRefl ? R_NL[p] : [''];
  for (const pr of prons) for (const fi of f.fin) for (const r of refls) a.push(composeNl(t, pr, fi, r, f.rest, neg));
  return { d: composeNl(t, v.imp ? 'het' : P_NL[p], f.fin[0], refls[0], f.rest, neg), a };
}

/** Persons a verb is used with: impersonal verbs only have "il" */
export const persons = (v: Verb): Person[] => (v.imp ? [2] : [0, 1, 2, 3, 4, 5]);
