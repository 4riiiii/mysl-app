import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import Particles from "../components/Particles";
import { Calendar, CheckCircle2, StickyNote, Clock } from "lucide-react";

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: "short", month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit",
    }).toLowerCase();
  } catch { return iso; }
}

function formatDuration(s) {
  if (!s) return "—";
  const m = Math.floor(s / 60);
  if (m < 1) return `${s}s`;
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60); const mm = m % 60;
  return `${h}h ${mm}m`;
}

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(null); // session_id
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    api.get("/sessions").then(({ data }) => setSessions(data.sessions || [])).finally(() => setLoading(false));
  }, []);

  const openDetail = async (id) => {
    setOpen(id);
    setDetail(null);
    const { data } = await api.get(`/sessions/${id}`);
    setDetail(data);
  };

  return (
    <div className="grain relative min-h-screen overflow-hidden pt-20">
      <Particles count={18} />
      <div className="relative z-10 mx-auto max-w-5xl px-6 pb-20" data-testid="sessions-page">
        <p className="font-body text-xs uppercase tracking-[0.3em] text-white/40">history</p>
        <h1 className="mt-1 font-display text-4xl font-light text-white">your sessions.</h1>
        <p className="mt-2 font-body text-sm text-white/45">every time you sat down. no judgment of what came of it.</p>

        <div className="mt-10 grid gap-3 md:grid-cols-2">
          {loading && <p className="text-white/40">…</p>}
          {!loading && sessions.length === 0 && (
            <div className="glass col-span-2 rounded-3xl p-10 text-center">
              <p className="font-display text-xl italic text-white/70">nothing yet.</p>
              <p className="mt-2 font-body text-sm text-white/40">when you sit down with mysl, it&apos;ll show up here.</p>
              <Link to="/workspace" className="mt-6 inline-block rounded-full bg-white px-5 py-2 font-body text-xs font-medium text-black hover:bg-white/90" data-testid="empty-go-workspace">
                start one now
              </Link>
            </div>
          )}
          {sessions.map((s) => (
            <button
              key={s.session_id}
              onClick={() => openDetail(s.session_id)}
              className="glass group rounded-3xl p-6 text-left transition hover:bg-white/[0.07]"
              data-testid={`session-card-${s.session_id}`}
            >
              <div className="mb-3 flex items-center gap-2 font-body text-[11px] text-white/40">
                <Calendar size={12} /> {formatDate(s.started_at)}
              </div>
              <p className="font-display text-lg italic text-white/85">{s.intent || s.title || "just to sit"}</p>
              <div className="mt-5 flex items-center gap-4 font-body text-xs text-white/50">
                <span className="flex items-center gap-1.5" data-testid={`session-duration-${s.session_id}`}>
                  <Clock size={12} /> {formatDuration(s.duration_seconds)}
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={12} /> {s.task_count || 0}
                </span>
                <span className="flex items-center gap-1.5">
                  <StickyNote size={12} /> {s.note_count || 0}
                </span>
                {!s.ended_at && (
                  <span className="ml-auto font-display italic text-emerald-300/80">still open</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-lg px-6" onClick={() => setOpen(null)}>
          <div className="glass-strong relative max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-3xl p-8" onClick={(e) => e.stopPropagation()} data-testid="session-detail-modal">
            {!detail ? (
              <p className="text-white/50">opening…</p>
            ) : (
              <>
                <p className="font-body text-[11px] uppercase tracking-[0.3em] text-white/40">{formatDate(detail.session.started_at)}</p>
                <h2 className="mt-1 font-display text-2xl italic text-white">{detail.session.intent || detail.session.title}</h2>
                <p className="mt-2 font-body text-xs text-white/40">{formatDuration(detail.session.duration_seconds)} · {detail.tasks.length} tasks · {detail.notes.length} notes</p>

                <div className="mt-6">
                  <p className="mb-2 font-body text-[10px] uppercase tracking-[0.3em] text-white/40">tasks</p>
                  <ul className="space-y-1.5">
                    {detail.tasks.length === 0 && <li className="text-sm text-white/40">none captured</li>}
                    {detail.tasks.map((t) => (
                      <li key={t.task_id} className={`text-sm ${t.completed ? "text-white/40 line-through" : "text-white/80"}`}>· {t.text}</li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6">
                  <p className="mb-2 font-body text-[10px] uppercase tracking-[0.3em] text-white/40">notes</p>
                  <ul className="space-y-1.5">
                    {detail.notes.length === 0 && <li className="text-sm text-white/40">none captured</li>}
                    {detail.notes.map((n) => (
                      <li key={n.note_id} className="text-sm text-white/70">· {n.text}</li>
                    ))}
                  </ul>
                </div>

                {detail.messages.length > 0 && (
                  <div className="mt-6">
                    <p className="mb-2 font-body text-[10px] uppercase tracking-[0.3em] text-white/40">mysl said</p>
                    <ul className="space-y-1.5">
                      {detail.messages.filter(m => m.role === "companion").map((m) => (
                        <li key={m.message_id} className="font-display text-sm italic text-white/70">&ldquo;{m.text}&rdquo;</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
