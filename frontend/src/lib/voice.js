/**
 * Mysl voice — fetches TTS from the backend and plays it.
 * Single shared audio element so a new line interrupts the previous one.
 */
import { API_BASE } from "./api";

const KEY = "mysl_voice_muted";

let currentAudio = null;
let currentUrl = null;
let listeners = new Set();

function notify(state) {
  listeners.forEach((fn) => {
    try { fn(state); } catch { /* noop */ }
  });
}

export const Voice = {
  isMuted() {
    return localStorage.getItem(KEY) === "1";
  },
  setMuted(v) {
    localStorage.setItem(KEY, v ? "1" : "0");
    if (v) this.stop();
    notify({ kind: "mute", muted: v });
  },
  toggle() {
    this.setMuted(!this.isMuted());
    return this.isMuted();
  },
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  stop() {
    if (currentAudio) {
      try { currentAudio.pause(); } catch { /* noop */ }
      currentAudio = null;
    }
    if (currentUrl) {
      URL.revokeObjectURL(currentUrl);
      currentUrl = null;
    }
    notify({ kind: "ended" });
  },
  async speak(text) {
    const t = (text || "").trim();
    if (!t || this.isMuted()) return;
    // Interrupt any current playback
    this.stop();
    try {
      const token = localStorage.getItem("mysl_session_token");
      const res = await fetch(`${API_BASE}/companion/speak`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text: t }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      currentUrl = URL.createObjectURL(blob);
      const audio = new Audio(currentUrl);
      currentAudio = audio;
      audio.onended = () => {
        if (currentAudio === audio) {
          notify({ kind: "ended" });
          if (currentUrl) { URL.revokeObjectURL(currentUrl); currentUrl = null; }
          currentAudio = null;
        }
      };
      notify({ kind: "speaking", text: t });
      await audio.play();
    } catch {
      notify({ kind: "ended" });
    }
  },
};
