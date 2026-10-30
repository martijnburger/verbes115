import { VERBS } from '../engine/conjugate';
import { useGame, type View } from '../game/context';

const ITEMS: [View, string][] = [['home', 'Oefenen'], ['verbs', 'Werkwoorden'], ['badges', 'Badges'], ['settings', 'Instellingen']];

export function Nav() {
  const { view, go } = useGame();
  return (
    <header className="top">
      <div className="logo"><span>Verbes</span> <b>{VERBS.length}</b></div>
      <nav>{ITEMS.map(([k, l]) => <button key={k} className={view === k ? 'on' : ''} onClick={() => go(k)}>{l}</button>)}</nav>
    </header>
  );
}
