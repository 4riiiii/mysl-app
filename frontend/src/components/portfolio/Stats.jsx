import { motion } from "framer-motion";

const STATS = [
  { value: "$0", label: "Forever — Mysl is free" },
  { value: "0", label: "Streaks, points, or shame" },
  { value: "24/7", label: "Quietly available" },
];

export default function Stats() {
  return (
    <section className="bg-bg py-16 md:py-24" data-testid="stats">
      <div className="mx-auto max-w-[1200px] px-6 md:px-10 lg:px-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-6">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.9, delay: i * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex flex-col items-start gap-2 border-t border-stroke pt-6 md:gap-3 md:pt-8"
              data-testid={`stat-${i}`}
            >
              <span className="font-display text-6xl italic text-text-primary md:text-7xl lg:text-8xl">
                {s.value}
              </span>
              <span className="text-xs uppercase tracking-[0.2em] text-muted md:text-sm">
                {s.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
