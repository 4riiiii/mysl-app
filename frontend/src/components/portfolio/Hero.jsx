import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import Hls from "hls.js";

const HLS_URL = "https://stream.mux.com/Aa02T7oM1wH5Mk5EEVDYhbZ1ChcdhRsS2m1NYyx4Ua1g.m3u8";
const ROLES = ["companion", "listener", "witness", "friend"];

export default function Hero() {
  const videoRef = useRef(null);
  const heroRef = useRef(null);
  const [roleIdx, setRoleIdx] = useState(0);

  // Attach HLS source
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

  // Role cycling
  useEffect(() => {
    const t = setInterval(() => setRoleIdx((i) => (i + 1) % ROLES.length), 2000);
    return () => clearInterval(t);
  }, []);

  // GSAP entrance
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(
        ".name-reveal",
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 1.2, delay: 0.1 }
      );
      tl.fromTo(
        ".blur-in",
        { opacity: 0, filter: "blur(10px)", y: 20 },
        { opacity: 1, filter: "blur(0px)", y: 0, duration: 1, stagger: 0.1, delay: 0.3 },
        "<"
      );
    }, heroRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative h-screen w-full overflow-hidden"
      data-testid="hero"
    >
      {/* Background HLS video */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        className="absolute left-1/2 top-1/2 min-h-full min-w-full -translate-x-1/2 -translate-y-1/2 object-cover"
      />
      <div className="absolute inset-0 bg-black/40" />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-bg to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <p className="blur-in mb-8 text-xs uppercase tracking-[0.3em] text-muted" data-testid="hero-eyebrow">
          Collection &apos;26
        </p>

        <h1
          className="name-reveal mb-6 font-display italic text-6xl md:text-8xl lg:text-9xl leading-[0.9] tracking-tight text-text-primary"
          data-testid="hero-name"
        >
          mysl.
        </h1>

        <p className="blur-in mb-4 text-base text-text-primary/85 md:text-lg" data-testid="hero-role-line">
          A&nbsp;
          <span
            key={roleIdx}
            className="inline-block font-display italic text-text-primary animate-role-fade-in"
            data-testid="hero-role-word"
          >
            {ROLES[roleIdx]}
          </span>
          &nbsp;that lives quietly in your day.
        </p>

        <p className="blur-in mb-12 max-w-md text-sm text-muted md:text-base" data-testid="hero-description">
          A body double for chaotic brains. Talk out loud while you work — Mysl listens, pulls out
          your tasks and notes, and never makes you feel bad about losing time.
        </p>

        <div className="blur-in inline-flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/login"
            className="group relative rounded-full p-[2px] transition-transform hover:scale-105"
            data-testid="hero-cta-primary"
          >
            <span className="absolute inset-0 rounded-full opacity-0 transition-opacity group-hover:opacity-100 accent-gradient-anim" />
            <span className="relative inline-flex items-center rounded-full bg-text-primary px-7 py-3.5 text-sm text-bg transition-colors group-hover:bg-bg group-hover:text-text-primary">
              Sit down with Mysl
            </span>
          </Link>
          <Link
            to="/login"
            className="group relative rounded-full p-[2px] transition-transform hover:scale-105"
            data-testid="hero-cta-secondary"
          >
            <span className="absolute inset-0 rounded-full opacity-0 transition-opacity group-hover:opacity-100 accent-gradient-anim" />
            <span className="relative inline-flex items-center rounded-full border-2 border-stroke bg-bg px-7 py-3.5 text-sm text-text-primary transition-colors group-hover:border-transparent">
              Reach out
            </span>
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 flex flex-col items-center gap-3" data-testid="scroll-indicator">
        <span className="text-xs uppercase tracking-[0.2em] text-muted">Scroll</span>
        <div className="relative h-10 w-px overflow-hidden bg-stroke">
          <div className="absolute inset-x-0 h-1/2 accent-gradient animate-scroll-down" />
        </div>
      </div>
    </section>
  );
}
