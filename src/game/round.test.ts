import { produce } from 'immer';
import { describe, expect, test } from 'vitest';
import { CONJ_TENSES, VERBS, full, persons } from '../engine/conjugate';
import { norm } from '../engine/check';
import { buildQ, distractors, finishRound, makeReview, makeRound, overrule, submit, type Game } from './round';
import { fresh, unlocked } from './save';

const game = (): Game => ({ save: fresh(), round: null });

describe('wrong options', () => {
  // Dutch options must be correct Dutch: never a wrongly conjugated form like "wij lijkt"
  test('Dutch options are always a real form of some verb, in the asked person or another tense', () => {
    const valid = new Set<string>();
    for (const v of VERBS) for (const t of CONJ_TENSES) for (const p of persons(v)) for (const neg of [false, true])
      valid.add(norm(full(v, 'nl', t, p, neg).d));
    for (let k = 0; k < 300; k++) {
      const v = VERBS[k % VERBS.length], t = CONJ_TENSES[k % CONJ_TENSES.length], p = persons(v)[k % persons(v).length];
      const own = full(v, 'nl', t, p, k % 2 === 1);
      // same verb: only the right person (another tense or the negation flip), never another person's form
      const wrongPersonOwn = persons(v).filter(q => q !== p).map(q => norm(full(v, 'nl', t, p, k % 2 === 1, q).d));
      for (const o of distractors(v, 'nl', t, p, k % 2 === 1, own.d)) {
        expect(valid.has(norm(o)), o).toBe(true);
        expect(wrongPersonOwn).not.toContain(norm(o));
      }
    }
  });
  test('three distinct options besides the answer', () => {
    for (const v of VERBS.slice(0, 40)) for (const lang of ['fr', 'nl'] as const) {
      const ans = full(v, lang, 'pres', persons(v)[0]).d;
      const opts = distractors(v, lang, 'pres', persons(v)[0], false, ans);
      expect(new Set([ans, ...opts].map(norm)).size).toBe(4);
    }
  });
});

describe('rounds', () => {
  test('a round has 10 questions; MC questions contain the answer', () => {
    const r = makeRound(fresh(), 'mix-mc');
    expect(r.qs).toHaveLength(10);
    for (const q of r.qs) expect(q.options).toContain(q.answer);
  });
  test('the verb pool setting is respected', () => {
    const s = fresh(); s.settings.pool = 25;
    for (let i = 0; i < 20; i++) for (const q of makeRound(s, 'pres-mc').qs) expect(VERBS[q.vi].rank).toBeLessThanOrEqual(25);
  });

  test('scoring, mistakes, stars and unlocking', () => {
    let g = game();
    g = { ...g, round: makeRound(g.save, 'inf-mc') };
    g.round!.qs.forEach((q, i) => {
      g = produce(g, d => { d.round!.i = i; submit(d, i < 8 ? q.answer : 'fout'); });
    });
    expect(g.round!.correct).toBe(8);
    expect(Object.keys(g.save.mistakes)).toHaveLength(2);
    g = produce(g, finishRound);
    expect(g.round!.outcome!.stars).toBe(2);
    expect(g.save.stars['inf-mc']).toBe(2);
    expect(g.round!.outcome!.newUnlocks).toEqual(['inf-type', 'pres-mc']);
    expect(g.round!.outcome!.newBadges).toContain('first');
    expect(g.save.xp).toBe(8 * 10 + 20);
    // finishing twice changes nothing
    expect(produce(g, finishRound)).toBe(g);
  });

  test('accent mistakes give half XP, or count as wrong in strict mode', () => {
    const v = VERBS.find(x => x.fr === 'aller')!;
    const q = buildQ(v, 'pc', 0, 'nl2fr', 'type');
    let g: Game = { save: fresh(), round: { level: 'pc-type', review: false, mode: 'type', qs: [q], i: 0, correct: 0, xp: 0, showTable: false } };
    const loose = produce(g, d => submit(d, 'je suis alle'));
    expect(loose.round!.qs[0].result).toBe('accent');
    expect(loose.save.xp).toBe(18);
    g = produce(g, d => { d.save.settings.strict = true; });
    const strict = produce(g, d => submit(d, 'je suis alle'));
    expect(strict.round!.qs[0].result).toBe('wrong');
    // "Ik had het goed" undoes the mistake
    const over = produce(strict, overrule);
    expect(over.round!.qs[0].result).toBe('overruled');
    expect(over.save.mistakes).toEqual({});
    expect(over.save.xp).toBe(36);
  });

  test('review round is built from the mistakes list', () => {
    const s = fresh();
    s.mistakes = { '0|pres|3|1': { n: 2 }, '5|inf|-1|0': { n: 1 } };
    const r = makeReview(s);
    expect(r.qs.map(q => q.key).sort()).toEqual(['0|pres|3|1', '5|inf|-1|0']);
    expect(r.qs.find(q => q.t === 'pres')!.neg).toBe(true);
  });

  test('locked levels', () => {
    const s = fresh();
    expect(unlocked(s, 'inf-mc')).toBe(true);
    expect(unlocked(s, 'inf-type')).toBe(false);
    expect(unlocked(s, 'pres-mc')).toBe(false);
  });
});
