import { useEffect, useState } from "react";
import api from "../lib/api";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Notion sync indicator (mock). Top-right pill.
 */
export default function NotionSync({ refreshKey = 0 }) {
  const [status, setStatus] = useState({ connected: false, last_synced_at: null });
  const [pulsing, setPulsing] = useState(false);

  useEffect(() => {
    api.get("/notion/status")
      .then(({ data }) => setStatus(data))
      .catch(() => {});
  }, [refreshKey]);

  useEffect(() => {
    setPulsing(true);
    const t = setTimeout(() => setPulsing(false), 1400);
    return () => clearTimeout(t);
  }, [refreshKey]);

  const label = pulsing
    ? "syncing to notion…"
    : status.last_synced_at
    ? "synced to notion"
    : "notion ready";

  return (
    <div
      className="glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] text-white/70"
      data-testid="notion-sync-indicator"
    >
      <span className="relative inline-flex h-1.5 w-1.5">
        <AnimatePresence>
          {pulsing && (
            <motion.span
              key="ripple"
              className="absolute inset-0 rounded-full bg-emerald-300"
              initial={{ scale: 1, opacity: 0.7 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
          )}
        </AnimatePresence>
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300/80" />
      </span>
      <span className="font-body">{label}</span>
      <span className="text-white/30">·</span>
      <span className="font-display italic text-white/40">mock</span>
    </div>
  );
}
