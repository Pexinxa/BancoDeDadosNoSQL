import React, { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, Typography, Select, MenuItem,
  FormControl, InputLabel, Alert, CircularProgress, Grid,
  IconButton, Chip, Checkbox, Autocomplete,
} from "@mui/material";
import { Close, MenuBook, CloudUpload } from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import * as api from "../../services/api";
import { getCoverUrl } from "../../utils/coverImage";

// Categorias em ordem alfabética (pt-BR), "Outros" sempre por último
const _BASE = [
  "Arte", "Autoajuda", "Biografia", "Ciência", "Cinema",
  "Crônica", "Direito", "Economia", "Educação", "Esportes",
  "Fantasia", "Ficção", "Ficção Científica", "Filosofia",
  "Gastronomia", "História", "Horror", "Infantil", "Jovem Adulto",
  "Juvenil", "Literatura", "Medicina", "Mistério", "Música",
  "Poesia", "Política", "Psicologia", "Quadrinhos",
  "Religião", "Romance", "Suspense", "Tecnologia", "Terror",
  "Thriller", "Viagem",
].sort((a, b) => a.localeCompare(b, "pt"));

export const CATEGORIAS = [..._BASE, "Outros"];

const STATUS_OPTIONS = ["Disponivel", "Emprestado"];

const EMPTY = {
  titulo: "", autor: "", categorias: [],
  ano: new Date().getFullYear(), quantidade: 1,
  status: "Disponivel", sinopse: "",
};

export default function BookForm({ open, onClose, onSave, livro = null }) {
  const { session } = useAuth();
  const { showToast } = useToast();
  const [form, setForm]           = useState(EMPTY);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  useEffect(() => {
    if (!open) return;
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverFile(null);
    setCoverPreview(null);

    if (livro) {
      const cats = Array.isArray(livro.categorias)
        ? livro.categorias
        : (livro.categoria || "").split(",").map((c) => c.trim()).filter(Boolean);
      setForm({
        titulo:     livro.titulo    || "",
        autor:      livro.autor     || "",
        categorias: cats,
        ano:        livro.ano       || new Date().getFullYear(),
        quantidade: livro.quantidade ?? 0,
        status:     livro.status    || "Disponivel",
        sinopse:    livro.sinopse   || "",
      });
    } else {
      setForm(EMPTY);
    }
    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, livro]);

  const handleField = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setError("");
  };

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (form.categorias.length === 0) {
      setError("Selecione ao menos uma categoria");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onSave({
        ...form,
        categoria:  form.categorias.join(","),
        categorias: form.categorias,
      });

      // Upload da capa
      if (coverFile && form.titulo) {
        try {
          await api.uploadCapa(form.titulo, coverFile, session);
        } catch (e) {
          const detail = e.response?.data?.detail;
          const msg = Array.isArray(detail) ? detail.join("; ") : detail || "Erro ao enviar capa";
          showToast(`⚠️ Livro salvo, mas capa falhou: ${msg}`, "warning");
        }
      }

      onClose();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(Array.isArray(detail) ? detail.join("; ") : detail || "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  };

  const isEdit = Boolean(livro);

  const imgSrc = coverPreview || (isEdit && form.titulo ? getCoverUrl(form.titulo) : "");
  const showImg = Boolean(imgSrc);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="h6" fontWeight={700}>
          {isEdit ? "Editar Livro" : "Novo Livro"}
        </Typography>
        <IconButton onClick={onClose} size="small"><Close fontSize="small" /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
        )}

        <Grid container spacing={2}>

          {/* Título */}
          <Grid item xs={12}>
            <TextField
              label="Título *"
              name="titulo"
              value={form.titulo}
              onChange={handleField}
              fullWidth
              autoFocus
            />
          </Grid>

          {/* Autor */}
          <Grid item xs={12}>
            <TextField
              label="Autor *"
              name="autor"
              value={form.autor}
              onChange={handleField}
              fullWidth
            />
          </Grid>

          {/* Capa do livro */}
          <Grid item xs={12}>
            <Typography variant="caption" color="text.secondary" display="block" mb={1}>
              Capa do Livro (PNG ou JPG)
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              {/* Preview */}
              <Box
                sx={{
                  width: 60, height: 84, borderRadius: 1.5, overflow: "hidden", flexShrink: 0,
                  bgcolor: "grey.100", border: "1px solid", borderColor: "divider",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <img
                  key={imgSrc}
                  src={imgSrc}
                  alt="Capa"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    if (e.currentTarget.nextSibling)
                      e.currentTarget.nextSibling.style.display = "flex";
                  }}
                  style={{
                    width: "100%", height: "100%", objectFit: "cover",
                    display: showImg ? "block" : "none",
                  }}
                />
                <Box
                  sx={{
                    display: showImg ? "none" : "flex",
                    width: "100%", height: "100%",
                    alignItems: "center", justifyContent: "center",
                  }}
                >
                  <MenuBook sx={{ color: "text.disabled", fontSize: 28 }} />
                </Box>
              </Box>

              {/* Botão de seleção */}
              <Box>
                <Button
                  variant="outlined"
                  size="small"
                  component="label"
                  startIcon={<CloudUpload fontSize="small" />}
                >
                  {coverFile ? "Trocar imagem" : "Selecionar PNG"}
                  <input
                    type="file"
                    hidden
                    accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                    onChange={handleCoverChange}
                  />
                </Button>
                {coverFile && (
                  <Typography variant="caption" display="block" mt={0.5} color="text.secondary">
                    {coverFile.name}
                  </Typography>
                )}
                {!coverFile && isEdit && (
                  <Typography variant="caption" display="block" mt={0.5} color="text.secondary">
                    Deixe vazio para manter a capa atual
                  </Typography>
                )}
              </Box>
            </Box>
          </Grid>

          {/* Categorias */}
          <Grid item xs={12}>
            <Autocomplete
              multiple
              options={CATEGORIAS}
              value={form.categorias}
              onChange={(_, newValue) => {
                setForm((f) => ({ ...f, categorias: newValue }));
                setError("");
              }}
              disableCloseOnSelect
              renderOption={(props, option, { selected }) => {
                const { key, ...rest } = props;
                return (
                  <li key={key} {...rest}>
                    <Checkbox size="small" checked={selected} sx={{ mr: 1, p: 0.5 }} />
                    {option}
                  </li>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Categorias *"
                  placeholder={form.categorias.length === 0 ? "Selecione ou filtre..." : ""}
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip key={option} label={option} size="small" {...getTagProps({ index })} />
                ))
              }
              noOptionsText="Nenhuma categoria encontrada"
            />
          </Grid>

          {/* Ano */}
          <Grid item xs={6} sm={4}>
            <TextField
              label="Ano *"
              name="ano"
              type="number"
              value={form.ano}
              onChange={handleField}
              fullWidth
              inputProps={{ min: 1, max: 2100 }}
            />
          </Grid>

          {/* Quantidade */}
          <Grid item xs={6} sm={4}>
            <TextField
              label="Quantidade *"
              name="quantidade"
              type="number"
              value={form.quantidade}
              onChange={handleField}
              fullWidth
              inputProps={{ min: 0 }}
            />
          </Grid>

          {/* Status (só na edição) */}
          {isEdit && (
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select name="status" value={form.status} onChange={handleField} label="Status">
                  {STATUS_OPTIONS.map((s) => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          {/* Sinopse */}
          <Grid item xs={12}>
            <TextField
              label="Sinopse"
              name="sinopse"
              value={form.sinopse}
              onChange={handleField}
              fullWidth
              multiline
              rows={4}
              placeholder="Descreva brevemente o conteúdo do livro..."
              inputProps={{ maxLength: 1000 }}
              helperText={`${(form.sinopse || "").length}/1000`}
            />
          </Grid>

        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} color="inherit">Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={loading || !form.titulo || !form.autor || form.categorias.length === 0}
        >
          {loading
            ? <CircularProgress size={20} color="inherit" />
            : isEdit ? "Salvar alterações" : "Criar Livro"
          }
        </Button>
      </DialogActions>
    </Dialog>
  );
}
