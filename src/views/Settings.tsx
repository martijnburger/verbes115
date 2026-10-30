import type { ReactNode } from 'react';
import { Nav } from '../components/Nav';
import { VERBS } from '../engine/conjugate';
import { useGame } from '../game/context';
import { fresh, type Settings as SettingsT } from '../game/save';
import { isMetro, useSpeech } from '../speech/speech';

export function Settings() {
  const { save, update, go } = useGame();
  const { supported, voices, voice, say } = useSpeech();
  const s = save.settings;
  const set = <K extends keyof SettingsT>(k: K, val: SettingsT[K]) => update(g => { g.save.settings[k] = val; });
  const radio = <K extends 'dir' | 'pool' | 'neg' | 'rate'>(name: K, val: SettingsT[K], label: ReactNode, after?: () => void) => (
    <label><input type="radio" name={name} checked={s[name] === val} onChange={() => { set(name, val); after?.(); }} /> {label}</label>
  );
  const reset = () => {
    if (!confirm('Weet je zeker dat je alle voortgang wilt wissen?')) return;
    update(g => { g.save = { ...fresh(), settings: g.save.settings }; g.round = null; });
    go('home');
  };

  return (
    <>
      <Nav />
      <div className="card set">
        <div>
          <div className="tname">Vertaalrichting</div>
          {radio('dir', 'both', 'Beide richtingen door elkaar')}
          {radio('dir', 'nl2fr', 'Alleen Nederlands → Frans')}
          {radio('dir', 'fr2nl', 'Alleen Frans → Nederlands')}
        </div>
        <div>
          <div className="tname">Welke werkwoorden</div>
          {radio('pool', 25, 'Top 25 (meest gebruikt)')}
          {radio('pool', 50, 'Top 50')}
          {radio('pool', 100, 'Top 100')}
          {radio('pool', 999, `Alle ${VERBS.length} (incl. wederkerende en onpersoonlijke werkwoorden)`)}
        </div>
        <div>
          <div className="tname">Ontkenning (ne … pas / niet)</div>
          {radio('neg', 0, 'Nooit')}
          {radio('neg', 0.3, 'Af en toe (± 1 op 3)')}
          {radio('neg', 0.6, 'Vaak (± 2 op 3)')}
        </div>
        <div>
          <div className="tname">Uitspraak 🔊</div>
          {supported ? (
            <>
              {radio('rate', 0.9, 'Normaal tempo', () => say('Voilà la vitesse.', { rate: 0.9 }))}
              {radio('rate', 0.6, 'Langzaam', () => say('Voilà la vitesse.', { rate: 0.6 }))}
              <div className="row">
                <button className="btn ghost" onClick={() => say("Bonjour ! Je m'appelle Claude et je parle français.")}>🔊 Test de stem</button>
              </div>
              <label>Stem: <select value={s.voice} onChange={e => {
                set('voice', e.target.value);
                say('Bonjour, je vais vous aider à apprendre le français.', { voice: e.target.value });
              }}>
                <option value="">Automatisch (beste Frans-Franse stem)</option>
                {voices.map(v => <option key={v.name} value={v.name}>{v.name} · {isMetro(v) ? 'Frankrijk' : v.lang}</option>)}
              </select></label>
              <div className="hint">
                {!voice ? '⚠️ Geen Franse stem gevonden in deze browser. Installeer er een via Systeeminstellingen › Toegankelijkheid › Gesproken materiaal › Systeemstem › Beheer stemmen (Frans, Frankrijk).'
                  : isMetro(voice) ? <>Nu: <b>{voice.name}</b> (Frans uit Frankrijk). Tip: download in Systeeminstellingen › Toegankelijkheid › Gesproken materiaal een "Verbeterd/Premium" Franse stem (bijv. Audrey of Thomas) voor de natuurlijkste uitspraak.</>
                  : <>⚠️ Nu: <b>{voice.name}</b>, dit is geen Frans-Franse stem.</>}
              </div>
            </>
          ) : <div className="hint">Je browser ondersteunt geen spraak.</div>}
        </div>
        <div>
          <div className="tname">Accenten</div>
          <label><input type="checkbox" checked={s.strict} onChange={e => set('strict', e.target.checked)} /> Streng: een fout accent telt als fout</label>
          <div className="hint">Uit: een antwoord met alleen een accentfout telt als goed, maar geeft de helft van de XP.</div>
        </div>
        <div>
          <div className="tname">Voortgang</div>
          <div className="hint">Je voortgang wordt bewaard in deze browser.</div>
          <div className="row"><button className="btn red" onClick={reset}>Alles wissen</button></div>
        </div>
      </div>
    </>
  );
}
