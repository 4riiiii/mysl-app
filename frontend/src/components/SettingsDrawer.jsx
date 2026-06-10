import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Settings, Volume2, Check, Loader2 } from "lucide-react";
import api from "../lib/api";
import { Voice } from "../lib/voice";
import { useAuth } from "../lib/auth";

const VOICES = [
  { id: "coral",   label: "coral",   blurb: "warm + friendly · default" },
  { id: "nova",    label: "nova",    blurb: "bright + present" },
  { id: "shimmer", label: "shimmer", blurb: "soft + airy" },
  { id: "sage",    label: "sage",    blurb: "calm + grounded" },
];

const PREVIEW_TEXT = "hey, i'm here. take your time.";

export default function SettingsDrawer() {
  const { user, setUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(user?.voice || "coral");
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    if (user?.voice) setSelected(user.voice);
  }, [user?.voice]);

  const pick = async (voiceId) => {
    if (saving) return;
    setSaving(voiceId);
    try {
      await api.patch("/auth/voice", { voice: voiceId });
      setSelected(voiceId);
      if (user) setUser({ ...user, voice: voiceId });
      // Preview the new voice immediately
      Voice.setMuted(false);
      Voice.speak(PREVIEW_TEXT);
    } catch {
      /* noop */
    } finally {
      setSaving(null);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/70 transition hover:border-white/30 hover:text-white"
        title="voice settings"
        data-testid="open-settings"
        aria-label="open settings"
      >
        <Settings size={14} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-md"
            onClick={() => setOpen(false)}
            data-testid="settings-overlay"
          >
            <motion.aside
              initial={{ x: 360, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 360, opacity: 0 }}
              transition={{ type: "spring", stiffness: 240, damping: 28 }}
              className="glass-strong absolute right-0 top-0 h-full w-full max-w-sm overflow-y-auto p-7"
              onClick={(e) => e.stopPropagation()}
              data-testid="settings-drawer"
            >
              <div className="mb-7 flex items-start justify-between">
                <div>
                  <p className="font-body text-[10px] uppercase tracking-[0.3em] text-white/40">settings</p>
                  <h2 className="mt-1 font-display text-2xl font-light text-white">mysl&apos;s voice.</h2>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="text-white/40 hover:text-white"
                  aria-label="close settings"
                  data-testid="close-settings"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="mb-6 font-body text-sm text-white/55 leading-relaxed">
                pick how mysl sounds. tap one and you&apos;ll hear a sample.
              </p>

              <div className="space-y-2.5" data-testid="voice-options">
                {VOICES.map((v) => {
                  const isSelected = selected === v.id;
                  const isSaving = saving === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => pick(v.id)}
                      disabled={!!saving}
                      className={`group flex w-full items-center justify-between rounded-2xl border px-5 py-4 text-left transition ${
                        isSelected
                          ? "border-indigo-300/40 bg-indigo-300/[0.08]"
                          : "border-white/8 bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.05]"
                      }`}
                      data-testid={`voice-${v.id}`}
                    >
                      <div>
                        <p className={`font-display text-xl italic ${isSelected ? "text-white" : "text-white/85"}`}>
                          {v.label}
                        </p>
                        <p className="mt-0.5 font-body text-xs text-white/45">{v.blurb}</p>
                      </div>
                      <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-white/70">
                        {isSaving ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : isSelected ? (
                          <Check size={13} className="text-indigo-200" />
                        ) : (
                          <Volume2 size={12} />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <p className="mt-8 font-body text-[11px] leading-relaxed text-white/35">
                changes apply to every line mysl says from here on. you can mute the voice anytime from the speaker icon.
              </p>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
