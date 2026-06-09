import { Check, Trash2 } from "lucide-react";

export default function TaskCard({ task, onToggle, onDelete }) {
  const priColor = {
    high: "border-l-fuchsia-400/60",
    medium: "border-l-indigo-400/40",
    low: "border-l-white/15",
  }[task.priority || "medium"];

  return (
    <div
      className={`group relative flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 transition hover:bg-white/[0.06] border-l-2 ${priColor}`}
      data-testid="auto-extracted-task"
    >
      <button
        onClick={() => onToggle(task)}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
          task.completed
            ? "border-emerald-300/60 bg-emerald-300/20 text-emerald-200"
            : "border-white/25 hover:border-white/50"
        }`}
        data-testid={`toggle-task-${task.task_id}`}
        aria-label="toggle task"
      >
        {task.completed && <Check size={12} strokeWidth={3} />}
      </button>
      <p
        className={`flex-1 text-sm font-body leading-relaxed ${
          task.completed ? "text-white/35 line-through decoration-white/25" : "text-white/85"
        }`}
        data-testid={`task-text-${task.task_id}`}
      >
        {task.text}
      </p>
      <button
        onClick={() => onDelete(task)}
        className="opacity-0 transition group-hover:opacity-100 text-white/30 hover:text-white/70"
        data-testid={`delete-task-${task.task_id}`}
        aria-label="delete task"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
