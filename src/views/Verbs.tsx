import { useEffect, useState } from 'react';
import { ConjTable } from '../components/ConjTable';
import { Nav } from '../components/Nav';
import { FrText } from '../components/Speaker';
import { norm } from '../engine/check';
import { BY_FREQ, CONJ_TENSES, TENSES } from '../engine/conjugate';
import type { Verb, VerbKind } from '../engine/types';
import { useGame } from '../game/context';

export type VerbSort = 'freq' | 'weak' | 'az';

const KIND_TAG: Record<VerbKind, [string, string]> = {
  regular: ['regelmatig', 'reg'],
  spelling: ['regelmatig*', 'spell'],
  irregular: ['onregelmatig', 'irr'],
};
const KindTag = ({ v }: { v: Verb }) => {
  const [label, cls] = KIND_TAG[v.kind];
  return <span className={`tag ${cls}`} title={v.s.sp ? `Regelmatig met spellingswijziging: ${v.s.sp}` : undefined}>{label}</span>;
};
/** e.g. "regelmatig -er-werkwoord" */
function kindText(v: Verb) {
  const group = v.fr.replace(/^(se |s')/, '').slice(-2);
  if (v.kind === 'regular') return <>regelmatig -{group}-werkwoord</>;
  if (v.kind === 'spelling') return <>regelmatig -{group}-werkwoord met spellingswijziging: {v.s.sp}</>;
  return <>onregelmatig werkwoord</>;
}

/** filter and sort are kept by the parent, so they survive switching views */
export function Verbs({ filter, setFilter, sort, setSort }:
  { filter: string; setFilter: (s: string) => void; sort: VerbSort; setSort: (s: VerbSort) => void }) {
  const { save } = useGame();
  const [open, setOpen] = useState<Verb | null>(null);
  const st = (v: Verb) => save.verbs[v.idx] || { c: 0, w: 0, box: -1 };
  const f = norm(filter);
  let list = BY_FREQ.filter(v => !f || norm(v.fr).includes(f) || v.nlAlts.some(a => norm(a).includes(f)));
  if (sort === 'weak') list = [...list].sort((a, b) => (st(a).box - st(b).box) || (st(b).w - st(a).w));
  if (sort === 'az') list = [...list].sort((a, b) => a.fr.localeCompare(b.fr, 'fr'));

  return (
    <>
      <Nav />
      <div className="vtools">
        <input placeholder="Zoek (Frans of Nederlands)…" value={filter} onChange={e => setFilter(e.target.value)} />
        <select value={sort} onChange={e => setSort(e.target.value as VerbSort)}>
          <option value="freq">Op frequentie</option>
          <option value="weak">Zwakste eerst</option>
          <option value="az">A–Z</option>
        </select>
      </div>
      <p className="hint" style={{ marginTop: 0 }}>
        Groen = beheersing (5 blokjes = helemaal), rood = nog nooit goed. Klik op een werkwoord voor alle vervoegingen.
        <br />Regelmatig* = regelmatig, maar met een kleine spellingswijziging (bijv. j'achète).
      </p>
      <div className="vgrid">
        {list.map(v => {
          const s = st(v);
          return (
            <button key={v.idx} className="verb" onClick={() => setOpen(v)}>
              <span className="n">{v.rank}</span>
              <span>
                <div className="fr">
                  <FrText text={v.fr} fr />
                  <KindTag v={v} />
                  {v.refl && <span className="tag">wederkerend</span>}
                  {v.imp && <span className="tag">onpersoonlijk</span>}
                </div>
                <div className="nl">{v.nl}</div>
                <div className="dots">{[1, 2, 3, 4, 5].map(i => <i key={i} className={s.box >= i ? 'on' : s.box === 0 && i === 1 ? 'bad' : ''} />)}</div>
                {(s.c > 0 || s.w > 0) && <div className="hint" style={{ marginTop: 2 }}>✓ {s.c} · ✗ {s.w}</div>}
              </span>
            </button>
          );
        })}
      </div>
      {open && <VerbModal v={open} onClose={() => setOpen(null)} />}
    </>
  );
}

function VerbModal({ v, onClose }: { v: Verb; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    // the backdrop only closes when the click is on the backdrop itself, not inside the card
    <div className="modal" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="card">
        <div className="row" style={{ marginTop: 0 }}>
          <div>
            <div className="prompt" style={{ margin: 0 }}><FrText text={v.fr} fr /></div>
            <div className="ask" style={{ margin: 0 }}>{v.nlAlts.join(', ')}{v.etre && <> · passé composé met <b>être</b></>}</div>
            <div className="hint"><KindTag v={v} /> {kindText(v)}</div>
          </div>
          <span className="spacer" />
          <button className="btn ghost" onClick={onClose}>Sluiten</button>
        </div>
        <div className="tensegrid">
          {CONJ_TENSES.map(t => (
            <div key={t}>
              <h3>{TENSES[t].fr} <span className="hint">· {TENSES[t].nl}</span></h3>
              <ConjTable v={v} t={t} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
