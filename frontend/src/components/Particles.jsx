import { useState } from "react";

function makeSeeds(count) {
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 1 + Math.random() * 3,
    delay: Math.random() * 8,
    duration: 14 + Math.random() * 18,
    hue: Math.random() > 0.5 ? "260" : "290",
  }));
}

/**
 * Soft floating particles for the background — drifts slowly.
 */
export default function Particles({ count = 28 }) {
  const [seeds] = useState(() => makeSeeds(count));

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      {seeds.map((s) => (
        <span
          key={s.id}
          className="particle"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size * 2}px`,
            height: `${s.size * 2}px`,
            background: `radial-gradient(circle, oklch(0.7 0.15 ${s.hue} / 0.5), transparent 70%)`,
            animation: `drift ${s.duration}s ease-in-out ${s.delay}s infinite alternate`,
            opacity: 0.5,
          }}
        />
      ))}
      <style>{`
        @keyframes drift {
          0% { transform: translate(0, 0); }
          50% { transform: translate(20px, -30px); }
          100% { transform: translate(-15px, 20px); }
        }
      `}</style>
    </div>
  );
}
