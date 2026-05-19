import React, { useState, useEffect, useMemo } from "react";
import {
  Box, Container, Typography, Grid, TextField, InputAdornment,
  Chip, Stack, Skeleton, Button, Fade, Pagination, IconButton,
} from "@mui/material";
import { Search, AutoStories, Close } from "@mui/icons-material";
import BookCard from "../components/Books/BookCard";
import * as api from "../services/api";

const PAGE_SIZE = 8;

export default function HomePage({ onRequestAuth }) {
  const [livros, setLivros]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [categoria, setCategoria] = useState("Todos");
  const [page, setPage]         = useState(1);

  const carregar = async () => {
    setLoading(true);
    try {
      const data = await api.listarLivros();
      setLivros(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  // Volta para a pág. 1 sempre que filtro/busca mudam
  useEffect(() => { setPage(1); }, [search, categoria]);

  const categorias = useMemo(() => {
    const cats = [...new Set(livros.map((l) => l.categoria))].filter(Boolean);
    return ["Todos", ...cats.sort()];
  }, [livros]);

  const filtrados = useMemo(() => {
    return livros.filter((l) => {
      const matchSearch = !search ||
        l.titulo?.toLowerCase().includes(search.toLowerCase()) ||
        l.autor?.toLowerCase().includes(search.toLowerCase());
      const matchCat = categoria === "Todos" || l.categoria === categoria;
      return matchSearch && matchCat;
    });
  }, [livros, search, categoria]);

  const totalPages  = Math.ceil(filtrados.length / PAGE_SIZE);
  const paginados   = filtrados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Box>
      {/* ── Hero ── */}
      <Box
        sx={{
          background: "linear-gradient(160deg, #160B30 0%, #0E0720 80%, #0E0720 100%)",
          py: { xs: 8, md: 12 },
          px: 2,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Orbs decorativos */}
        <Box sx={{
          position: "absolute", width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)",
          top: "-20%", left: "-10%", pointerEvents: "none",
        }} />
        <Box sx={{
          position: "absolute", width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(79,70,229,0.14) 0%, transparent 70%)",
          bottom: "-15%", right: "5%", pointerEvents: "none",
        }} />
        {[300, 200, 120].map((size, i) => (
          <Box
            key={i}
            sx={{
              position: "absolute",
              width: size, height: size,
              borderRadius: "50%",
              border: "1px solid rgba(167,139,250,0.08)",
              top: `${20 + i * 15}%`,
              right: `${5 + i * 8}%`,
            }}
          />
        ))}

        <Container maxWidth="lg">
          <Fade in timeout={800}>
            <Box sx={{ textAlign: "center", color: "#fff", mb: 4 }}>
              <Chip
                label="Bem-vindo à Biblioteca Digital"
                sx={{
                  mb: 3,
                  background: "rgba(167,139,250,0.12)",
                  color: "#A78BFA",
                  fontWeight: 600,
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(167,139,250,0.25)",
                }}
              />
              <Typography
                variant="h2"
                sx={{
                  fontSize: { xs: "2.4rem", md: "3.8rem" },
                  letterSpacing: "-0.02em",
                  lineHeight: 1.1,
                  mb: 1,
                  color: "#fff",
                }}
              >
                Leia mais. Descubra mais.
              </Typography>
              <Typography
                variant="h2"
                sx={{
                  fontSize: { xs: "2.4rem", md: "3.8rem" },
                  letterSpacing: "-0.02em",
                  lineHeight: 1.2,
                  mb: 3,
                  background: "linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Seja mais.
              </Typography>
              <Typography
                variant="h6"
                sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 400, mb: 4, maxWidth: 540, mx: "auto", lineHeight: 1.7 }}
              >
                A biblioteca que acompanha o seu ritmo de vida — explore, empreste e acompanhe seu histórico de leituras com facilidade.
              </Typography>

              {/* Busca no hero */}
              <Box sx={{ maxWidth: 480, mx: "auto" }}>
                <TextField
                  placeholder="Buscar por título ou autor..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: "rgba(0,0,0,0.4)" }} />
                      </InputAdornment>
                    ),
                    endAdornment: search && (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setSearch("")} edge="end">
                          <Close fontSize="small" sx={{ color: "rgba(0,0,0,0.4)" }} />
                        </IconButton>
                      </InputAdornment>
                    ),
                    sx: {
                      background: "rgba(255,255,255,0.06)",
                      backdropFilter: "blur(12px)",
                      borderRadius: 3,
                      "& fieldset": { border: "1px solid rgba(167,139,250,0.3)" },
                      "&:hover fieldset": { border: "1px solid rgba(167,139,250,0.5)" },
                      color: "#fff",
                      boxShadow: "0 8px 32px rgba(124,58,237,0.15)",
                    },
                  }}
                />
              </Box>
            </Box>
          </Fade>
        </Container>
      </Box>

      {/* ── Catálogo ── */}
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        {/* Filtros por categoria */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2, mb: 2 }}>
            <Typography variant="h5" fontWeight={700}>
              Catálogo de Livros
            </Typography>
            <TextField
              placeholder="Buscar por título ou autor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              sx={{ width: { xs: "100%", sm: 280 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" sx={{ color: "text.disabled" }} />
                  </InputAdornment>
                ),
                endAdornment: search && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearch("")} edge="end">
                      <Close fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {categorias.map((cat) => (
              <Chip
                key={cat}
                label={cat}
                clickable
                onClick={() => setCategoria(cat)}
                variant={categoria === cat ? "filled" : "outlined"}
                color={categoria === cat ? "primary" : "default"}
                sx={{ fontWeight: categoria === cat ? 600 : 400 }}
              />
            ))}
          </Stack>
        </Box>

        {/* Contagem de resultados */}
        {search && (
          <Typography variant="body2" color="text.secondary" mb={2}>
            {filtrados.length} resultado{filtrados.length !== 1 ? "s" : ""} para "{search}"
          </Typography>
        )}

        {loading ? (
          <Grid container spacing={{ xs: 1.5, md: 3 }}>
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <Grid item xs={6} md={3} key={i}>
                <Skeleton
                  variant="rounded"
                  sx={{ borderRadius: 2.5, aspectRatio: { xs: "2/3", md: "unset" }, height: { xs: "unset", md: 320 } }}
                />
              </Grid>
            ))}
          </Grid>
        ) : filtrados.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <AutoStories sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Nenhum livro encontrado
            </Typography>
            <Button onClick={() => { setSearch(""); setCategoria("Todos"); }} sx={{ mt: 2 }}>
              Limpar filtros
            </Button>
          </Box>
        ) : (
          <>
            {/* Grade: 2 colunas mobile, 4 colunas desktop */}
            <Grid container spacing={{ xs: 1.5, md: 3 }}>
              {paginados.map((livro) => (
                <Grid item xs={6} md={3} key={livro.id}>
                  <BookCard
                    livro={livro}
                    onUpdate={carregar}
                    onRequestAuth={onRequestAuth}
                  />
                </Grid>
              ))}
            </Grid>

            {/* Paginação */}
            {totalPages > 1 && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, value) => {
                    setPage(value);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  color="primary"
                  shape="rounded"
                  size="large"
                />
              </Box>
            )}
          </>
        )}
      </Container>
    </Box>
  );
}
