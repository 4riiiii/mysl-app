import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { X } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const ITEMS = [
  { id: 1, grad: "linear-gradient(135deg, #1a2e4a, #3a5680)", rot: -2 },
  { id: 2, grad: "linear-gradient(135deg, #3a1f4a, #6a3a80)", rot: 1.5 },
  { id: 3, grad: "linear-gradient(135deg, #1a3a3a, #2a5a5a)", rot: -1 },
  { id: 4, grad: "linear-gradient(135deg, #4a2a1f, #80523a)", rot: 2 },
  { id: 5, grad: "linear-gradient(135deg, #2a2a3a, #4a4a6a)", rot: -1.5 },
  { id: 6, grad: "linear-gradient(135deg, #3a1a2a, #6a3a4a)", rot: 1 },
];

export default function Explorations() {
  const sectionRef = useRef(null);
  const contentRef = useRef(null);
  const colLeftRef = useRef(null);
  const colRightRef = useRef(null);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // pin center content
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "bottom bottom",
        pin: contentRef.current,
        pinSpacing: false,
      });

      // parallax columns
      gsap.fromTo(
        colLeftRef.current,
        { y: 0 },
        {
          y: -260,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
          },
        }
      );
      gsap.fromTo(
        colRightRef.current,
        { y: 260 },
        {
          y: 0,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
          },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const leftItems = ITEMS.slice(0, 3);
  const rightItems = ITEMS.slice(3);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[300vh] bg-bg"
      data-testid="explorations"
    >
      {/* Pinned center text */}
      <div
        ref={contentRef}
        className="absolute left-0 right-0 top-0 z-10 flex h-screen items-center justify-center px-6 text-center"
      >
        <div className="max-w-2xl">
          <div className="mb-4 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-stroke" />
            <span className="text-xs uppercase tracking-[0.3em] text-muted">Explorations</span>
            <span className="h-px w-8 bg-stroke" />
          </div>
          <h2 className="text-4xl md:text-6xl lg:text-7xl text-text-primary leading-[1.05]">
            Visual <span className="font-display italic">playground</span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-sm text-muted md:text-base">
            Moodboards, micro-interactions, and the moments where Mysl&apos;s aesthetic comes alive.
          </p>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="group relative mt-8 inline-flex rounded-full p-[2px]"
            data-testid="dribbble-link"
          >
            <span className="absolute inset-0 rounded-full opacity-0 transition-opacity group-hover:opacity-100 accent-gradient-anim" />
            <span className="relative inline-flex items-center gap-2 rounded-full border border-stroke bg-bg px-5 py-2.5 text-sm text-text-primary transition-colors group-hover:border-transparent">
              See more on Dribbble ↗
            </span>
          </a>
        </div>
      </div>

      {/* Parallax columns */}
      <div className="absolute inset-x-0 top-0 z-20 flex h-full justify-center px-6 pt-[15vh]">
        <div className="grid w-full max-w-[1400px] grid-cols-2 gap-12 md:gap-40">
          <div ref={colLeftRef} className="flex flex-col items-end gap-12 md:gap-24">
            {leftItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setLightbox(item)}
                className="block aspect-square w-full max-w-[320px] overflow-hidden rounded-3xl border border-stroke transition-transform hover:scale-[1.02]"
                style={{ background: item.grad, transform: `rotate(${item.rot}deg)` }}
                data-testid={`exploration-${item.id}`}
                aria-label={`Exploration ${item.id}`}
              >
                <span className="block h-full w-full opacity-20 mix-blend-multiply halftone-overlay" />
              </button>
            ))}
          </div>
          <div ref={colRightRef} className="flex flex-col items-start gap-12 pt-[18vh] md:gap-24">
            {rightItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setLightbox(item)}
                className="block aspect-square w-full max-w-[320px] overflow-hidden rounded-3xl border border-stroke transition-transform hover:scale-[1.02]"
                style={{ background: item.grad, transform: `rotate(${item.rot}deg)` }}
                data-testid={`exploration-${item.id}`}
                aria-label={`Exploration ${item.id}`}
              >
                <span className="block h-full w-full opacity-20 mix-blend-multiply halftone-overlay" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-6"
          onClick={() => setLightbox(null)}
          data-testid="exploration-lightbox"
        >
          <button
            className="absolute right-6 top-6 text-text-primary/70 hover:text-text-primary"
            onClick={() => setLightbox(null)}
            aria-label="close"
          >
            <X size={22} />
          </button>
          <div
            className="aspect-square w-full max-w-[600px] overflow-hidden rounded-3xl border border-stroke"
            style={{ background: lightbox.grad }}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="block h-full w-full opacity-15 mix-blend-multiply halftone-overlay" />
          </div>
        </div>
      )}
    </section>
  );
}
