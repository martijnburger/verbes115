// Pronunciation through the browser's speech synthesis, preferring a metropolitan French (fr-FR) voice.
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

export const TTS = typeof speechSynthesis !== 'undefined';
const langOf = (v: SpeechSynthesisVoice) => (v.lang || '').replace('_', '-').toLowerCase();
export const isMetro = (v: SpeechSynthesisVoice) => langOf(v) === 'fr-fr';

// Good-quality voices first; novelty voices last
function voiceScore(v: SpeechSynthesisVoice) {
  let s = isMetro(v) ? 100 : 0;
  if (/premium/i.test(v.name)) s += 30;
  if (/enhanced|amélioré|siri/i.test(v.name)) s += 20;
  if (/google/i.test(v.name)) s += 25;
  if (/audrey|aurélie|aurelie|thomas|marie|daniel|denise|henri|julie/i.test(v.name)) s += 15;
  if (/jacques/i.test(v.name)) s += 5;
  if (/grandma|grandpa|rocko|shelley|sandy|reed/i.test(v.name)) s -= 50;
  return s;
}
const frenchVoices = () => TTS
  ? speechSynthesis.getVoices().filter(v => langOf(v).startsWith('fr')).sort((a, b) => voiceScore(b) - voiceScore(a))
  : [];

interface Speech {
  supported: boolean;
  /** French voices, best first */
  voices: SpeechSynthesisVoice[];
  /** the voice in use */
  voice: SpeechSynthesisVoice | null;
  /** voice/rate override the settings, for trying out a new setting right away */
  say: (text: string, opts?: { voice?: string; rate?: number }) => void;
}
const SpeechContext = createContext<Speech>({ supported: false, voices: [], voice: null, say: () => {} });
export const useSpeech = () => useContext(SpeechContext);

export function SpeechProvider({ voiceName, rate, children }: { voiceName: string; rate: number; children: ReactNode }) {
  const [voices, setVoices] = useState(frenchVoices);
  useEffect(() => {
    if (!TTS) return;
    // voices often load asynchronously
    const update = () => setVoices(frenchVoices());
    speechSynthesis.addEventListener('voiceschanged', update);
    update();
    return () => speechSynthesis.removeEventListener('voiceschanged', update);
  }, []);
  const choose = useCallback((name: string, list: SpeechSynthesisVoice[]) =>
    (name && list.find(v => v.name === name)) || list[0] || null, []);
  const voice = choose(voiceName, voices);

  const say = useCallback((text: string, opts: { voice?: string; rate?: number } = {}) => {
    if (!TTS) return;
    const v = choose(opts.voice ?? voiceName, voices.length ? voices : frenchVoices());
    speechSynthesis.cancel();
    // "allé(e)s" -> "allés": read the masculine form
    const u = new SpeechSynthesisUtterance(text.replace(/\((e|es)\)/g, ''));
    u.lang = v ? v.lang.replace('_', '-') : 'fr-FR';
    if (v) u.voice = v;
    u.rate = opts.rate ?? rate;
    speechSynthesis.speak(u);
  }, [voiceName, rate, voices, choose]);

  return <SpeechContext.Provider value={{ supported: TTS, voices, voice, say }}>{children}</SpeechContext.Provider>;
}
