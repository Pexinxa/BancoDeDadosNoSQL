import React, { useState } from "react";
import {
  Dialog, DialogContent, DialogActions, Button, Typography, Box,
  Chip, Stack, Divider, Avatar, IconButton, Tooltip,
} from "@mui/material";
import {
  Close, MenuBook, BookmarkBorder, HourglassEmpty, FavoriteBorder,
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import ConfirmDialog from "../common/ConfirmDialog";
import * as api from "../../services/api";
import { getCoverUrl } from "../../utils/coverImage";

const BRAND_COLOR = "#0071e3";

function ActionConfirm({ open, onClose, onConfirm, title, message, label, color, icon, loading }) {
  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      message={message}
      confirmLabel={label}
      confirmColor={color}
      icon={icon}
      loading={loading}
    />
  );
}

export default function BookDetailModal({ open, onClose, livro, onUpdate, onRequestAuth }) {
  const { session, isLogged, isAdmin } = useAuth();
  const { showToast } = useToast();
  const [confirm, setConfirm] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!livro) return null;

  const categorias = Array.isArray(livro.categorias)
    ? livro.categorias
    : (livro.categoria || "").split(",").map((c) => c.trim()).filter(Boolean);

  const primaryColor = BRAND_COLOR;
  const disponivel = livro.status === "Disponivel" && parseInt(livro.quantidade) > 0;

  const handleAction = async (action) => {
    if (!isLogged) { onClose(); onRequestAuth?.(); return; }
    setLoading(true);
    try {
      await action();
      onUpdate?.();
    } catch (err) {
      const msg = err.response?.data?.detail || "Erro ao realizar ação";
      showToast(Array.isArray(msg) ? msg.join("; ") : msg, "error");
    } finally {
      setLoading(false);
      setConfirm(null);
    }
  };

  const openConfirm = (cfg) => {
    if (!isLogged) { onClose(); onRequestAuth?.(); return; }
    setConfirm(cfg);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, overflow: "hidden" } }}
      >
        {/* Banner colorido */}
        <Box
          sx={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}99 100%)`,
            py: 4, px: 3,
            display: "flex", alignItems: "center", gap: 3,
            position: "relative",
          }}
        >
          <IconButton
            onClick={onClose}
            sx={{ position: "absolute", top: 12, right: 12, color: "#fff" }}
            size="small"
          >
            <Close />
          </IconButton>

          {/* Capa do livro */}
          <Box
            sx={{
              width: 80, height: 110,
              borderRadius: 2,
              overflow: "hidden",
              border: "2px solid rgba(255,255,255,0.4)",
              bgcolor: "rgba(255,255,255,0.2)",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src={getCoverUrl(livro.titulo)}
              alt={livro.titulo}
              onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.nextSibling.style.display = "flex"; }}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <Box sx={{ display: "none", width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}>
              <MenuBook sx={{ fontSize: 40, color: "#fff" }} />
            </Box>
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              fontWeight={800}
              color="#fff"
              sx={{ lineHeight: 1.2, mb: 0.5 }}
            >
              {livro.titulo}
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)" }}>
              {livro.autor}
            </Typography>
            <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
              {categorias.map((cat) => (
                <Chip
                  key={cat}
                  label={cat}
                  size="small"
                  sx={{
                    bgcolor: "rgba(255,255,255,0.2)",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 11,
                    backdropFilter: "blur(8px)",
                  }}
                />
              ))}
            </Stack>
          </Box>
        </Box>

        <DialogContent sx={{ pt: 3 }}>
          {/* Metadados */}
          <Stack direction="row" spacing={4} mb={3} justifyContent="center">
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="caption" color="text.secondary" display="block">Ano</Typography>
              <Typography variant="body2" fontWeight={700}>{livro.ano}</Typography>
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="caption" color="text.secondary" display="block">Disponíveis</Typography>
              <Typography variant="body2" fontWeight={700}>{livro.quantidade}</Typography>
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="caption" color="text.secondary" display="block">Status</Typography>
              <Chip
                label={livro.status}
                size="small"
                color={disponivel ? "success" : "warning"}
                sx={{ fontWeight: 600 }}
              />
            </Box>
            {livro.id && (
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="caption" color="text.secondary" display="block">ID</Typography>
                <Typography variant="body2" fontWeight={700} color="text.secondary">#{livro.id}</Typography>
              </Box>
            )}
          </Stack>

          <Divider sx={{ mb: 2.5 }} />

          {/* Sinopse */}
          <Typography variant="subtitle2" fontWeight={700} mb={1}>Sinopse</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
            {livro.sinopse && livro.sinopse.trim()
              ? livro.sinopse
              : "Sem sinopse disponível para este livro."}
          </Typography>
        </DialogContent>

        {/* Ações — apenas para usuários não-admin */}
        {!isAdmin && (
          <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexWrap: "wrap" }}>
            {disponivel ? (
              <Button
                variant="contained"
                fullWidth
                onClick={() =>
                  openConfirm({
                    title: "Pegar Emprestado",
                    message: `Deseja pegar "${livro.titulo}" emprestado? Você terá 5 minutos para leitura.`,
                    label: "Pegar emprestado",
                    color: "primary",
                    icon: <BookmarkBorder />,
                    action: async () => {
                      await api.emprestar(livro.id, session);
                      showToast(`"${livro.titulo}" emprestado com sucesso! Você tem 5 minutos.`, "success");
                    },
                  })
                }
              >
                Pegar emprestado
              </Button>
            ) : (
              <Button
                variant="outlined"
                color="warning"
                fullWidth
                onClick={() =>
                  openConfirm({
                    title: "Lista de Espera",
                    message: `Deseja entrar na lista de espera de "${livro.titulo}"?`,
                    label: "Entrar na fila",
                    color: "warning",
                    icon: <HourglassEmpty />,
                    action: async () => {
                      await api.entrarEspera(livro.id, session);
                      showToast("Adicionado à lista de espera!", "info");
                    },
                  })
                }
              >
                Lista de Espera
              </Button>
            )}

            <Button
              variant="outlined"
              color="error"
              sx={{ flex: 1 }}
              onClick={() =>
                openConfirm({
                  title: "Adicionar aos Favoritos",
                  message: `Deseja favoritar "${livro.titulo}"?`,
                  label: "Favoritar",
                  color: "error",
                  icon: <FavoriteBorder />,
                  action: async () => {
                    await api.favoritar(livro.id, session);
                    showToast("Adicionado aos favoritos!", "success");
                  },
                })
              }
            >
              Favoritar
            </Button>
          </DialogActions>
        )}

        {isAdmin && (
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Typography variant="caption" color="text.secondary">
              Administradores não podem realizar empréstimos pessoais.
            </Typography>
          </DialogActions>
        )}
      </Dialog>

      {/* Modal de confirmação da ação */}
      {confirm && (
        <ActionConfirm
          open={Boolean(confirm)}
          onClose={() => setConfirm(null)}
          onConfirm={() => handleAction(confirm.action)}
          title={confirm.title}
          message={confirm.message}
          label={confirm.label}
          color={confirm.color}
          icon={confirm.icon}
          loading={loading}
        />
      )}
    </>
  );
}
