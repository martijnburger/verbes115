import { Nav } from '../components/Nav';
import { useGame } from '../game/context';
import { BADGES, RANKS, rankOf } from '../game/rewards';

export function Badges() {
  const { save } = useGame();
  return (
    <>
      <Nav />
      <div className="bgrid">
        {BADGES.map(b => (
          <div key={b.id} className={`badge ${save.badges[b.id] ? '' : 'locked'}`}>
            <div className="i">{b.i}</div><div className="bn">{b.n}</div><div className="bd">{b.d}</div>
            {save.badges[b.id] && <div className="hint">{save.badges[b.id]}</div>}
          </div>
        ))}
      </div>
      <h2>Rangen</h2>
      <div className="card">
        {RANKS.map((r, i) => (
          <div key={r[1]} style={{ padding: '4px 0', opacity: save.xp >= r[0] ? undefined : .45 }}>
            {r[2]} <b>{r[1]}</b> <span className="hint">{r[0]} XP</span>{rankOf(save.xp) === i && ' ← jij'}
          </div>
        ))}
      </div>
    </>
  );
}
