import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const WORDS = ["Listen", "Settle", "Begin"];

export default function LoadingScreen({ onComplete }) {
  const [count, setCount] = useState(0);
  const [wordIdx, setWordIdx] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 2700;
    let raf;
    const tick = (now) => {
      const elapsed = now - start;
      const next = Math.min(100, Math.floor((elapsed / duration) * 100));
      setCount(next);
      if (next < 100) {
        raf = requestAnimationFrame(tick);
      } else {
        setTimeout(() => onComplete && onComplete(), 400);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onComplete]);

  useEffect(() => {
    const t = setInterval(() => setWordIdx((i) => (i + 1) % WORDS.length), 900);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-bg portfolio-page" data-testid="loading-screen">
      {/* Top-left label */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="absolute left-6 top-6 md:left-10 md:top-10"
      >
        <span className="text-xs uppercase tracking-[0.3em] text-muted">Mysl</span>
      </motion.div>

      {/* Center rotating word */}
      <div className="flex h-full items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.h2
            key={WORDS[wordIdx]}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="font-display italic text-4xl md:text-6xl lg:text-7xl text-text-primary/80"
          >
            {WORDS[wordIdx]}
          </motion.h2>
        </AnimatePresence>
      </div>

      {/* Bottom-right counter */}
      <div className="absolute bottom-10 right-6 md:bottom-14 md:right-10">
        <span className="font-display text-6xl md:text-8xl lg:text-9xl tabular-nums text-text-primary">
          {String(count).padStart(3, "0")}
        </span>
      </div>

      {/* Bottom progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-stroke/50">
        <div
          className="h-full accent-gradient origin-left"
          style={{
            transform: `scaleX(${count / 100})`,
            boxShadow: "0 0 8px rgba(137, 170, 204, 0.35)",
            transition: "transform 0.1s linear",
          }}
        />
      </div>
    </div>
  );
}
