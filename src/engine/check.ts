export type CheckResult = 'ok' | 'accent' | 'wrong';

/** Normalize an answer: case, apostrophes, spaces, final punctuation and a leading que/qu'/dat don't matter */
export function norm(s: string): string {
  return s.toLowerCase().normalize('NFC')
    .replace(/[’‘`´]/g, "'").replace(/\s+/g, ' ').replace(/'\s+/g, "'")
    .trim().replace(/[.!?]+$/, '')
    .replace(/^(que |qu'|dat )/, '');
}
export function deaccent(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}
/** 'ok' = correct, 'accent' = correct apart from accents, 'wrong' otherwise */
export function checkAnswer(input: string, accepted: string[]): CheckResult {
  const n = norm(input);
  if (!n) return 'wrong';
  const acc = accepted.map(norm);
  if (acc.includes(n)) return 'ok';
  if (acc.map(deaccent).includes(deaccent(n))) return 'accent';
  return 'wrong';
}
