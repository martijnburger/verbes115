import { full, persons } from '../engine/conjugate';
import type { Person, Tense, Verb } from '../engine/types';
import { FrText } from './Speaker';

/** French and Dutch forms for all persons; person p is highlighted */
export function ConjTable({ v, t, p = -1, neg = false }: { v: Verb; t: Tense; p?: Person; neg?: boolean }) {
  if (t === 'inf') return null;
  return (
    <table className="conj">
      <tbody>
        <tr><th>Frans</th><th>Nederlands</th></tr>
        {persons(v).map(i => (
          <tr key={i} className={i === p ? 'hl' : ''}>
            <td><FrText text={full(v, 'fr', t, i, neg).d} fr /></td>
            <td>{full(v, 'nl', t, i, neg).d}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
