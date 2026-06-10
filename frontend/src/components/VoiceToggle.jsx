import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Voice } from "../lib/voice";

/**
 * Small mute toggle for Mysl's voice.
 */
export default function VoiceToggle({ className = "" }) {
  const [muted, setMuted] = useState(Voice.isMuted());

  useEffect(() => {
    return Voice.subscribe((e) => {
      if (e.kind === "mute") setMuted(e.muted);
    });
  }, []);

  return (
    <button
      onClick={() => Voice.toggle()}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/70 transition hover:border-white/30 hover:text-white ${className}`}
      title={muted ? "unmute mysl's voice" : "mute mysl's voice"}
      data-testid="voice-toggle"
      aria-label={muted ? "unmute mysl" : "mute mysl"}
    >
      {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
    </button>
  );
}
