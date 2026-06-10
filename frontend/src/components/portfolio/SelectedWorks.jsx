import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

const PROJECTS = [
  {
    title: "Voice that listens",
    sub: "Whisper-powered ambient capture",
    span: "md:col-span-7",
    aspect: "aspect-[16/11]",
    bg: "linear-gradient(135deg, #1a1f3a 0%, #3a4a6f 50%, #2c3e5c 100%)",
    glow: "radial-gradient(ellipse at 30% 40%, rgba(137,170,204,0.35), transparent 60%)",
  },
  {
    title: "Tasks that appear",
    sub: "Claude extracts what you said",
    span: "md:col-span-5",
    aspect: "aspect-[4/3]",
    bg: "linear-gradient(160deg, #2a1a3a 0%, #4a2a5c 100%)",
    glow: "radial-gradient(ellipse at 70% 30%, rgba(180,140,220,0.3), transparent 60%)",
  },
  {
    title: "A friend in the room",
    sub: "Soft companion that breathes",
    span: "md:col-span-5",
    aspect: "aspect-[4/3]",
    bg: "linear-gradient(135deg, #1c1c1c 0%, #2c3e50 50%, #1a2a3a 100%)",
    glow: "radial-gradient(circle at 50% 50%, rgba(137,170,204,0.4), transparent 55%)",
  },
  {
    title: "Patterns that emerge",
    sub: "Learns when you focus best",
    span: "md:col-span-7",
    aspect: "aspect-[16/11]",
    bg: "linear-gradient(140deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)",
    glow: "radial-gradient(ellipse at 20% 80%, rgba(78,133,191,0.3), transparent 65%)",
  },
];

const fade = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 1, ease: [0.25, 0.1, 0.25, 1] } },
};

export default function SelectedWorks() {
  return (
    <section className="bg-bg py-12 md:py-16" data-testid="selected-works">
      <div className="mx-auto max-w-[1200px] px-6 md:px-10 lg:px-16">
        {/* Header */}
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
              <span className="text-xs uppercase tracking-[0.3em] text-muted">Selected Work</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl text-text-primary leading-[1.05]">
              Featured <span className="font-display italic">moments</span>
            </h2>
            <p className="mt-4 max-w-md text-sm text-muted md:text-base">
              The four quiet things Mysl does so your brain finally gets to start.
            </p>
          </div>
          <Link
            to="/login"
            className="group relative hidden rounded-full p-[2px] md:inline-flex"
            data-testid="view-all-work"
          >
            <span className="absolute inset-0 rounded-full opacity-0 transition-opacity group-hover:opacity-100 accent-gradient-anim" />
            <span className="relative inline-flex items-center gap-2 rounded-full border border-stroke bg-bg px-5 py-2.5 text-sm text-text-primary transition-colors group-hover:border-transparent">
              Open the app <ArrowUpRight size={14} />
            </span>
          </Link>
        </motion.div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-12 md:gap-6">
          {PROJECTS.map((p, i) => (
            <motion.div
              key={p.title}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              variants={fade}
              transition={{ delay: i * 0.08 }}
              className={`group relative overflow-hidden rounded-3xl border border-stroke bg-surface ${p.aspect} ${p.span}`}
              data-testid={`work-card-${i}`}
            >
              {/* "image" — soft generated gradient */}
              <div
                className="absolute inset-0 transition-transform duration-700 group-hover:scale-105"
                style={{ background: p.bg }}
              />
              <div className="absolute inset-0" style={{ background: p.glow }} />
              {/* Halftone dot overlay */}
              <div className="absolute inset-0 opacity-20 mix-blend-multiply halftone-overlay" />

              {/* Hover overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-bg/70 opacity-0 backdrop-blur-lg transition-opacity duration-500 group-hover:opacity-100">
                <div className="relative rounded-full p-[2px]">
                  <span className="absolute inset-0 rounded-full accent-gradient-anim" />
                  <span className="relative inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm text-bg">
                    View — <span className="font-display italic">{p.title}</span>
                  </span>
                </div>
              </div>

              {/* Always-visible label (bottom-left) */}
              <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
                <div>
                  <p className="font-display text-2xl italic text-text-primary md:text-3xl">{p.title}</p>
                  <p className="mt-1 text-xs text-text-primary/60 md:text-sm">{p.sub}</p>
                </div>
                <span className="text-xs text-text-primary/40">0{i + 1}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
