import React from "react";
import {
  Dialog, DialogContent, DialogActions,
  Button, Typography, Box, CircularProgress,
} from "@mui/material";

export default function ConfirmDialog({
  open, onClose, onConfirm,
  title = "Confirmar ação",
  message = "Deseja continuar?",
  confirmLabel = "Confirmar",
  confirmColor = "primary",
  icon,
  loading = false,
}) {
  const colorMap = {
    primary: { bg: "rgba(124,58,237,0.12)",  fg: "#A78BFA" },
    error:   { bg: "rgba(248,113,113,0.12)", fg: "#F87171" },
    warning: { bg: "rgba(167,139,250,0.12)", fg: "#A78BFA" },
    success: { bg: "rgba(93,202,165,0.12)",  fg: "#5DCAA5" },
  };
  const colors = colorMap[confirmColor] || colorMap.primary;

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 4, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" } }}
    >
      <DialogContent sx={{ pt: 4, pb: 2, textAlign: "center" }}>
        {icon && (
          <Box
            sx={{
              width: 64, height: 64, borderRadius: "50%",
              background: colors.bg,
              display: "flex", alignItems: "center", justifyContent: "center",
              mx: "auto", mb: 2.5,
              "& svg": { fontSize: 32, color: colors.fg },
            }}
          >
            {icon}
          </Box>
        )}
        <Typography variant="h6" fontWeight={700} mb={1}>{title}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
          {message}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1, justifyContent: "center" }}>
        <Button onClick={onClose} disabled={loading} variant="outlined" sx={{ flex: 1, borderRadius: 2 }} color="inherit">
          Cancelar
        </Button>
        <Button onClick={onConfirm} disabled={loading} variant="contained" color={confirmColor} sx={{ flex: 1, borderRadius: 2 }}>
          {loading ? <CircularProgress size={20} color="inherit" /> : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
