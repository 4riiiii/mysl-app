import { useEffect, useRef } from "react";

/**
 * Shows the recent transcript text — fades older content out.
 */
export default function LiveTranscript({ transcripts = [], companionMessages = [] }) {
  const ref = useRef(null);
  // combine and order by created_at
  const merged = [
    ...transcripts.map((t) => ({ ...t, kind: "you", at: t.created_at })),
    ...companionMessages.map((m) => ({ ...m, kind: m.role === "companion" ? "mysl" : "you", at: m.created_at })),
  ].sort((a, b) => new Date(a.at) - new Date(b.at));

  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" });
  }, [merged.length]);

  if (merged.length === 0) {
    return (
      <div
        className="flex h-full min-h-[160px] items-center justify-center text-center text-sm text-white/35 font-body"
        data-testid="live-transcript-panel-empty"
      >
        when you talk, your words will land here. nothing to do.
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="fade-mask-y max-h-[260px] space-y-3 overflow-y-auto pr-2"
      data-testid="live-transcript-panel"
    >
      {merged.map((m, i) => (
        <div
          key={(m.transcript_id || m.message_id || i) + "-" + m.kind}
          className="font-body text-sm leading-relaxed"
        >
          <span
            className={`mr-2 text-[10px] uppercase tracking-[0.18em] ${
              m.kind === "mysl" ? "text-indigo-300/70" : "text-white/35"
            }`}
          >
            {m.kind}
          </span>
          <span className={m.kind === "mysl" ? "font-display italic text-white/85" : "text-white/70"}>
            {m.text}
          </span>
        </div>
      ))}
    </div>
  );
}
