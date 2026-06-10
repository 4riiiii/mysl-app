import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const ENTRIES = [
  {
    title: "Productivity apps were never built for ADHD brains",
    read: "3 min read",
    date: "Feb 2026",
    grad: "linear-gradient(135deg, #2a1f3a, #4a2a5c)",
  },
  {
    title: "Why body doubling works (and shame doesn't)",
    read: "4 min read",
    date: "Feb 2026",
    grad: "linear-gradient(135deg, #1f2a3a, #2c4a5f)",
  },
  {
    title: "The four-hour rule: how Mysl recovers from lost time",
    read: "5 min read",
    date: "Jan 2026",
    grad: "linear-gradient(135deg, #3a1f2a, #5c2a4a)",
  },
  {
    title: "Lowercase as care: writing AI that doesn't shout",
    read: "2 min read",
    date: "Jan 2026",
    grad: "linear-gradient(135deg, #1a2e2a, #2a4a3c)",
  },
];

const fade = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.25, 0.1, 0.25, 1] } },
};

export default function Journal() {
  return (
    <section className="bg-bg py-16 md:py-24" data-testid="journal">
      <div className="mx-auto max-w-[1200px] px-6 md:px-10 lg:px-16">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={fade}
          className="mb-10 flex flex-col gap-6 md:mb-14 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px w-8 bg-stroke" />
              <span className="text-xs uppercase tracking-[0.3em] text-muted">Journal</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl text-text-primary leading-[1.05]">
              Recent <span className="font-display italic">thoughts</span>
            </h2>
            <p className="mt-4 max-w-md text-sm text-muted md:text-base">
              Notes from building a quiet companion for chaotic minds.
            </p>
          </div>
          <button className="group relative hidden rounded-full p-[2px] md:inline-flex" data-testid="view-all-journal">
            <span className="absolute inset-0 rounded-full opacity-0 transition-opacity group-hover:opacity-100 accent-gradient-anim" />
            <span className="relative inline-flex items-center gap-2 rounded-full border border-stroke bg-bg px-5 py-2.5 text-sm text-text-primary transition-colors group-hover:border-transparent">
              View all <ArrowUpRight size={14} />
            </span>
          </button>
        </motion.div>

        <div className="flex flex-col gap-4">
          {ENTRIES.map((e, i) => (
            <motion.a
              key={e.title}
              href="#"
              onClick={(ev) => ev.preventDefault()}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              variants={fade}
              transition={{ delay: i * 0.06 }}
              className="flex items-center gap-6 rounded-[40px] border border-stroke bg-surface/30 p-4 transition-colors hover:bg-surface sm:rounded-full"
              data-testid={`journal-entry-${i}`}
            >
              <div
                className="h-16 w-16 shrink-0 rounded-full sm:h-20 sm:w-20"
                style={{ background: e.grad }}
              />
              <div className="flex-1">
                <p className="font-display text-xl italic text-text-primary sm:text-2xl">{e.title}</p>
                <p className="mt-1 text-xs text-muted">
                  {e.read} <span className="mx-2">·</span> {e.date}
                </p>
              </div>
              <ArrowUpRight size={18} className="text-muted transition-transform group-hover:translate-x-0.5" />
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
