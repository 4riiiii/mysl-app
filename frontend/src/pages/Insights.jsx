import { useEffect, useState } from "react";
import api from "../lib/api";
import Particles from "../components/Particles";
import { Sparkles, Clock, CheckCircle2, StickyNote } from "lucide-react";

export default function Insights() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/insights").then(({ data }) => setData(data)); }, []);

  return (
    <div className="grain relative min-h-screen overflow-hidden pt-20">
      <Particles count={16} />
      <div className="relative z-10 mx-auto max-w-4xl px-6 pb-20" data-testid="insights-page">
        <p className="font-body text-xs uppercase tracking-[0.3em] text-white/40">patterns</p>
        <h1 className="mt-1 font-display text-4xl font-light text-white">what mysl noticed.</h1>
        <p className="mt-2 font-body text-sm text-white/45">just hints, not rules. you&apos;re still the one driving.</p>

        {!data ? (
          <p className="mt-10 text-white/40">…</p>
        ) : (
          <>
            <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
              <Stat icon={Sparkles} label="sessions" value={data.total_sessions} testid="stat-sessions" />
              <Stat icon={Clock} label="minutes sat down" value={data.total_minutes} testid="stat-minutes" />
              <Stat icon={CheckCircle2} label="tasks captured" value={data.total_tasks} testid="stat-tasks" />
              <Stat icon={StickyNote} label="notes captured" value={data.total_notes} testid="stat-notes" />
            </div>

            <div className="glass mt-10 rounded-3xl p-8" data-testid="insight-card">
              <p className="font-body text-[10px] uppercase tracking-[0.3em] text-white/40">what we&apos;ve learned so far</p>
              <p className="mt-4 font-display text-2xl italic text-white/85 leading-relaxed">
                &ldquo;{data.insight_text}&rdquo;
              </p>
              {(data.best_hour || data.best_day) && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {data.best_hour && (
                    <span className="rounded-full border border-indigo-300/30 bg-indigo-300/10 px-3 py-1 text-xs text-indigo-200/90" data-testid="best-hour">
                      best around {data.best_hour}
                    </span>
                  )}
                  {data.best_day && (
                    <span className="rounded-full border border-fuchsia-300/30 bg-fuchsia-300/10 px-3 py-1 text-xs text-fuchsia-200/90" data-testid="best-day">
                      {data.best_day.toLowerCase()}s work
                    </span>
                  )}
                </div>
              )}
            </div>

            {data.recent && data.recent.length > 0 && (
              <div className="mt-8">
                <p className="mb-3 font-body text-[10px] uppercase tracking-[0.3em] text-white/40">recent sessions</p>
                <div className="space-y-2">
                  {data.recent.map((s) => (
                    <div key={s.session_id} className="glass flex items-center justify-between rounded-2xl px-5 py-3 text-sm">
                      <span className="font-display italic text-white/75">{s.intent || s.title}</span>
                      <span className="font-body text-xs text-white/40">
                        {Math.floor((s.duration_seconds || 0) / 60)}m · {s.task_count || 0} tasks
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, testid }) {
  return (
    <div className="glass rounded-3xl p-5" data-testid={testid}>
      <Icon size={16} className="mb-3 text-indigo-300/70" />
      <p className="font-display text-3xl font-light text-white">{value ?? 0}</p>
      <p className="mt-1 font-body text-xs text-white/45">{label}</p>
    </div>
  );
}
