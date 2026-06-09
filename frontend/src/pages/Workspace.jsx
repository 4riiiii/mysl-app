import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../lib/auth";
import Companion from "../components/Companion";
import VoiceBar from "../components/VoiceBar";
import LiveTranscript from "../components/LiveTranscript";
import TaskCard from "../components/TaskCard";
import NotionSync from "../components/NotionSync";
import RecoveryModal from "../components/RecoveryModal";
import Particles from "../components/Particles";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Play, Square, StickyNote, Plus, Trash2 } from "lucide-react";

export default function Workspace() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [session, setSession] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [ts, setTs] = useState([]);
  const [msgs, setMsgs] = useState([]);
  const [companionState, setCompanionState] = useState("idle");
  const [processing, setProcessing] = useState(false);
  const [intent, setIntent] = useState("");
  const [starting, setStarting] = useState(false);
  const [syncKey, setSyncKey] = useState(0);
  const [recovery, setRecovery] = useState(null);
  const [chatInput, setChatInput] = useState("");

  useEffect(() => {
    if (!user) return;
    // Check recovery on mount
    api.get("/recovery/check").then(({ data }) => {
      if (data?.should_recover) setRecovery(data);
    }).catch(() => { /* noop */ });
  }, [user]);

  const startSession = async () => {
    setStarting(true);
    try {
      const { data } = await api.post("/sessions/start", { intent: intent.trim() || null });
      setSession(data.session);
      setTasks([]); setNotes([]); setTs([]);
      setMsgs(data.companion_message ? [data.companion_message] : []);
      setCompanionState("speaking");
      setTimeout(() => setCompanionState("idle"), 2200);
    } finally {
      setStarting(false);
    }
  };

  const endSession = async () => {
    if (!session) return;
    setProcessing(true);
    try {
      const { data } = await api.post(`/sessions/${session.session_id}/end`, { mood_after: null });
      setSession({ ...data.session });
      setMsgs((prev) => [...prev, { message_id: "summary", role: "companion", text: data.summary, created_at: new Date().toISOString() }]);
      setSyncKey((k) => k + 1);
    } finally {
      setProcessing(false);
    }
  };

  const handleChunk = useCallback(async (blob) => {
    if (!session) return;
    setProcessing(true);
    setCompanionState("thinking");
    try {
      const form = new FormData();
      form.append("session_id", session.session_id);
      form.append("audio", blob, "chunk.webm");
      const { data } = await api.post("/voice/transcribe", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (data.transcript && data.transcript.text) setTs((prev) => [...prev, data.transcript]);
      if (data.tasks?.length) setTasks((prev) => [...data.tasks, ...prev]);
      if (data.notes?.length) setNotes((prev) => [...data.notes, ...prev]);
      if (data.companion_message) setMsgs((prev) => [...prev, data.companion_message]);
      setCompanionState("speaking");
      setSyncKey((k) => k + 1);
      setTimeout(() => setCompanionState("idle"), 1800);
    } catch (e) {
      setCompanionState("idle");
    } finally {
      setProcessing(false);
    }
  }, [session]);

  const toggleTask = async (task) => {
    const next = !task.completed;
    setTasks((prev) => prev.map((t) => (t.task_id === task.task_id ? { ...t, completed: next } : t)));
    try {
      await api.patch(`/tasks/${task.task_id}`, { completed: next });
    } catch {
      setTasks((prev) => prev.map((t) => (t.task_id === task.task_id ? { ...t, completed: !next } : t)));
    }
  };

  const deleteTask = async (task) => {
    setTasks((prev) => prev.filter((t) => t.task_id !== task.task_id));
    try { await api.delete(`/tasks/${task.task_id}`); } catch { /* noop */ }
  };

  const deleteNote = async (note) => {
    setNotes((prev) => prev.filter((n) => n.note_id !== note.note_id));
    try { await api.delete(`/notes/${note.note_id}`); } catch { /* noop */ }
  };

  const sendChat = async () => {
    const msg = chatInput.trim();
    if (!msg || !session) return;
    setChatInput("");
    setMsgs((prev) => [...prev, { message_id: "u-" + Date.now(), role: "user", text: msg, created_at: new Date().toISOString() }]);
    setCompanionState("thinking");
    try {
      const { data } = await api.post("/companion/chat", { message: msg, session_id: session.session_id });
      setMsgs((prev) => [...prev, data.reply]);
      setCompanionState("speaking");
      setTimeout(() => setCompanionState("idle"), 1800);
    } catch {
      setCompanionState("idle");
    }
  };

  if (!user) return null;
  const sessionActive = session && !session.ended_at;

  return (
    <div className="grain relative min-h-screen overflow-hidden pt-20">
      <Particles count={20} />

      <RecoveryModal
        open={!!recovery}
        hoursAway={recovery?.hours_away || 0}
        message={recovery?.message}
        onResume={() => setRecovery(null)}
        onDismiss={() => setRecovery(null)}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6 pb-20">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="font-body text-xs uppercase tracking-[0.3em] text-white/40">workspace</p>
            <h1 className="mt-1 font-display text-3xl font-light text-white">
              hi {user.name?.split(" ")[0]?.toLowerCase() || "friend"}.
            </h1>
          </div>
          <NotionSync refreshKey={syncKey} />
        </div>

        {!session ? (
          // Pre-session: start screen
          <StartScreen intent={intent} setIntent={setIntent} starting={starting} onStart={startSession} />
        ) : (
          <ActiveWorkspace
            session={session}
            sessionActive={sessionActive}
            companionState={companionState}
            processing={processing}
            ts={ts}
            msgs={msgs}
            tasks={tasks}
            notes={notes}
            chatInput={chatInput}
            setChatInput={setChatInput}
            sendChat={sendChat}
            handleChunk={handleChunk}
            endSession={endSession}
            toggleTask={toggleTask}
            deleteTask={deleteTask}
            deleteNote={deleteNote}
            setCompanionState={setCompanionState}
            onNewSession={() => setSession(null)}
          />
        )}
      </div>
    </div>
  );
}

function StartScreen({ intent, setIntent, starting, onStart }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center pt-10 text-center" data-testid="workspace-start">
      <Companion state="idle" size={200} />
      <h2 className="mt-12 font-display text-4xl font-light leading-tight text-white sm:text-5xl">
        what are we sitting with today?
      </h2>
      <p className="mt-3 font-body text-sm text-white/45">
        (you don&apos;t have to know. you can change your mind.)
      </p>
      <textarea
        value={intent}
        onChange={(e) => setIntent(e.target.value)}
        placeholder="i&apos;d like to finish the proposal… or just stare at the wall for a bit."
        rows={3}
        className="mt-8 w-full max-w-lg resize-none rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 font-body text-sm text-white placeholder-white/30 outline-none transition focus:border-white/25 focus:bg-white/[0.05]"
        data-testid="workspace-intent-input"
      />
      <button
        onClick={onStart}
        disabled={starting}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 font-body text-sm font-medium text-black transition hover:bg-white/90 disabled:opacity-50"
        data-testid="start-session-button"
      >
        {starting ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
        sit down with mysl
      </button>
      <a
        href="/companion"
        className="mt-4 font-body text-xs text-white/40 underline-offset-4 transition hover:text-white/70 hover:underline"
        data-testid="start-screen-companion-link"
      >
        or just hang out — no session
      </a>
    </div>
  );
}

function ActiveWorkspace({
  session, sessionActive, companionState, processing, ts, msgs, tasks, notes,
  chatInput, setChatInput, sendChat, handleChunk, endSession, toggleTask, deleteTask, deleteNote,
  setCompanionState, onNewSession,
}) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr_1fr]" data-testid="workspace-active">
      {/* LEFT — session info + companion log */}
      <aside className="glass rounded-3xl p-6">
        <p className="font-body text-[10px] uppercase tracking-[0.3em] text-white/40">in this session</p>
        <p className="mt-2 font-display text-lg italic text-white/80" data-testid="session-intent-display">
          {session.intent || "just to sit and work."}
        </p>
        <div className="mt-6 flex items-center gap-4 text-xs text-white/50 font-body">
          <span data-testid="session-tasks-count">{tasks.length} tasks</span>
          <span className="h-1 w-1 rounded-full bg-white/20" />
          <span data-testid="session-notes-count">{notes.length} notes</span>
        </div>
        <div className="my-6 h-px bg-white/8" />
        <p className="mb-3 font-body text-[10px] uppercase tracking-[0.3em] text-white/40">what mysl heard</p>
        <LiveTranscript transcripts={ts} companionMessages={msgs} />

        <div className="mt-6">
          <p className="mb-2 font-body text-[10px] uppercase tracking-[0.3em] text-white/40">type to mysl</p>
          <div className="flex items-center gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendChat()}
              placeholder="say anything…"
              className="flex-1 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 font-body text-xs text-white placeholder-white/30 outline-none focus:border-white/30"
              data-testid="companion-chat-input"
            />
            <button
              onClick={sendChat}
              className="rounded-full bg-white/10 px-3 py-2 text-xs text-white hover:bg-white/20"
              data-testid="companion-chat-send"
            >
              send
            </button>
          </div>
        </div>
      </aside>

      {/* CENTER — orb + voice bar */}
      <section className="flex flex-col items-center justify-start gap-10 py-10">
        <Companion state={companionState} size={260} />
        <AnimatePresence>
          {msgs.length > 0 && (
            <motion.p
              key={msgs[msgs.length - 1].message_id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-md text-center font-display text-lg italic text-white/80"
              data-testid="companion-bubble"
            >
              &ldquo;{msgs[msgs.length - 1].text}&rdquo;
            </motion.p>
          )}
        </AnimatePresence>

        {sessionActive ? (
          <VoiceBar onChunk={handleChunk} onStateChange={setCompanionState} isProcessing={processing} />
        ) : (
          <div className="glass rounded-full px-6 py-3 font-body text-sm text-white/60" data-testid="session-ended-message">
            session closed. you can start a new one.
          </div>
        )}

        <div className="flex items-center gap-3">
          {sessionActive ? (
            <button
              onClick={endSession}
              disabled={processing}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2 font-body text-xs text-white/70 transition hover:border-white/40 hover:text-white disabled:opacity-50"
              data-testid="end-session-button"
            >
              {processing ? <Loader2 size={12} className="animate-spin" /> : <Square size={12} />}
              end session
            </button>
          ) : (
            <button
              onClick={onNewSession}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 font-body text-xs text-black"
              data-testid="new-session-button"
            >
              <Plus size={14} /> new session
            </button>
          )}
        </div>
      </section>

      {/* RIGHT — tasks & notes */}
      <aside className="glass rounded-3xl p-6" data-testid="tasks-panel">
        <div className="mb-4 flex items-center justify-between">
          <p className="font-body text-[10px] uppercase tracking-[0.3em] text-white/40">tasks</p>
          <span className="font-display text-xs italic text-white/30">auto-extracted</span>
        </div>
        <div className="space-y-2" data-testid="tasks-list">
          {tasks.length === 0 ? (
            <p className="font-body text-sm text-white/30">just talk. they&apos;ll show up.</p>
          ) : (
            tasks.map((t) => (
              <TaskCard key={t.task_id} task={t} onToggle={toggleTask} onDelete={deleteTask} />
            ))
          )}
        </div>

        <div className="my-6 h-px bg-white/8" />

        <div className="mb-4 flex items-center justify-between">
          <p className="font-body text-[10px] uppercase tracking-[0.3em] text-white/40">notes</p>
          <StickyNote size={13} className="text-white/30" />
        </div>
        <div className="space-y-2" data-testid="notes-list">
          {notes.length === 0 ? (
            <p className="font-body text-sm text-white/30">thoughts will land here too.</p>
          ) : (
            notes.map((n) => (
              <div key={n.note_id} className="group rounded-2xl border border-white/8 bg-white/[0.025] px-4 py-3" data-testid="auto-extracted-note">
                <p className="font-body text-sm leading-relaxed text-white/75">{n.text}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-body text-[10px] uppercase tracking-wider text-white/30">{n.tag || "thought"}</span>
                  <button
                    onClick={() => deleteNote(n)}
                    className="opacity-0 transition group-hover:opacity-100 text-white/30 hover:text-white/70"
                    data-testid={`delete-note-${n.note_id}`}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
