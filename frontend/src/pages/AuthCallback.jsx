import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../lib/auth";
import Companion from "../components/Companion";

export default function AuthCallback() {
  const { setUser } = useAuth();
  const nav = useNavigate();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const hash = window.location.hash;
    const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
    const sessionId = params.get("session_id");

    if (!sessionId) {
      nav("/login");
      return;
    }

    (async () => {
      try {
        const { data } = await api.post("/auth/google/session", { session_id: sessionId });
        if (data?.session_token) localStorage.setItem("mysl_session_token", data.session_token);
        setUser(data.user);
        window.history.replaceState({}, "", "/workspace");
        nav("/workspace", { replace: true, state: { user: data.user } });
      } catch (e) {
        nav("/login?error=google");
      }
    })();
  }, [nav, setUser]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      <Companion state="thinking" size={120} />
      <p className="font-body text-sm text-white/50">finding you a seat…</p>
    </div>
  );
}
