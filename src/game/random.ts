export const rnd = (n: number) => Math.floor(Math.random() * n);
export const pick = <T,>(a: readonly T[]): T => a[rnd(a.length)];
export function shuffle<T>(a: readonly T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) { const j = rnd(i + 1); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}
