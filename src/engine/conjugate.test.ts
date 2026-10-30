import { describe, expect, test } from 'vitest';
import { BY_FREQ, CONJ_TENSES, VERBS, full, persons } from './conjugate';
import type { Lang, Person, Tense } from './types';

const V = (fr: string) => {
  const v = VERBS.find(x => x.fr === fr);
  if (!v) throw new Error(fr);
  return v;
};
const d = (fr: string, lang: Lang, t: Tense, p: Person, neg = false) => full(V(fr), lang, t, p, neg).d;

describe('French', () => {
  test.each([
    ['parler', 'pres', 3, 'nous parlons'],
    ['commencer', 'pres', 3, 'nous commençons'],
    ['manger', 'imp', 3, 'nous mangions'],
    ['manger', 'imp', 0, 'je mangeais'],
    ['finir', 'pres', 5, 'ils finissent'],
    ['être', 'imp', 0, "j'étais"],
    ['aller', 'fut', 0, "j'irai"],
    ['avoir', 'cond', 1, 'tu aurais'],
    ['faire', 'subj', 3, 'que nous fassions'],
    ['aller', 'subj', 0, "que j'aille"],
    ['aller', 'pc', 3, 'nous sommes allé(e)s'],
    ['prendre', 'pc', 0, "j'ai pris"],
    ['manger', 'fp', 0, 'je vais manger'],
  ] as const)('%s %s person %i = %s', (fr, t, p, out) => expect(d(fr, 'fr', t, p)).toBe(out));

  test('negation and elision', () => {
    expect(d('avoir', 'fr', 'pres', 0, true)).toBe("je n'ai pas");
    expect(d('être', 'fr', 'pc', 3, true)).toBe("nous n'avons pas été");
  });

  test('reflexive verbs', () => {
    expect(d('se lever', 'fr', 'pres', 0)).toBe('je me lève');
    expect(d("s'habiller", 'fr', 'pres', 0)).toBe("je m'habille");
    expect(d('se lever', 'fr', 'pc', 2)).toBe("il s'est levé");
    expect(d('se lever', 'fr', 'fp', 0, true)).toBe('je ne vais pas me lever');
    expect(d("s'amuser", 'fr', 'pres', 3, true)).toBe('nous ne nous amusons pas');
  });

  test('impersonal verbs only have "il"', () => {
    expect(persons(V('falloir'))).toEqual([2]);
    expect(d('falloir', 'fr', 'pres', 2)).toBe('il faut');
    expect(d('pleuvoir', 'fr', 'pc', 2)).toBe('il a plu');
  });

  test('être agreement: masculine and feminine are both accepted', () => {
    const a = full(V('aller'), 'fr', 'pc', 4).a;
    for (const x of ['vous êtes allé', 'vous êtes allée', 'vous êtes allés', 'vous êtes allées']) expect(a).toContain(x);
    expect(full(V('venir'), 'fr', 'pc', 2).a).toContain('elle est venue');
  });
});

describe('Dutch', () => {
  test.each([
    ['parler', 'pres', 0, 'ik spreek'],
    ['rendre', 'pres', 0, 'ik geef terug'],
    ['rendre', 'pc', 0, 'ik heb teruggegeven'],
    ['aller', 'pc', 0, 'ik ben gegaan'],
    ['aller', 'fut', 3, 'wij zullen gaan'],
    ['aller', 'subj', 0, 'dat ik ga'],
  ] as const)('%s %s person %i = %s', (fr, t, p, out) => expect(d(fr, 'nl', t, p)).toBe(out));

  test('reflexive and negation word order', () => {
    expect(d("s'habiller", 'nl', 'pres', 0, true)).toBe('ik kleed me niet aan');
    expect(d("s'habiller", 'nl', 'subj', 0, true)).toBe('dat ik me niet aankleed');
  });

  test('accepted pronoun variants', () => {
    const a = full(V('parler'), 'nl', 'pres', 2).a;
    for (const x of ['hij spreekt', 'zij spreekt', 'ze spreekt', 'het spreekt']) expect(a).toContain(x);
    expect(full(V('parler'), 'nl', 'pres', 1).a).toContain('je spreekt');
    expect(full(V('aller'), 'nl', 'fp', 0).a).toEqual(expect.arrayContaining(['ik ga gaan', 'ik zal gaan']));
  });
});

describe('all verbs', () => {
  test('115 verbs, all in the frequency list', () => {
    expect(VERBS).toHaveLength(115);
    expect(BY_FREQ.map(v => v.rank)).toEqual(VERBS.map((_, i) => i + 1));
  });
  test('every form exists and its display form is accepted', () => {
    for (const v of VERBS) for (const lang of ['fr', 'nl'] as const) for (const t of ['inf', ...CONJ_TENSES] as const)
      for (const p of persons(v)) for (const neg of [false, true]) {
        const f = full(v, lang, t, p, neg);
        expect(f.d, `${v.fr} ${lang} ${t} ${p}`).toMatch(/\S/);
        expect(f.d).not.toMatch(/undefined|null|\s{2}/);
        if (lang === 'nl' || !f.d.includes('(')) expect(f.a).toContain(f.d);
      }
  });
});

describe('regular / irregular', () => {
  const kind = (fr: string) => V(fr).kind;
  test.each(['parler', 'aimer', 'finir', 'choisir', 'vendre', 'attendre', 'se coucher'])('%s is regular', fr => expect(kind(fr)).toBe('regular'));
  test.each(['commencer', 'manger', 'acheter', 'payer', 'appeler', 'jeter', 'préférer', 'se lever'])('%s is regular with a spelling change', fr => expect(kind(fr)).toBe('spelling'));
  test.each(['être', 'avoir', 'aller', 'faire', 'envoyer', 'partir', 'dormir', 'ouvrir', 'prendre', 'falloir', "s'asseoir"])('%s is irregular', fr => expect(kind(fr)).toBe('irregular'));
  test('the spelling change matches the actual forms', () => {
    expect(full(V('acheter'), 'fr', 'pres', 0).d).toBe("j'achète");
    expect(full(V('commencer'), 'fr', 'pres', 3).d).toBe('nous commençons');
  });
});
