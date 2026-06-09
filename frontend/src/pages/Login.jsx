import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../lib/auth";
import Particles from "../components/Particles";
import Companion from "../components/Companion";
import { Loader2 } from "lucide-react";

export default function Login() {
  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const { setUser } = useAuth();
  const nav = useNavigate();

  const handleGoogle = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/workspace";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const url = mode === "signup" ? "/auth/register" : "/auth/login";
      const body = mode === "signup" ? { email, password, name } : { email, password };
      const { data } = await api.post(url, body);
      if (data?.session_token) localStorage.setItem("mysl_session_token", data.session_token);
      setUser(data.user);
      nav("/workspace");
    } catch (e) {
      setErr(e?.response?.data?.detail || "something went wrong. try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grain relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <Particles count={24} />
      <Link to="/" className="absolute left-6 top-6 z-20 font-display text-lg text-white" data-testid="brand-link">mysl</Link>
      <div className="relative z-10 w-full max-w-md" data-testid="auth-page-container">
        <div className="mb-8 flex flex-col items-center text-center">
          <Companion state="idle" size={110} />
          <h1 className="mt-7 font-display text-3xl font-light text-white">
            {mode === "signup" ? "let's begin." : "welcome back."}
          </h1>
          <p className="mt-2 font-body text-sm text-white/55">
            {mode === "signup" ? "no productivity. no pressure. just presence." : "i'm here whenever you're ready."}
          </p>
        </div>

        <button
          onClick={handleGoogle}
          className="glass w-full rounded-2xl px-5 py-3.5 font-body text-sm text-white/90 transition hover:bg-white/[0.08] flex items-center justify-center gap-3"
          data-testid="google-login-button"
        >
          <GoogleIcon /> continue with google
        </button>

        <div className="my-6 flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-white/30">
          <span className="h-px flex-1 bg-white/10" /> or <span className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={submit} className="space-y-3" data-testid="auth-form">
          {mode === "signup" && (
            <input
              type="text"
              placeholder="your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3.5 font-body text-sm text-white placeholder-white/30 outline-none transition focus:border-white/30 focus:bg-white/[0.05]"
              data-testid="auth-name-input"
            />
          )}
          <input
            type="email"
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3.5 font-body text-sm text-white placeholder-white/30 outline-none transition focus:border-white/30 focus:bg-white/[0.05]"
            data-testid="auth-email-input"
          />
          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3.5 font-body text-sm text-white placeholder-white/30 outline-none transition focus:border-white/30 focus:bg-white/[0.05]"
            data-testid="auth-password-input"
          />
          {err && <p className="font-body text-xs text-rose-300/80" data-testid="auth-error">{err}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-2xl bg-white py-3.5 font-body text-sm font-medium text-black transition hover:bg-white/90 disabled:opacity-50 flex items-center justify-center gap-2"
            data-testid="auth-submit-button"
          >
            {busy && <Loader2 size={14} className="animate-spin" />}
            {mode === "signup" ? "create my space" : "sign in"}
          </button>
        </form>

        <p className="mt-6 text-center font-body text-xs text-white/40">
          {mode === "signup" ? "already here? " : "first time? "}
          <button
            onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setErr(""); }}
            className="text-white/80 underline-offset-4 hover:underline"
            data-testid="auth-mode-toggle"
          >
            {mode === "signup" ? "sign in" : "make an account"}
          </button>
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
      <path d="M44.5 20H24v8.5h11.8C34.7 33.4 30 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l6-6C34.6 5.5 29.6 3.5 24 3.5 12.7 3.5 3.5 12.7 3.5 24S12.7 44.5 24 44.5c11 0 20-8 20-20 0-1.3-.1-2.7-.5-4.5z" fill="#fff"/>
    </svg>
  );
}
