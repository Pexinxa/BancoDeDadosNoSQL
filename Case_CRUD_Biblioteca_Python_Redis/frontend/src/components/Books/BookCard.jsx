import React, { useState } from "react";
import {
  Card, CardContent, CardActionArea, Typography, Chip,
  Box, Stack, useTheme, useMediaQuery,
} from "@mui/material";
import { MenuBook } from "@mui/icons-material";
import BookDetailModal from "./BookDetailModal";
import { getCoverUrl } from "../../utils/coverImage";

const BRAND_COLOR = "#A78BFA";

export default function BookCard({ livro, onUpdate, onRequestAuth }) {
  const [detailOpen, setDetailOpen] = useState(false);
  const theme     = useTheme();
  const isMobile  = useMediaQuery(theme.breakpoints.down("md"));

  const categorias = Array.isArray(livro.categorias)
    ? livro.categorias
    : (livro.categoria || "").split(",").map((c) => c.trim()).filter(Boolean);

  const disponivel = livro.status === "Disponivel" && parseInt(livro.quantidade) > 0;

  /* ─── Layout mobile: retangular tipo capa de livro ─── */
  if (isMobile) {
    return (
      <>
        <Card
          sx={{
            borderRadius: 2.5,
            overflow: "hidden",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 2px 12px rgba(0,0,0,0.10)",
          }}
        >
          <CardActionArea
            onClick={() => setDetailOpen(true)}
            sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "stretch" }}
          >
            {/* Capa — proporção de livro 2:3 */}
            <Box
              sx={{
                width: "100%",
                aspectRatio: "2 / 3",
                position: "relative",
                overflow: "hidden",
                bgcolor: `${BRAND_COLOR}10`,
                flexShrink: 0,
              }}
            >
              <img
                src={getCoverUrl(livro.titulo)}
                alt={livro.titulo}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  if (e.currentTarget.nextSibling)
                    e.currentTarget.nextSibling.style.display = "flex";
                }}
                style={{
                  width: "100%", height: "100%",
                  objectFit: "cover", display: "block",
                  position: "absolute", top: 0, left: 0,
                }}
              />
              {/* Fallback sem capa */}
              <Box
                sx={{
                  display: "none", position: "absolute", inset: 0,
                  alignItems: "center", justifyContent: "center",
                  background: `linear-gradient(160deg, ${BRAND_COLOR}22, ${BRAND_COLOR}08)`,
                }}
              >
                <MenuBook sx={{ fontSize: 48, color: BRAND_COLOR, opacity: 0.6 }} />
              </Box>

              {/* Badge de status sobreposto */}
              <Chip
                label={disponivel ? "Disponível" : "Emprestado"}
                size="small"
                color={disponivel ? "success" : "warning"}
                sx={{
                  position: "absolute", top: 6, right: 6,
                  fontSize: 9, height: 18,
                  backdropFilter: "blur(6px)",
                  bgcolor: disponivel ? "rgba(52,199,89,0.85)" : "rgba(255,159,10,0.85)",
                  color: "#fff", fontWeight: 600, border: "none",
                }}
              />
            </Box>

            {/* Info compacta abaixo da capa */}
            <Box sx={{ px: 1, py: 1, flex: 1, bgcolor: "rgba(22,11,48,0.95)" }}>
              <Typography
                sx={{
                  fontSize: 11, fontWeight: 700, lineHeight: 1.3,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  mb: 0.25,
                }}
              >
                {livro.titulo}
              </Typography>
              <Typography
                sx={{ fontSize: 10, color: "text.secondary", lineHeight: 1.2 }}
                noWrap
              >
                {livro.autor}
              </Typography>
            </Box>
          </CardActionArea>
        </Card>

        <BookDetailModal
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          livro={livro}
          onUpdate={onUpdate}
          onRequestAuth={onRequestAuth}
        />
      </>
    );
  }

  /* ─── Layout desktop: card completo ─── */
  return (
    <>
      <Card
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          cursor: "pointer",
        }}
      >
        <CardActionArea
          onClick={() => setDetailOpen(true)}
          sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "stretch" }}
        >
          {/* Faixa de cor no topo */}
          <Box sx={{ height: 5, background: BRAND_COLOR, flexShrink: 0 }} />

          <CardContent sx={{ flex: 1, p: 2.5 }}>
            {/* Status badge */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
              <Chip
                label={disponivel ? "Disponível" : "Emprestado"}
                size="small"
                color={disponivel ? "success" : "warning"}
                variant="outlined"
                sx={{ fontSize: 10, height: 20 }}
              />
            </Box>

            {/* Capa do livro */}
            <Box
              sx={{
                display: "flex", alignItems: "center", justifyContent: "center",
                height: 140, my: 1.5,
                borderRadius: 2,
                overflow: "hidden",
                background: `linear-gradient(135deg, ${BRAND_COLOR}18, ${BRAND_COLOR}08)`,
              }}
            >
              <img
                src={getCoverUrl(livro.titulo)}
                alt={livro.titulo}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  if (e.currentTarget.nextSibling)
                    e.currentTarget.nextSibling.style.display = "flex";
                }}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
              <Box
                sx={{
                  display: "none", width: "100%", height: "100%",
                  alignItems: "center", justifyContent: "center",
                }}
              >
                <MenuBook sx={{ fontSize: 52, color: BRAND_COLOR, opacity: 0.75 }} />
              </Box>
            </Box>

            {/* Título */}
            <Typography
              variant="subtitle1"
              fontWeight={700}
              sx={{
                lineHeight: 1.3,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                mb: 0.5,
              }}
            >
              {livro.titulo}
            </Typography>

            {/* Autor */}
            <Typography variant="body2" color="text.secondary" noWrap mb={1.5}>
              {livro.autor}
            </Typography>

            {/* Categorias */}
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              {categorias.slice(0, 2).map((cat) => (
                <Chip
                  key={cat}
                  label={cat}
                  size="small"
                  sx={{
                    background: `${BRAND_COLOR}12`,
                    color: BRAND_COLOR,
                    fontWeight: 600,
                    fontSize: 10,
                    height: 20,
                  }}
                />
              ))}
              {categorias.length > 2 && (
                <Chip
                  label={`+${categorias.length - 2}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: 10, height: 20 }}
                />
              )}
            </Stack>
          </CardContent>

          {/* Rodapé: ano + qtd */}
          <Box
            sx={{
              px: 2.5, py: 1.5,
              borderTop: "1px solid rgba(167,139,250,0.15)",
              display: "flex", justifyContent: "space-between",
              background: "rgba(167,139,250,0.04)",
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {livro.ano}
            </Typography>
            <Typography
              variant="caption"
              color={disponivel ? "success.main" : "warning.main"}
              fontWeight={600}
            >
              {livro.quantidade} disponíve{parseInt(livro.quantidade) === 1 ? "l" : "is"}
            </Typography>
          </Box>
        </CardActionArea>
      </Card>

      <BookDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        livro={livro}
        onUpdate={onUpdate}
        onRequestAuth={onRequestAuth}
      />
    </>
  );
}
