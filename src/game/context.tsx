import { produce, type Draft } from 'immer';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { LevelId } from './levels';
import { makeReview, makeRound, type Game, type Round } from './round';
import { loadSave, persist, type Save } from './save';

export type View = 'home' | 'quiz' | 'results' | 'verbs' | 'badges' | 'settings';

interface GameCtx {
  save: Save;
  round: Round | null;
  /** change save and/or round; the change is saved automatically */
  update: (fn: (g: Draft<Game>) => void) => void;
  view: View;
  go: (v: View) => void;
  startLevel: (id: LevelId) => void;
  startReview: () => void;
  toast: (msg: string) => void;
}
const Ctx = createContext<GameCtx | null>(null);
export function useGame() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useGame outside GameProvider');
  return c;
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [game, setGame] = useState<Game>(() => ({ save: loadSave(), round: null }));
  const [view, setView] = useState<View>('home');
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);
  useEffect(() => persist(game.save), [game.save]);

  const update = useCallback((fn: (g: Draft<Game>) => void) => setGame(g => produce(g, fn)), []);
  const go = useCallback((v: View) => { setView(v); window.scrollTo(0, 0); }, []);
  const toast = useCallback((msg: string) => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2200);
  }, []);
  const startLevel = useCallback((id: LevelId) => {
    const round = makeRound(game.save, id);
    setGame(g => ({ ...g, round }));
    setView('quiz');
  }, [game.save]);
  const startReview = useCallback(() => {
    const round = makeReview(game.save);
    if (!round.qs.length) { toast('Geen fouten om te herhalen'); return; }
    setGame(g => ({ ...g, round }));
    setView('quiz');
  }, [game.save, toast]);

  const value = useMemo(() => ({ save: game.save, round: game.round, update, view, go, startLevel, startReview, toast }),
    [game, update, view, go, startLevel, startReview, toast]);
  return (
    <Ctx.Provider value={value}>
      {children}
      {toasts.map(t => <div key={t.id} className="toast">{t.msg}</div>)}
    </Ctx.Provider>
  );
}
