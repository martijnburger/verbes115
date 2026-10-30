import { useEffect, useRef, useState } from 'react';
import { GameProvider, useGame } from './game/context';
import { SpeechProvider } from './speech/speech';
import { Badges } from './views/Badges';
import { Home } from './views/Home';
import { Quiz } from './views/Quiz';
import { Results } from './views/Results';
import { Settings } from './views/Settings';
import { Verbs, type VerbSort } from './views/Verbs';

export default function App() {
  return <GameProvider><Screens /></GameProvider>;
}

function Screens() {
  const { view, save } = useGame();
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState<VerbSort>('freq');
  useCountView(view);
  return (
    <SpeechProvider voiceName={save.settings.voice} rate={save.settings.rate}>
      {view === 'quiz' ? <Quiz />
        : view === 'results' ? <Results />
        : view === 'verbs' ? <Verbs filter={filter} setFilter={setFilter} sort={sort} setSort={setSort} />
        : view === 'badges' ? <Badges />
        : view === 'settings' ? <Settings />
        : <Home />}
    </SpeechProvider>
  );
}

declare global {
  interface Window { goatcounter?: { count: (vars: { path: string; title?: string }) => void } }
}

/** Counts each screen change as a page view in GoatCounter; the first screen is already counted by the script itself */
function useCountView(view: string) {
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    window.goatcounter?.count({ path: '/' + view, title: view });
  }, [view]);
}
