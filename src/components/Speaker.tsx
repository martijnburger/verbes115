import { useSpeech } from '../speech/speech';

/** Clickable 🔊 that reads a French text aloud. Works inside buttons too: the click doesn't reach the button. */
export function Speaker({ text }: { text: string }) {
  const { supported, say } = useSpeech();
  if (!supported) return null;
  return (
    <span className="spk" role="button" title="Luister naar de uitspraak"
      onClick={e => { e.stopPropagation(); say(text); }}>🔊</span>
  );
}

/** Text, followed by a speaker when it is French */
export const FrText = ({ text, fr }: { text: string; fr: boolean }) => <>{text}{fr && <Speaker text={text} />}</>;
