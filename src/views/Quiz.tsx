import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { ConjTable } from '../components/ConjTable';
import { FrText, Speaker } from '../components/Speaker';
import { norm } from '../engine/check';
import { TENSES, VERBS } from '../engine/conjugate';
import { useGame } from '../game/context';
import { finishRound, levelName, overrule, submit, type Question } from '../game/round';

const ACCENTS = ['é', 'è', 'ê', 'à', 'â', 'ç', 'î', 'ï', 'ô', 'û', 'ù', 'ë', 'œ'];
const TITLES = { ok: '✓ Très bien !', overruled: '✓ Goedgekeurd', accent: '≈ Bijna! Let op de accenten', wrong: '✗ Pas tout à fait…' };

export function Quiz() {
  const { round: R, update, go } = useGame();
  if (!R) return null;
  const quit = () => { if (confirm('Ronde stoppen? Je beantwoorde vragen tellen wel mee.')) go('home'); };
  return (
    <>
      <div className="qhead">
        <button className="x" title="Stoppen" onClick={quit}>✕</button>
        <div className="segs">{R.qs.map((x, k) => <i key={k} className={x.result ? (x.result === 'wrong' ? 'bad' : 'ok') : k === R.i ? 'cur' : ''} />)}</div>
        <div className="qxp">+{R.xp} XP</div>
      </div>
      {/* key: fresh input state for every question */}
      <QuestionCard key={R.i} q={R.qs[R.i]} last={R.i === R.qs.length - 1}
        lvl={R.level === 'review' ? 'Foutenreview' : levelName(R.level)}
        showTable={R.showTable}
        onSubmit={given => update(g => submit(g, given))}
        onOverrule={() => update(overrule)}
        onToggleTable={() => update(g => { g.round!.showTable = !g.round!.showTable; })}
        onNext={() => {
          if (R.i < R.qs.length - 1) update(g => { g.round!.i++; g.round!.showTable = false; });
          else { update(finishRound); go('results'); }
        }} />
    </>
  );
}

interface CardProps {
  q: Question;
  last: boolean;
  lvl: string;
  showTable: boolean;
  onSubmit: (given: string) => void;
  onOverrule: () => void;
  onToggleTable: () => void;
  onNext: () => void;
}

function QuestionCard({ q, last, lvl, showTable, onSubmit, onOverrule, onToggleTable, onNext }: CardProps) {
  const v = VERBS[q.vi], answered = !!q.result, ok = answered && q.result !== 'wrong';
  const [typed, setTyped] = useState('');
  const input = useRef<HTMLInputElement>(null);

  // Enter = check / next, 1-4 = choose an option
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (q.result) onNext(); else if (q.mode === 'type') onSubmit(input.current?.value ?? '');
      } else if (!q.result && q.mode === 'mc' && /^[1-4]$/.test(e.key)) onSubmit(q.options![+e.key - 1]);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [q, onNext, onSubmit]);

  const insertAccent = (a: string) => {
    const el = input.current!;
    const s = el.selectionStart ?? typed.length, e = el.selectionEnd ?? s;
    flushSync(() => setTyped(typed.slice(0, s) + a + typed.slice(e)));
    el.focus(); el.setSelectionRange(s + 1, s + 1);
  };

  const askText = q.t === 'inf'
    ? (q.tgt === 'fr' ? 'Wat is het Franse werkwoord?' : 'Wat betekent dit werkwoord?')
    : (q.tgt === 'fr' ? `Vertaal naar het Frans (${TENSES[q.t].fr.toLowerCase()})` : `Vertaal naar het Nederlands (${TENSES[q.t].nl.toLowerCase()})`);
  const kind = q.result === 'wrong' ? 'bad' : q.result === 'accent' ? 'warn' : 'ok';

  return (
    <div className="card">
      <div className="chips">
        <span className="chip">{lvl}</span><span className="chip">{TENSES[q.t].fr}</span>
        {q.neg && <span className="chip neg">Ontkenning</span>}
        <span className="chip alt">{q.dir === 'nl2fr' ? '🇳🇱 → 🇫🇷' : '🇫🇷 → 🇳🇱'}</span>
      </div>
      <div className="prompt"><FrText text={q.prompt} fr={q.tgt === 'nl'} /></div>
      <div className="ask">{askText}</div>

      {q.mode === 'mc' ? (
        <div className="opts">
          {q.options!.map((o, k) => {
            // "locked" instead of disabled, so the speaker inside stays clickable
            let cls = '';
            if (answered) { cls = 'locked'; if (norm(o) === norm(q.answer)) cls += ' right'; else if (o === q.given) cls += ' wrong'; }
            return (
              <button key={k} className={`opt ${cls}`} onClick={() => onSubmit(o)}>
                <span className="k">{k + 1}</span><FrText text={o} fr={q.tgt === 'fr'} />
              </button>
            );
          })}
        </div>
      ) : (
        <>
          <input ref={input} className={`answer ${answered ? (ok ? 'right' : 'wrong') : ''}`} autoFocus
            autoComplete="off" autoCapitalize="off" spellCheck={false} placeholder="Typ je antwoord…"
            value={answered ? q.given ?? '' : typed} disabled={answered} onChange={e => setTyped(e.target.value)} />
          {q.tgt === 'fr' && !answered && (
            <div className="accents">
              {ACCENTS.map(a => (
                <button key={a} tabIndex={-1} onMouseDown={e => e.preventDefault()} onClick={() => insertAccent(a)}>{a}</button>
              ))}
            </div>
          )}
          {!answered && (
            <div className="row">
              <span className="hint">Enter = controleren{q.t === 'subj' ? ' · "que" mag je weglaten' : ''}</span>
              <span className="spacer" />
              <button className="btn" onClick={() => onSubmit(typed)}>Controleer</button>
            </div>
          )}
        </>
      )}

      {answered && (
        <>
          <div className={`fb ${kind}`}>
            <div className="t">{TITLES[q.result!]}{ok && <> <span style={{ color: 'var(--gold)' }}>+{q.xp} XP</span></>}</div>
            {(q.result !== 'ok' || q.tgt === 'fr') && (
              <div className="sol">{q.result !== 'ok' && 'Juist: '}<b>{q.answer}</b>{q.tgt === 'fr' && <Speaker text={q.answer} />}</div>
            )}
            <div className="hint">
              <FrText text={v.fr} fr /> = {v.nl}{v.etre && ' · vervoegd met être'}{v.imp && ' · onpersoonlijk (alleen "il")'}
            </div>
          </div>
          {showTable && <ConjTable v={v} t={q.t} p={q.p} neg={q.neg} />}
          <div className="row">
            {q.t !== 'inf' && <button className="btn ghost" onClick={onToggleTable}>{showTable ? 'Verberg' : 'Toon'} vervoeging</button>}
            {q.result === 'wrong' && q.mode === 'type' && (
              <button className="btn ghost" title="Bijv. een ander goed synoniem" onClick={onOverrule}>Ik had het goed</button>
            )}
            <span className="spacer" />
            <button className="btn" onClick={onNext}>{last ? 'Resultaat' : 'Volgende →'}</button>
          </div>
        </>
      )}
    </div>
  );
}
