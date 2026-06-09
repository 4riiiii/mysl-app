import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Square, Loader2 } from "lucide-react";

/**
 * Voice capture bar — push to talk + auto chunk every N seconds.
 * On stop, calls onChunk(blob) with the recorded webm.
 */
export default function VoiceBar({ onChunk, onStateChange, isProcessing, autoChunkSeconds = 0 }) {
  const [recording, setRecording] = useState(false);
  const [level, setLevel] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const rafRef = useRef(null);
  const analyserRef = useRef(null);
  const audioCtxRef = useRef(null);
  const timerRef = useRef(null);
  const autoChunkRef = useRef(null);

  useEffect(() => () => stopAll(), []);

  useEffect(() => {
    onStateChange && onStateChange(recording ? "listening" : "idle");
  }, [recording, onStateChange]);

  const stopAll = () => {
    try { mediaRecorderRef.current?.state === "recording" && mediaRecorderRef.current.stop(); } catch { /* noop */ }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    cancelAnimationFrame(rafRef.current);
    clearInterval(timerRef.current);
    clearInterval(autoChunkRef.current);
    try { audioCtxRef.current?.close(); } catch { /* noop */ }
  };

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        chunksRef.current = [];
        if (blob.size > 1000) onChunk && onChunk(blob);
      };
      mr.start();
      mediaRecorderRef.current = mr;

      // audio level meter
      const AC = window.AudioContext || window.webkitAudioContext;
      const ctx = new AC();
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      analyserRef.current = analyser;
      const data = new Uint8Array(analyser.frequencyBinCount);
      const loop = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setLevel(Math.min(1, avg / 90));
        rafRef.current = requestAnimationFrame(loop);
      };
      loop();

      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);

      if (autoChunkSeconds > 0) {
        autoChunkRef.current = setInterval(() => {
          if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.requestData();
          }
        }, autoChunkSeconds * 1000);
      }

      setRecording(true);
    } catch (err) {
      alert("microphone access needed to talk to mysl. " + (err?.message || ""));
    }
  };

  const stop = () => {
    stopAll();
    setRecording(false);
    setLevel(0);
    setElapsed(0);
  };

  const bars = 22;

  return (
    <div
      className="glass mx-auto flex w-full max-w-md items-center gap-4 rounded-full px-5 py-3"
      data-testid="voice-capture-bar"
    >
      {!recording ? (
        <button
          onClick={start}
          disabled={isProcessing}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-black transition hover:bg-white/90 disabled:opacity-50"
          data-testid="voice-start-button"
          title="start talking"
        >
          {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Mic size={18} />}
        </button>
      ) : (
        <button
          onClick={stop}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-400 to-indigo-400 text-black transition"
          data-testid="voice-stop-button"
          title="send what you said"
        >
          <Square size={16} fill="currentColor" />
        </button>
      )}

      <div className="flex flex-1 items-center gap-[3px]" data-testid="voice-waveform">
        {Array.from({ length: bars }).map((_, i) => {
          const mid = bars / 2;
          const dist = Math.abs(i - mid) / mid;
          // pseudo-random per-bar derived from level for liveliness without impure render
          const jitter = (Math.sin(i * 12.9898 + level * 78.233) * 43758.5453) % 1;
          const j = ((jitter < 0 ? -jitter : jitter) - 0.5) * 12;
          const h = recording
            ? 4 + Math.max(2, level * 26 * (1 - dist * 0.6) + j)
            : 4;
          return (
            <span
              key={i}
              style={{ height: `${h}px` }}
              className={`w-[2px] rounded-full transition-all duration-100 ${
                recording ? "bg-white/80" : "bg-white/20"
              }`}
            />
          );
        })}
      </div>

      <span className="font-body text-xs tabular-nums text-white/50 min-w-[36px] text-right" data-testid="voice-elapsed">
        {String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")}
      </span>
    </div>
  );
}
