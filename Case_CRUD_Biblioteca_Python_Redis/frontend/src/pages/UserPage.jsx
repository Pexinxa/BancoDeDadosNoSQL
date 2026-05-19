import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Container, Typography, Grid, Card, CardContent, CardActions,
  Button, Chip, Stack, Tab, Tabs, Avatar, Paper, Divider,
  IconButton, List, ListItem, ListItemText,
  ListItemAvatar, ListItemSecondaryAction, Skeleton,
} from "@mui/material";
import {
  MenuBook, AccessTime, Logout, CheckCircle, Delete, DoneAll,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import * as api from "../services/api";
import ConfirmDialog from "../components/common/ConfirmDialog";

function EmptyState({ message }) {
  return (
    <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
      <MenuBook sx={{ fontSize: 56, opacity: 0.3, mb: 1 }} />
      <Typography variant="body1">{message}</Typography>
    </Box>
  );
}

function Countdown({ devolucaoEm }) {
  const [remaining, setRemaining] = useState("");
  const [urgente, setUrgente]     = useState(false);

  useEffect(() => {
    const calc = () => {
      const diff = parseInt(devolucaoEm) - Math.floor(Date.now() / 1000);
      if (diff <= 0) { setRemaining("Expirado"); setUrgente(true); return; }
      const min = Math.floor(diff / 60);
      const seg = diff % 60;
      setUrgente(diff < 60);
      setRemaining(`${min}m ${seg.toString().padStart(2, "0")}s`);
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [devolucaoEm]);

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      <AccessTime sx={{ fontSize: 13, color: urgente ? "error.main" : "warning.main" }} />
      <Typography variant="caption" color={urgente ? "error.main" : "warning.main"} fontWeight={600}>
        {remaining}
      </Typography>
    </Box>
  );
}

function EmprestimoCard({ livro, onDevolver }) {
  const [loading, setLoading]       = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { session } = useAuth();
  const { showToast } = useToast();

  const handleDevolver = async () => {
    setLoading(true);
    try {
      await api.devolver(livro.livro_id, session);
      showToast(`"${livro.titulo}" devolvido com sucesso!`, "success");
      onDevolver?.();
    } catch (e) {
      showToast(e.response?.data?.detail || "Erro ao devolver", "error");
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  };

  return (
    <>
      <Card
        elevation={0}
        sx={{ height: "100%", borderRadius: 3, border: "1px solid rgba(167,139,250,0.2)" }}
      >
        <CardContent>
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
            <Avatar sx={{ bgcolor: "primary.main", width: 40, height: 40, flexShrink: 0 }}>
              <MenuBook fontSize="small" />
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" fontWeight={700} noWrap>{livro.titulo}</Typography>
              <Typography variant="body2" color="text.secondary" noWrap mb={0.5}>{livro.autor}</Typography>
              <Countdown devolucaoEm={livro.devolucao_em} />
            </Box>
          </Box>
        </CardContent>
        <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
          <Button fullWidth variant="outlined" color="error" size="small" onClick={() => setConfirmOpen(true)}>
            Devolver
          </Button>
        </CardActions>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDevolver}
        title="Devolver Livro"
        message={`Confirma a devolução de "${livro.titulo}"?`}
        confirmLabel="Devolver"
        confirmColor="error"
        icon={<MenuBook />}
        loading={loading}
      />
    </>
  );
}

export default function UserPage() {
  const { session, signOut, isLogged } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [tab, setTab]               = useState(0);
  const [loading, setLoading]       = useState(true);
  const [emprestimos, setEmprestimos] = useState([]);
  const [favoritos, setFavoritos]   = useState([]);
  const [espera, setEspera]         = useState([]);
  const [notificacoes, setNotificacoes] = useState([]);

  const carregar = useCallback(async () => {
    if (!isLogged) { navigate("/"); return; }
    setLoading(true);
    try {
      const [emp, fav, esp, notif] = await Promise.all([
        api.listarEmprestimos(session),
        api.listarFavoritos(session),
        api.listarEspera(session),
        api.listarNotificacoes(session),
      ]);
      setEmprestimos(emp);
      setFavoritos(fav);
      setEspera(esp);
      setNotificacoes(notif);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [session, isLogged, navigate]);

  useEffect(() => { carregar(); }, [carregar]);

  useEffect(() => {
    if (!isLogged) return;
    const id = setInterval(async () => {
      try {
        const notif = await api.listarNotificacoes(session);
        const naoLidasNovo = notif.filter((n) => !n.lida).length;
        const naoLidasAtual = notificacoes.filter((n) => !n.lida).length;
        if (naoLidasNovo > naoLidasAtual) {
          const nova = notif.find((n) => !n.lida);
          if (nova) showToast(nova.mensagem, "warning");
          setNotificacoes(notif);
        }
      } catch {}
    }, 15000);
    return () => clearInterval(id);
  }, [isLogged, session, notificacoes, showToast]);

  const handleRemoverFavorito = async (livro) => {
    try {
      await api.removerFavorito(livro.id, session);
      showToast(`"${livro.titulo}" removido dos favoritos`, "info");
      carregar();
    } catch { showToast("Erro ao remover favorito", "error"); }
  };

  const handleMarcarLida = async (index) => {
    try {
      await api.marcarNotificacaoLida(index, session);
      setNotificacoes((prev) =>
        prev.map((n) => (n.index === index ? { ...n, lida: true } : n))
      );
    } catch {}
  };

  const handleRemoverNotif = async (index) => {
    try { await api.removerNotificacao(index, session); carregar(); } catch {}
  };

  if (!isLogged) return null;

  const naoLidas = notificacoes.filter((n) => !n.lida).length;
  const TABS   = ["Empréstimos", "Favoritos", "Em Espera", "Notificações"];
  const BADGES = [emprestimos.length, 0, espera.length, naoLidas];

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>

      {/* ── Header do perfil ── */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3 }, mb: 3, borderRadius: 4,
          background: "linear-gradient(135deg, #26215C 0%, #160B30 50%, #0E0720 100%)",
          border: "1px solid rgba(167,139,250,0.2)",
          color: "#fff",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          <Avatar
            sx={{
              width: { xs: 56, md: 72 }, height: { xs: 56, md: 72 },
              bgcolor: "rgba(255,255,255,0.2)",
              fontSize: { xs: 22, md: 28 }, fontWeight: 700,
              border: "2px solid rgba(255,255,255,0.3)",
              flexShrink: 0,
            }}
          >
            {session.username[0].toUpperCase()}
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h5"
              fontWeight={800}
              letterSpacing="-0.02em"
              sx={{ fontSize: { xs: "1.2rem", md: "1.5rem" } }}
              noWrap
            >
              {session.username}
            </Typography>
            <Chip
              label={session.cargo}
              size="small"
              sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "#fff", fontWeight: 600, mt: 0.5 }}
            />
          </Box>

          {/* Stats — responsivas */}
          <Stack
            direction="row"
            spacing={{ xs: 2, md: 3 }}
            sx={{ textAlign: "center", flexShrink: 0 }}
          >
            {[
              { label: "Empréstimos", value: emprestimos.length },
              { label: "Favoritos",   value: favoritos.length },
              { label: "Notif.",      value: naoLidas },
            ].map((stat) => (
              <Box key={stat.label}>
                <Typography variant="h5" fontWeight={800} sx={{ fontSize: { xs: "1.2rem", md: "1.5rem" } }}>
                  {stat.value}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8, fontSize: { xs: 10, md: 12 } }}>
                  {stat.label}
                </Typography>
              </Box>
            ))}
          </Stack>

          <Button
            variant="outlined"
            startIcon={<Logout />}
            size="small"
            onClick={() => { signOut(); navigate("/"); showToast("Até logo!", "info"); }}
            sx={{
              color: "#fff", borderColor: "rgba(255,255,255,0.4)",
              "&:hover": { borderColor: "#fff", bgcolor: "rgba(255,255,255,0.08)" },
              flexShrink: 0,
            }}
          >
            Sair
          </Button>
        </Box>
      </Paper>

      {/* ── Tabs ── */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3, "& .MuiTabs-indicator": { height: 3, borderRadius: 2 } }}
      >
        {TABS.map((label, i) => (
          <Tab
            key={label}
            label={
              BADGES[i] > 0
                ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    {label}
                    <Chip
                      label={BADGES[i]}
                      size="small"
                      color={i === 3 ? "error" : "primary"}
                      sx={{ height: 18, fontSize: 10, minWidth: 20 }}
                    />
                  </Box>
                )
                : label
            }
          />
        ))}
      </Tabs>

      {/* ── Conteúdo ── */}
      {loading ? (
        <Grid container spacing={2}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rounded" height={160} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <>
          {/* Empréstimos */}
          {tab === 0 && (
            emprestimos.length === 0
              ? <EmptyState message="Você não tem nenhum livro emprestado no momento" />
              : (
                <Grid container spacing={2}>
                  {emprestimos.map((livro) => (
                    <Grid item xs={12} sm={6} md={4} key={livro.livro_id}>
                      <EmprestimoCard livro={livro} onDevolver={carregar} />
                    </Grid>
                  ))}
                </Grid>
              )
          )}

          {/* Favoritos */}
          {tab === 1 && (
            favoritos.length === 0
              ? <EmptyState message="Você não adicionou nenhum livro aos favoritos" />
              : (
                <Grid container spacing={2}>
                  {favoritos.map((livro) => (
                    <Grid item xs={12} sm={6} md={4} key={livro.id}>
                      <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid rgba(167,139,250,0.2)", height: "100%" }}>
                        <CardContent>
                          <Box sx={{ display: "flex", gap: 1.5 }}>
                            <Avatar sx={{ bgcolor: "error.light", width: 40, height: 40, flexShrink: 0 }}>
                              <MenuBook fontSize="small" />
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="subtitle2" fontWeight={700} noWrap>
                                {livro.titulo}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" noWrap mb={0.5}>
                                {livro.autor}
                              </Typography>
                              <Chip
                                label={livro.status}
                                size="small"
                                color={livro.status === "Disponivel" ? "success" : "warning"}
                                sx={{ height: 20, fontSize: 10 }}
                              />
                            </Box>
                          </Box>
                        </CardContent>
                        <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
                          <Button size="small" color="error" fullWidth onClick={() => handleRemoverFavorito(livro)}>
                            Remover dos favoritos
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )
          )}

          {/* Lista de espera */}
          {tab === 2 && (
            espera.length === 0
              ? <EmptyState message="Você não está na lista de espera de nenhum livro" />
              : (
                <Grid container spacing={2}>
                  {espera.map((livro) => (
                    <Grid item xs={12} sm={6} md={4} key={livro.id}>
                      <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid rgba(167,139,250,0.2)" }}>
                        <CardContent>
                          <Box sx={{ display: "flex", gap: 1.5 }}>
                            <Avatar sx={{ bgcolor: "warning.light", width: 40, height: 40, flexShrink: 0 }}>
                              <AccessTime fontSize="small" />
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" fontWeight={700}>{livro.titulo}</Typography>
                              <Typography variant="body2" color="text.secondary" mb={0.5}>{livro.autor}</Typography>
                              <Typography variant="caption" color="warning.main" fontWeight={600}>
                                Aguardando disponibilidade
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )
          )}

          {/* Notificações */}
          {tab === 3 && (
            notificacoes.length === 0
              ? <EmptyState message="Nenhuma notificação por enquanto" />
              : (
                <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid rgba(167,139,250,0.2)" }}>
                  <List disablePadding>
                    {notificacoes.map((n, i) => (
                      <React.Fragment key={n.index}>
                        <ListItem
                          sx={{
                            py: { xs: 1.5, md: 2 },
                            px: { xs: 2, md: 3 },
                            bgcolor: n.lida ? "transparent" : "rgba(167,139,250,0.07)",
                            opacity: n.lida ? 0.6 : 1,
                            transition: "opacity 0.2s, background 0.2s",
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar
                              sx={{
                                bgcolor: n.lida ? "grey.200" : "primary.main",
                                width: 36, height: 36,
                                transition: "background 0.2s",
                              }}
                            >
                              <CheckCircle fontSize="small" sx={{ color: n.lida ? "grey.500" : "#fff" }} />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={n.mensagem}
                            primaryTypographyProps={{
                              variant: "body2",
                              fontWeight: n.lida ? 400 : 600,
                              sx: { pr: { xs: 7, md: 10 } },
                            }}
                          />
                          <ListItemSecondaryAction sx={{ display: "flex", gap: 0.5 }}>
                            {!n.lida && (
                              <IconButton
                                size="small"
                                onClick={() => handleMarcarLida(n.index)}
                                sx={{ color: "primary.main" }}
                                title="Marcar como lida"
                              >
                                <DoneAll fontSize="small" />
                              </IconButton>
                            )}
                            <IconButton
                              size="small"
                              onClick={() => handleRemoverNotif(n.index)}
                              sx={{ color: "text.disabled" }}
                              title="Apagar"
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                        {i < notificacoes.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </Paper>
              )
          )}
        </>
      )}
    </Container>
  );
}
