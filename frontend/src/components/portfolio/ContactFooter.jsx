import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import Hls from "hls.js";

const HLS_URL = "https://stream.mux.com/Aa02T7oM1wH5Mk5EEVDYhbZ1ChcdhRsS2m1NYyx4Ua1g.m3u8";
const SOCIALS = ["Twitter", "LinkedIn", "Substack", "GitHub"];

export default function ContactFooter() {
  const videoRef = useRef(null);
  const marqueeRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let hls;
    if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: true });
      hls.loadSource(HLS_URL);
      hls.attachMedia(video);
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = HLS_URL;
    }
    return () => { try { hls?.destroy(); } catch { /* noop */ } };
  }, []);

  useEffect(() => {
    if (!marqueeRef.current) return;
    const ctx = gsap.context(() => {
      gsap.to(marqueeRef.current, {
        xPercent: -50,
        duration: 40,
        ease: "none",
        repeat: -1,
      });
    });
    return () => ctx.revert();
  }, []);

  const marqueeWord = "BUILDING SOMETHING QUIETER ";

  return (
    <footer className="relative overflow-hidden bg-bg pb-8 pt-16 md:pb-12 md:pt-20" data-testid="contact-footer">
      {/* Background video — flipped */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          className="absolute left-1/2 top-1/2 min-h-full min-w-full -translate-x-1/2 -translate-y-1/2 object-cover"
          style={{ transform: "translate(-50%, -50%) scaleY(-1)" }}
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-bg to-transparent" />
      </div>

      {/* Marquee */}
      <div className="relative z-10 overflow-hidden border-y border-stroke/60 py-6">
        <div ref={marqueeRef} className="flex whitespace-nowrap font-display text-3xl italic text-text-primary/80 md:text-5xl">
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className="px-6">
              {marqueeWord}<span className="text-text-primary/30">•</span>
            </span>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="relative z-10 mx-auto mt-20 max-w-[1200px] px-6 md:px-10 lg:px-16">
        <p className="mb-4 text-xs uppercase tracking-[0.3em] text-muted">Reach out</p>
        <h2 className="max-w-3xl text-4xl text-text-primary md:text-6xl lg:text-7xl leading-[1.05]">
          Want to <span className="font-display italic">sit with us?</span>
        </h2>
        <a
          href="mailto:hello@mysl.app"
          className="group relative mt-10 inline-flex rounded-full p-[2px]"
          data-testid="contact-cta"
        >
          <span className="absolute inset-0 rounded-full opacity-0 transition-opacity group-hover:opacity-100 accent-gradient-anim" />
          <span className="relative inline-flex items-center gap-2 rounded-full bg-text-primary px-7 py-3.5 text-sm text-bg transition-colors group-hover:bg-bg group-hover:text-text-primary">
            hello@mysl.app ↗
          </span>
        </a>
      </div>

      {/* Footer bar */}
      <div className="relative z-10 mx-auto mt-24 flex max-w-[1200px] flex-col gap-6 px-6 md:px-10 lg:px-16 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted md:text-sm">
          {SOCIALS.map((s) => (
            <a
              key={s}
              href="#"
              onClick={(e) => e.preventDefault()}
              className="transition-colors hover:text-text-primary"
              data-testid={`social-${s.toLowerCase()}`}
            >
              {s}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted md:text-sm" data-testid="availability">
          <span className="relative inline-flex h-2 w-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          Available, quietly
        </div>
      </div>

      <p className="relative z-10 mt-10 px-6 text-center text-[11px] text-muted/60">
        © {new Date().getFullYear()} mysl
      </p>
    </footer>
  );
}
