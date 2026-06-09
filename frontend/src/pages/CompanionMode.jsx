import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Send } from "lucide-react";
import Companion from "../components/Companion";
import Particles from "../components/Particles";
import api from "../lib/api";
import { useAuth } from "../lib/auth";

// Ambient lines that quietly cycle on screen when mysl is just hanging out.
const AMBIENT = [
  "i'm just here.",
  "no pressure.",
  "you don't have to do anything.",
  "we can just sit.",
  "the room is quiet.",
  "take a breath if you want.",
  "thinking counts.",
  "staring at the wall is fine.",
  "i'll wait.",
  "no agenda.",
];

export default function CompanionMode() {
  const { user } = useAuth();
  const [ambient, setAmbient] = useState(0);
  const [orbState, setOrbState] = useState("idle");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [recent, setRecent] = useState([]);
  const logRef = useRef(null);
  const sendingRef = useRef(false);
  sendingRef.current = sending;

  // cycle ambient lines slowly
  useEffect(() => {
    const t = setInterval(() => {
      setAmbient((a) => (a + 1) % AMBIENT.length);
    }, 7000);
    return () => clearInterval(t);
  }, []);

  // idle mood drift — every 45–90s, the orb subtly shifts mood for a few seconds, then returns to idle.
  // Skips drift while user is chatting so it never fights the conversation animation.
  useEffect(() => {
    let scheduleId;
    let returnId;
    const MOODS = ["thinking", "listening", "speaking"];
    const HOLD_MS = { thinking: 3200, listening: 2400, speaking: 1800 };

    const scheduleNext = () => {
      const delay = 45000 + Math.random() * 45000; // 45–90s
      scheduleId = setTimeout(() => {
        if (!sendingRef.current) {
          const mood = MOODS[Math.floor(Math.random() * MOODS.length)];
          setOrbState(mood);
          // also nudge the ambient line so it feels intentional
          setAmbient((a) => (a + 1) % AMBIENT.length);
          returnId = setTimeout(() => {
            if (!sendingRef.current) setOrbState("idle");
            scheduleNext();
          }, HOLD_MS[mood]);
        } else {
          scheduleNext();
        }
      }, delay);
    };

    scheduleNext();
    return () => {
      clearTimeout(scheduleId);
      clearTimeout(returnId);
    };
  }, []);

  // fetch recent sessions for the small "we've sat with" strip
  useEffect(() => {
    if (!user) return;
    api.get("/sessions").then(({ data }) => {
      setRecent((data.sessions || []).slice(0, 4));
    }).catch(() => { /* noop */ });
  }, [user]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    setMessages((m) => [...m, { id: "u-" + Date.now(), role: "user", text }]);
    setOrbState("thinking");
    try {
      const { data } = await api.post("/companion/chat", { message: text });
      setMessages((m) => [...m, { id: data.reply.message_id, role: "companion", text: data.reply.text }]);
      setOrbState("speaking");
      setTimeout(() => setOrbState("idle"), 2200);
    } catch {
      setOrbState("idle");
    } finally {
      setSending(false);
    }
  };

  if (!user) return null;

  return (
    <div className="grain relative min-h-screen overflow-hidden pt-20" data-testid="companion-mode-page">
      <Particles count={22} />

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 pb-16">
        <p className="font-body text-[11px] uppercase tracking-[0.3em] text-white/40">companion mode</p>
        <h1 className="mt-2 font-display text-3xl font-light text-white sm:text-4xl">
          hi {user.name?.split(" ")[0]?.toLowerCase() || "friend"}.
        </h1>
        <p className="mt-2 max-w-md text-center font-body text-sm text-white/45">
          not working right now. just sitting with you.
        </p>

        {/* Big orb area */}
        <div className="relative my-12 flex flex-col items-center" data-testid="companion-mode-orb-wrap">
          <Companion state={orbState} size={300} />
          <AnimatePresence mode="wait">
            <motion.p
              key={ambient + "-" + orbState}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 1.2 }}
              className="mt-10 font-display text-xl italic text-white/65 sm:text-2xl"
              data-testid="companion-mode-ambient"
            >
              &ldquo;{AMBIENT[ambient]}&rdquo;
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Chat log */}
        {messages.length > 0 && (
          <div
            ref={logRef}
            className="glass mb-4 w-full max-w-lg space-y-3 rounded-3xl px-6 py-5 max-h-[240px] overflow-y-auto fade-mask-y"
            data-testid="companion-mode-log"
          >
            {messages.map((m) => (
              <div key={m.id} className="font-body text-sm leading-relaxed">
                <span
                  className={`mr-2 text-[10px] uppercase tracking-[0.18em] ${
                    m.role === "companion" ? "text-indigo-300/70" : "text-white/35"
                  }`}
                >
                  {m.role === "companion" ? "mysl" : "you"}
                </span>
                <span className={m.role === "companion" ? "font-display italic text-white/85" : "text-white/75"}>
                  {m.text}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Chat input */}
        <div className="flex w-full max-w-lg items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="say anything… or just sit"
            className="flex-1 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 font-body text-sm text-white placeholder-white/30 outline-none transition focus:border-white/25 focus:bg-white/[0.05]"
            data-testid="companion-mode-input"
          />
          <button
            onClick={send}
            disabled={sending || !input.trim()}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black transition hover:bg-white/90 disabled:opacity-40"
            data-testid="companion-mode-send"
            aria-label="send"
          >
            <Send size={16} />
          </button>
        </div>

        {/* Optional: when ready, open a session */}
        <div className="mt-10 flex flex-col items-center gap-2">
          <Link
            to="/workspace"
            className="group inline-flex items-center gap-2 rounded-full border border-white/12 px-5 py-2 font-body text-xs text-white/65 transition hover:border-white/30 hover:text-white"
            data-testid="companion-mode-start-session"
          >
            when you&apos;re ready, we can sit down
            <ArrowRight size={13} className="transition group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Recent intents strip */}
        {recent.length > 0 && (
          <div className="mt-14 w-full max-w-2xl" data-testid="companion-mode-recent">
            <p className="mb-3 text-center font-body text-[10px] uppercase tracking-[0.3em] text-white/30">
              what we&apos;ve sat with lately
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {recent.map((s) => (
                <span
                  key={s.session_id}
                  className="rounded-full border border-white/8 bg-white/[0.025] px-3 py-1.5 font-display text-xs italic text-white/55"
                >
                  {(s.intent || s.title || "just sat").slice(0, 50)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
