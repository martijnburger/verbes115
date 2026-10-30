import { VERBS } from '../engine/conjugate';
import { useGame } from '../game/context';
import { BADGES, RANKS, rankOf } from '../game/rewards';
import { mastered } from '../game/save';

/** Rank, XP bar and overall stats */
export function Player() {
  const { save: S } = useGame();
  const ri = rankOf(S.xp), r = RANKS[ri], nx = RANKS[ri + 1];
  const pct = nx ? (S.xp - r[0]) / (nx[0] - r[0]) * 100 : 100;
  const accPct = S.answered ? Math.round(S.correct / S.answered * 100) : 0;
  return (
    <div className="card player">
      <div className="rankbadge">{r[2]}</div>
      <div>
        <div className="rankname">{r[1]} <span style={{ color: 'var(--muted)', fontWeight: 500, fontSize: 14 }}>· {S.xp} XP</span></div>
        <div className="bar"><i style={{ width: `${pct}%` }} /></div>
        <div className="stats">
          <span>{nx ? <>Nog <b>{nx[0] - S.xp}</b> XP tot <b>{nx[1]}</b></> : 'Hoogste rang bereikt!'}</span>
          <span><b>{mastered(S)}</b>/{VERBS.length} beheerst</span>
          <span><b>{accPct}%</b> goed</span>
          <span><b>{Object.keys(S.badges).length}</b>/{BADGES.length} badges</span>
        </div>
      </div>
    </div>
  );
}
