import { Nav } from '../components/Nav';
import { FrText, Speaker } from '../components/Speaker';
import { useGame } from '../game/context';
import { levelName } from '../game/round';
import { BADGES } from '../game/rewards';

export function Results() {
  const { round: R, go, startLevel, startReview } = useGame();
  if (!R?.outcome) return null;
  const o = R.outcome, total = R.qs.length, pct = Math.round(R.correct / total * 100);
  const wrong = R.qs.filter(q => q.result === 'wrong');
  const nxt = o.newUnlocks[0];
  return (
    <>
      <Nav />
      <div className="card">
        <div className="big">{'★'.repeat(o.stars)}<span style={{ color: 'var(--line)' }}>{'★'.repeat(3 - o.stars)}</span></div>
        <div className="center" style={{ fontSize: 20, fontWeight: 700 }}>
          {pct === 100 ? 'Parfait !' : pct >= 80 ? 'Excellent !' : pct >= 60 ? 'Pas mal !' : 'Courage, on continue !'}
        </div>
        <div className="kpis">
          <div className="kpi"><b>{R.correct}/{total}</b><span>goed</span></div>
          <div className="kpi"><b>{pct}%</b><span>score</span></div>
          <div className="kpi"><b>+{R.xp}</b><span>XP (incl. {o.bonus} bonus)</span></div>
        </div>
        {o.rankUp && <div className="news">{o.rankUp[2]} Nieuwe rang: <b>{o.rankUp[1]}</b>!</div>}
        {o.newUnlocks.length > 0 && (
          <div className="news">🔓 Ontgrendeld: {o.newUnlocks.map((id, k) => <span key={id}>{k > 0 && ', '}<b>{levelName(id)}</b></span>)}</div>
        )}
        {o.newBadges.map(id => BADGES.find(b => b.id === id)!).map(b => (
          <div key={b.id} className="news">{b.i} Nieuwe badge: <b>{b.n}</b> ({b.d})</div>
        ))}
        {!R.review && o.stars < 2 && <p className="hint">Haal minimaal 80% (★★) om verder te komen.</p>}
        {wrong.length > 0 && (
          <>
            <h2>Om te onthouden</h2>
            <ul className="mlist">
              {wrong.map(q => (
                <li key={q.key}>
                  <FrText text={q.prompt} fr={q.tgt === 'nl'} /> → {q.given && <span className="w">{q.given}</span>}
                  <b>{q.answer}</b>{q.tgt === 'fr' && <Speaker text={q.answer} />}
                </li>
              ))}
            </ul>
          </>
        )}
        <div className="row">
          <button className="btn ghost" onClick={() => go('home')}>Overzicht</button>
          <span className="spacer" />
          <button className="btn" onClick={() => (R.level === 'review' ? startReview() : startLevel(R.level))}>
            {R.review ? 'Nog een review' : 'Opnieuw'}
          </button>
          {nxt && <button className="btn red" onClick={() => startLevel(nxt)}>Volgend niveau →</button>}
        </div>
      </div>
    </>
  );
}
