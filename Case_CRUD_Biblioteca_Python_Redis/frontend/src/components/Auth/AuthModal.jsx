import React, { useState } from "react";
import {
  Dialog, DialogContent, DialogActions,
  TextField, Button, Box, Typography, Tabs, Tab,
  InputAdornment, IconButton, Alert, CircularProgress,
} from "@mui/material";
import { Visibility, VisibilityOff, Person, Lock, MenuBook } from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import * as api from "../../services/api";

export default function AuthModal({ open, onClose }) {
  const { signIn } = useAuth();
  const { showToast } = useToast();
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleLogin = async () => {
    setLoading(true); setError("");
    try {
      await signIn(form.username, form.password);
      showToast(`Bem-vindo, ${form.username}!`, "success");
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Credenciais inválidas");
    } finally {
      setLoading(false);
    }
  };

  const handleCadastro = async () => {
    setLoading(true); setError("");
    try {
      await api.cadastrar(form.username, form.password);
      await signIn(form.username, form.password);
      showToast(`Conta criada! Bem-vindo, ${form.username}!`, "success");
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Erro ao cadastrar");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = tab === 0 ? handleLogin : handleCadastro;
  const handleKeyDown = (e) => { if (e.key === "Enter") handleSubmit(); };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 4, overflow: "hidden" } }}
    >
      {/* Header decorativo */}
      <Box sx={{ background: "linear-gradient(135deg, #0071e3 0%, #2997ff 100%)", py: 3, px: 3, textAlign: "center" }}>
        <MenuBook sx={{ fontSize: 40, color: "#fff", mb: 1 }} />
        <Typography variant="h6" fontWeight={700} color="#fff">Biblioteca Digital</Typography>
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)", mt: 0.5 }}>
          Seu acervo digital sempre disponível
        </Typography>
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v) => { setTab(v); setError(""); }}
        centered
        sx={{ borderBottom: "1px solid rgba(0,0,0,0.08)", "& .MuiTabs-indicator": { height: 3, borderRadius: 2 } }}
      >
        <Tab label="Entrar" />
        <Tab label="Criar conta" />
      </Tabs>

      <DialogContent sx={{ pt: 3, pb: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
        )}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Usuário"
            name="username"
            value={form.username}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            fullWidth
            autoFocus
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person sx={{ color: "text.secondary", fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="Senha"
            name="password"
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock sx={{ color: "text.secondary", fontSize: 20 }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword((s) => !s)} edge="end" size="small">
                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
        {tab === 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: "block" }}>
            Admin padrão: <strong>admin / admin</strong>
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, flexDirection: "column", gap: 1 }}>
        <Button
          variant="contained"
          fullWidth
          size="large"
          onClick={handleSubmit}
          disabled={loading || !form.username || !form.password}
          sx={{ borderRadius: 2 }}
        >
          {loading
            ? <CircularProgress size={22} color="inherit" />
            : tab === 0 ? "Entrar" : "Criar conta"}
        </Button>
        <Button fullWidth onClick={onClose} color="inherit" sx={{ color: "text.secondary" }}>
          Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
