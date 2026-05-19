import React, { useState, useEffect, useRef } from "react";
import { Routes, Route } from "react-router-dom";
import { ThemeProvider, CssBaseline, Box } from "@mui/material";
import theme from "./theme/theme";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider, useToast } from "./context/ToastContext";
import Header from "./components/Layout/Header";
import AuthModal from "./components/Auth/AuthModal";
import HomePage from "./pages/HomePage";
import AdminPage from "./pages/AdminPage";
import UserPage from "./pages/UserPage";
import * as api from "./services/api";

function AppContent() {
  const { session, isLogged } = useAuth();
  const { showToast } = useToast();
  const [authOpen, setAuthOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const prevCountRef = useRef(0);

  useEffect(() => {
    if (!isLogged) {
      setNotifCount(0);
      prevCountRef.current = 0;
      return;
    }

    const poll = async () => {
      try {
        const notifs = await api.listarNotificacoes(session);
        const naoLidas = notifs.filter((n) => !n.lida);
        const count = naoLidas.length;
        if (count > prevCountRef.current && prevCountRef.current >= 0) {
          const nova = naoLidas[0];
          if (nova && prevCountRef.current > 0) showToast(nova.mensagem, "warning");
        }
        prevCountRef.current = count;
        setNotifCount(count);
      } catch {}
    };

    poll();
    const id = setInterval(poll, 20000);
    return () => clearInterval(id);
  }, [session, isLogged, showToast]);

  return (
    <Box sx={{ bgcolor: "background.default", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header onOpenAuth={() => setAuthOpen(true)} notifCount={notifCount} />

      <Box component="main" sx={{ flex: 1, minHeight: "calc(100vh + 120px)" }}>
        <Routes>
          <Route path="/"       element={<HomePage onRequestAuth={() => setAuthOpen(true)} />} />
          <Route path="/admin"  element={<AdminPage />} />
          <Route path="/perfil" element={<UserPage />} />
          <Route path="*"       element={<HomePage onRequestAuth={() => setAuthOpen(true)} />} />
        </Routes>
      </Box>

      <Box
        component="footer"
        sx={{
          py: 4, px: 2,
          borderTop: "1px solid rgba(167,139,250,0.2)",
          textAlign: "center",
          color: "text.secondary",
          fontSize: "0.8rem",
        }}
      >
        © {new Date().getFullYear()} Biblioteca Digital · React + MUI + FastAPI + Redis
      </Box>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </Box>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
