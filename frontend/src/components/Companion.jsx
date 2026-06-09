import { motion } from "framer-motion";

/**
 * Mysl Companion Orb — a soft, breathing, glowing presence.
 * states: idle | listening | speaking | thinking
 */
export default function Companion({ state = "idle", size = 220 }) {
  const breathing = {
    idle: { scale: [1, 1.04, 1], filter: ["brightness(1)", "brightness(1.06)", "brightness(1)"] },
    listening: { scale: [1, 1.08, 1.02, 1.08, 1], filter: ["brightness(1.1)", "brightness(1.25)", "brightness(1.1)"] },
    speaking: { scale: [1, 1.06, 1, 1.05, 1], filter: ["brightness(1.15)", "brightness(1.35)", "brightness(1.15)"] },
    thinking: { scale: [1, 1.02, 1], filter: ["brightness(0.9)", "brightness(1)", "brightness(0.9)"] },
  };

  const transition = {
    idle: { duration: 5, ease: "easeInOut", repeat: Infinity },
    listening: { duration: 1.6, ease: "easeInOut", repeat: Infinity },
    speaking: { duration: 1.2, ease: "easeInOut", repeat: Infinity },
    thinking: { duration: 2.4, ease: "easeInOut", repeat: Infinity },
  };

  return (
    <div className="relative flex items-center justify-center" data-testid="companion-orb">
      {/* outer halos */}
      {state === "listening" && (
        <>
          <motion.div
            className="absolute rounded-full border border-white/10"
            style={{ width: size * 1.6, height: size * 1.6 }}
            animate={{ scale: [1, 1.3, 1.6], opacity: [0.4, 0.15, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
          />
          <motion.div
            className="absolute rounded-full border border-white/10"
            style={{ width: size * 1.4, height: size * 1.4 }}
            animate={{ scale: [1, 1.3, 1.6], opacity: [0.5, 0.2, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay: 0.8 }}
          />
        </>
      )}

      <motion.div
        className="orb"
        style={{ width: size, height: size }}
        animate={breathing[state]}
        transition={transition[state]}
      >
        {/* tiny eyes - barely visible, just for character */}
        <div className="absolute inset-0 flex items-center justify-center gap-3" style={{ marginTop: "-4%" }}>
          <motion.div
            className="rounded-full bg-white/70"
            style={{ width: size * 0.04, height: size * 0.04 }}
            animate={state === "thinking" ? { scaleY: [1, 0.1, 1] } : { scaleY: [1, 1, 0.1, 1, 1] }}
            transition={{
              duration: state === "thinking" ? 1.5 : 5,
              repeat: Infinity,
              times: state === "thinking" ? [0, 0.5, 1] : [0, 0.45, 0.5, 0.55, 1],
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="rounded-full bg-white/70"
            style={{ width: size * 0.04, height: size * 0.04 }}
            animate={state === "thinking" ? { scaleY: [1, 0.1, 1] } : { scaleY: [1, 1, 0.1, 1, 1] }}
            transition={{
              duration: state === "thinking" ? 1.5 : 5,
              repeat: Infinity,
              times: state === "thinking" ? [0, 0.5, 1] : [0, 0.45, 0.5, 0.55, 1],
              ease: "easeInOut",
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}
