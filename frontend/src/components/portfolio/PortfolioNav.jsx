import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const LINKS = [
  { label: "Home", to: "/" },
  { label: "App", to: "/login" },
  { label: "Sessions", to: "/login" },
];

export default function PortfolioNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className="fixed left-0 right-0 top-0 z-50 flex justify-center px-4 pt-4 md:pt-6"
      data-testid="portfolio-nav"
    >
      <div
        className={`inline-flex items-center rounded-full border border-white/10 bg-surface px-2 py-2 backdrop-blur-md transition-shadow ${
          scrolled ? "shadow-md shadow-black/30" : ""
        }`}
      >
        {/* Logo */}
        <Link
          to="/"
          className="group relative mr-1 inline-flex h-9 w-9 items-center justify-center rounded-full p-[1.5px] transition-transform hover:scale-110"
          data-testid="portfolio-logo"
          aria-label="mysl home"
        >
          <span className="absolute inset-0 rounded-full accent-gradient-anim" />
          <span className="relative flex h-full w-full items-center justify-center rounded-full bg-bg font-display italic text-[13px] text-text-primary">
            ms
          </span>
        </Link>

        <span className="mx-1 hidden h-5 w-px bg-stroke sm:block" />

        {/* Nav links */}
        {LINKS.map((l) => (
          <Link
            key={l.label}
            to={l.to}
            className="rounded-full px-3 py-1.5 text-xs text-muted transition hover:bg-stroke/50 hover:text-text-primary sm:px-4 sm:py-2 sm:text-sm"
            data-testid={`portfolio-nav-${l.label.toLowerCase()}`}
          >
            {l.label}
          </Link>
        ))}

        <span className="mx-1 hidden h-5 w-px bg-stroke sm:block" />

        {/* Say hi button — with animated gradient border on hover */}
        <Link
          to="/login"
          className="group relative ml-1 rounded-full p-[1.5px]"
          data-testid="portfolio-say-hi"
        >
          <span className="absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 accent-gradient-anim group-hover:opacity-100" />
          <span className="relative inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-xs text-text-primary backdrop-blur-md sm:px-4 sm:py-2 sm:text-sm">
            Say hi <span className="text-text-primary/70">↗</span>
          </span>
        </Link>
      </div>
    </nav>
  );
}
