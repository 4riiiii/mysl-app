import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { LogOut, Sparkles, History, BarChart3 } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  if (loc.pathname === "/" && !user) return <LandingNav />;

  return (
    <nav className="fixed left-0 right-0 top-0 z-40 flex items-center justify-between px-6 py-4 sm:px-10 glass" data-testid="app-nav">
      <Link to={user ? "/workspace" : "/"} className="font-display text-lg tracking-tight text-white" data-testid="brand-link">
        mysl
      </Link>
      {user ? (
        <div className="flex items-center gap-2 text-sm">
          <Link
            to="/workspace"
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition ${
              loc.pathname.startsWith("/workspace") ? "text-white bg-white/8" : "text-white/60 hover:text-white"
            }`}
            data-testid="nav-workspace"
          >
            <Sparkles size={14} /> workspace
          </Link>
          <Link
            to="/sessions"
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition ${
              loc.pathname.startsWith("/sessions") ? "text-white bg-white/8" : "text-white/60 hover:text-white"
            }`}
            data-testid="nav-sessions"
          >
            <History size={14} /> sessions
          </Link>
          <Link
            to="/insights"
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition ${
              loc.pathname.startsWith("/insights") ? "text-white bg-white/8" : "text-white/60 hover:text-white"
            }`}
            data-testid="nav-insights"
          >
            <BarChart3 size={14} /> patterns
          </Link>
          <div className="mx-2 h-5 w-px bg-white/10" />
          <span className="hidden sm:block text-xs text-white/50" data-testid="nav-user-name">
            {user.name}
          </span>
          <button
            onClick={async () => { await logout(); nav("/"); }}
            className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/70 transition hover:border-white/30 hover:text-white"
            data-testid="logout-button"
          >
            <LogOut size={13} /> sign out
          </button>
        </div>
      ) : (
        <Link
          to="/login"
          className="rounded-full border border-white/15 px-4 py-1.5 text-xs text-white/80 transition hover:border-white/40 hover:text-white"
          data-testid="nav-login"
        >
          sign in
        </Link>
      )}
    </nav>
  );
}

function LandingNav() {
  return (
    <nav className="fixed left-0 right-0 top-0 z-40 flex items-center justify-between px-6 py-4 sm:px-10">
      <Link to="/" className="font-display text-lg tracking-tight text-white" data-testid="brand-link">
        mysl
      </Link>
      <Link
        to="/login"
        className="rounded-full border border-white/15 px-4 py-1.5 text-xs text-white/80 transition hover:border-white/40 hover:text-white"
        data-testid="nav-login"
      >
        open the app
      </Link>
    </nav>
  );
}
