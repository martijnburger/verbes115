import { Nav } from '../components/Nav';
import { Player } from '../components/Player';
import { Stars } from '../components/Stars';
import { useGame } from '../game/context';
import { TRACK, TRACK_INFO, type LevelId } from '../game/levels';
import { stars, unlocked } from '../game/save';

export function Home() {
  const { save, startLevel, startReview } = useGame();
  const nm = Object.keys(save.mistakes).length;
  const tile = (id: LevelId, label: string) => {
    const un = unlocked(save, id);
    return (
      <button className="tile" disabled={!un} onClick={() => startLevel(id)}>
        <div className="m">{un ? '' : '🔒 '}{label}</div><Stars n={stars(save, id)} />
      </button>
    );
  };
  return (
    <>
      <Nav />
      <Player />
      <div className="card review">
        <div>
          <div className="tname">🔁 Foutenreview</div>
          <div className="tdesc">{nm
            ? `${nm} vorm${nm > 1 ? 'en' : ''} die je fout had. Goed beantwoord = van de lijst af.`
            : 'Geen fouten om te herhalen. Bien joué !'}</div>
        </div>
        <button className="btn red" disabled={!nm} onClick={startReview}>Herhaal</button>
      </div>
      <h2>Niveaus</h2>
      <div className="track">
        {TRACK.map(t => (
          <div key={t} className="card trow">
            <div>
              <div className="tname">{TRACK_INFO[t].fr}</div>
              <div className="tdesc">{TRACK_INFO[t].nl} · <i>{TRACK_INFO[t].ex}</i></div>
            </div>
            {tile(`${t}-mc`, 'Kiezen')}
            {tile(`${t}-type`, 'Typen')}
          </div>
        ))}
      </div>
      <p className="hint">Haal ★★ (80%) op <b>Kiezen</b> om <b>Typen</b> én het volgende niveau te ontgrendelen. ★★★ = alles goed.</p>
    </>
  );
}
