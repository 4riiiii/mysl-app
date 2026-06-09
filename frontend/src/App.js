import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import Workspace from "./pages/Workspace";
import Sessions from "./pages/Sessions";
import Insights from "./pages/Insights";
import Navbar from "./components/Navbar";
import Companion from "./components/Companion";
import "./App.css";

function Protected({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5">
        <Companion state="thinking" size={100} />
        <p className="font-body text-xs text-white/40">a moment…</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

function AppShell() {
  const loc = useLocation();
  // Handle session_id in URL hash synchronously during render
  if (loc.hash?.includes("session_id=")) return <AuthCallback />;

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/workspace" element={<Protected><Workspace /></Protected>} />
        <Route path="/sessions" element={<Protected><Sessions /></Protected>} />
        <Route path="/insights" element={<Protected><Insights /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}
