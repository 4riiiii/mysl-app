import { motion } from "framer-motion";
import { X } from "lucide-react";
import Companion from "./Companion";

export default function RecoveryModal({ open, hoursAway, message, onResume, onDismiss }) {
  if (!open) return null;
  const hrs = Math.floor(hoursAway);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-xl px-6"
      data-testid="recovery-mode-modal"
    >
      <button
        className="absolute right-6 top-6 text-white/40 hover:text-white"
        onClick={onDismiss}
        data-testid="recovery-dismiss"
        aria-label="close"
      >
        <X size={20} />
      </button>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex max-w-xl flex-col items-center gap-8 text-center"
      >
        <Companion state="speaking" size={140} />
        <div>
          <p className="mb-3 font-body text-xs uppercase tracking-[0.3em] text-white/40">
            you were away for {hrs}h
          </p>
          <h2 className="font-display text-3xl font-light leading-tight text-white sm:text-4xl" data-testid="recovery-headline">
            welcome back.
          </h2>
          <p className="mt-6 max-w-md font-display text-base italic text-white/70" data-testid="recovery-message">
            {message || "no questions. no catch-up. just sit down — i'll be right here."}
          </p>
        </div>
        <button
          onClick={onResume}
          className="rounded-full bg-gradient-to-br from-amber-100 to-amber-200 px-8 py-3 font-body text-sm font-medium text-black transition hover:from-amber-50 hover:to-amber-100"
          data-testid="recovery-resume-button"
        >
          take a breath, then we begin
        </button>
        <p className="font-body text-[11px] text-white/30">no shame here. ever.</p>
      </motion.div>
    </motion.div>
  );
}
