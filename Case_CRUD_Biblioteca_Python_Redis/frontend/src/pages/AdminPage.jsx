import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Container, Typography, Paper, Button, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, TextField, InputAdornment, Stack, Tab, Tabs, Avatar,
  Tooltip, Skeleton, Pagination, Card, CardContent, CardActions,
  Divider, useMediaQuery, useTheme,
} from "@mui/material";
import {
  Add, Delete, Search, Refresh, AdminPanelSettings,
  MenuBook, DeleteOutline, EditOutlined,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import * as api from "../services/api";
import BookForm from "../components/Books/BookForm";
import ConfirmDialog from "../components/common/ConfirmDialog";

const PAGE_SIZE = 5;

function StatBox({ label, value }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5, borderRadius: 3, flex: 1,
        border: "1px solid rgba(167,139,250,0.2)",
        textAlign: "center",
      }}
    >
      <Typography variant="h4" fontWeight={800} color="primary.main">{value}</Typography>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Paper>
  );
}

export default function AdminPage() {
  const { session, isAdmin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [tab, setTab] = useState(0);

  const [livros, setLivros] = useState([]);
  const [livrosLoading, setLivrosLoading] = useState(true);
  const [livroSearch, setLivroSearch] = useState("");
  const [livroPage, setLivroPage] = useState(1);
  const [bookFormOpen, setBookFormOpen] = useState(false);
  const [livroEdit, setLivroEdit] = useState(null);

  const [usuarios, setUsuarios] = useState([]);
  const [usuariosLoading, setUsuariosLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);

  const [confirm, setConfirm] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const carregarLivros = useCallback(async () => {
    setLivrosLoading(true);
    try { setLivros(await api.listarLivros()); }
    catch { showToast("Erro ao carregar livros", "error"); }
    finally { setLivrosLoading(false); }
  }, []);

  const carregarUsuarios = useCallback(async () => {
    setUsuariosLoading(true);
    try { setUsuarios(await api.listarUsuarios(session)); }
    catch { showToast("Erro ao carregar usuários", "error"); }
    finally { setUsuariosLoading(false); }
  }, [session]);

  useEffect(() => {
    if (!isAdmin) { navigate("/"); return; }
    carregarLivros();
  }, [isAdmin, navigate, carregarLivros]);

  useEffect(() => {
    if (tab === 1) carregarUsuarios();
  }, [tab, carregarUsuarios]);

  const livrosFiltrados = livros.filter((l) =>
    !livroSearch ||
    l.titulo?.toLowerCase().includes(livroSearch.toLowerCase()) ||
    l.autor?.toLowerCase().includes(livroSearch.toLowerCase())
  );
  const totalPages    = Math.max(1, Math.ceil(livrosFiltrados.length / PAGE_SIZE));
  const livrosPaginados = livrosFiltrados.slice((livroPage - 1) * PAGE_SIZE, livroPage * PAGE_SIZE);

  const usuariosFiltrados = usuarios.filter((u) =>
    !userSearch || u.username?.toLowerCase().includes(userSearch.toLowerCase())
  );
  const totalUserPages  = Math.max(1, Math.ceil(usuariosFiltrados.length / PAGE_SIZE));
  const usuariosPaginados = usuariosFiltrados.slice((userPage - 1) * PAGE_SIZE, userPage * PAGE_SIZE);

  const handleCriarLivro  = async (data) => { await api.criarLivro(data, session); showToast("Livro criado!", "success"); carregarLivros(); };
  const handleEditarLivro = async (data) => { await api.atualizarLivro(livroEdit.id, data, session); showToast("Livro atualizado!", "success"); carregarLivros(); };

  const confirmarDeletar = (livro) => setConfirm({
    title: "Excluir Livro",
    message: `Deseja excluir permanentemente "${livro.titulo}"? Esta ação não pode ser desfeita.`,
    confirmLabel: "Excluir", confirmColor: "error", icon: <DeleteOutline />,
    action: async () => { await api.deletarLivro(livro.id, session); showToast(`"${livro.titulo}" excluído`, "info"); carregarLivros(); },
  });

  const confirmarDeletarUser = (username) => setConfirm({
    title: "Excluir Usuário",
    message: `Deseja excluir o usuário "${username}"? Todos os dados serão removidos.`,
    confirmLabel: "Excluir", confirmColor: "error", icon: <DeleteOutline />,
    action: async () => { await api.deletarUsuario(username, session); showToast(`Usuário "${username}" excluído`, "info"); carregarUsuarios(); },
  });

  const runConfirm = async () => {
    if (!confirm?.action) return;
    setConfirmLoading(true);
    try { await confirm.action(); }
    catch (err) { showToast(err.response?.data?.detail || "Erro ao executar ação", "error"); }
    finally { setConfirmLoading(false); setConfirm(null); }
  };

  if (!isAdmin) return null;

  const disponiveis = livros.filter((l) => l.status === "Disponivel").length;

  const parseCats = (livro) =>
    Array.isArray(livro.categorias)
      ? livro.categorias
      : (livro.categoria || "").split(",").map((c) => c.trim()).filter(Boolean);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>

      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Avatar sx={{ bgcolor: "secondary.main", width: { xs: 40, md: 48 }, height: { xs: 40, md: 48 } }}>
          <AdminPanelSettings />
        </Avatar>
        <Box>
          <Typography variant={{ xs: "h6", md: "h5" }} fontWeight={800}>Painel Administrativo</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: "none", sm: "block" } }}>
            Gerencie livros e usuários da biblioteca
          </Typography>
        </Box>
      </Box>

      {/* Stats */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <StatBox label="Total de livros" value={livros.length} />
        <StatBox label="Disponíveis" value={disponiveis} />
        <StatBox label="Usuários" value={usuarios.length} />
      </Stack>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 3, "& .MuiTabs-indicator": { height: 3, borderRadius: 2 } }}
      >
        <Tab label="Livros" />
        <Tab label="Usuários" />
      </Tabs>

      {/* ── ABA LIVROS ── */}
      {tab === 0 && (
        <Paper elevation={0} sx={{ borderRadius: 4, border: "1px solid rgba(167,139,250,0.2)" }}>
          {/* Toolbar */}
          <Box sx={{ p: 2, display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
            <TextField
              placeholder="Buscar livro..."
              value={livroSearch}
              onChange={(e) => { setLivroSearch(e.target.value); setLivroPage(1); }}
              size="small"
              sx={{ flex: 1, minWidth: 160 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
              }}
            />
            <Tooltip title="Atualizar">
              <IconButton onClick={carregarLivros} size="small"><Refresh /></IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<Add />}
              size={isMobile ? "small" : "medium"}
              onClick={() => { setLivroEdit(null); setBookFormOpen(true); }}
            >
              {isMobile ? "Novo" : "Novo Livro"}
            </Button>
          </Box>

          <Divider />

          {/* Mobile: cards */}
          {isMobile ? (
            <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
              {livrosLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} variant="rounded" height={130} sx={{ borderRadius: 3 }} />
                ))
                : livrosPaginados.length === 0
                  ? (
                    <Box sx={{ textAlign: "center", py: 6, color: "text.secondary" }}>
                      <MenuBook sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} />
                      <Typography variant="body2">Nenhum livro encontrado</Typography>
                    </Box>
                  )
                  : livrosPaginados.map((livro) => {
                    const cats = parseCats(livro);
                    return (
                      <Card
                        key={livro.id}
                        elevation={0}
                        sx={{ borderRadius: 3, border: "1px solid rgba(167,139,250,0.2)" }}
                      >
                        <CardContent sx={{ pb: 1 }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 0.5 }}>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1, pr: 1 }}>
                              {livro.titulo}
                            </Typography>
                            <Chip
                              label={livro.status}
                              size="small"
                              color={livro.status === "Disponivel" ? "success" : "warning"}
                              sx={{ fontSize: 10, height: 20, flexShrink: 0 }}
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary" mb={1}>{livro.autor}</Typography>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap mb={0.5}>
                            {cats.slice(0, 2).map((c) => (
                              <Chip key={c} label={c} size="small" variant="outlined" sx={{ fontSize: 10, height: 20 }} />
                            ))}
                            {cats.length > 2 && (
                              <Chip label={`+${cats.length - 2}`} size="small" sx={{ fontSize: 10, height: 20 }} />
                            )}
                          </Stack>
                          <Typography variant="caption" color="text.disabled">
                            {livro.ano} · {livro.quantidade} disponíve{parseInt(livro.quantidade) === 1 ? "l" : "is"}
                          </Typography>
                        </CardContent>
                        <CardActions sx={{ px: 2, pb: 1.5, pt: 0, gap: 1 }}>
                          <Button
                            size="small" startIcon={<EditOutlined fontSize="small" />}
                            onClick={() => { setLivroEdit(livro); setBookFormOpen(true); }}
                          >
                            Editar
                          </Button>
                          <Button
                            size="small" color="error" startIcon={<Delete fontSize="small" />}
                            onClick={() => confirmarDeletar(livro)}
                          >
                            Excluir
                          </Button>
                        </CardActions>
                      </Card>
                    );
                  })
              }
            </Box>
          ) : (
            /* Desktop: tabela */
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Título</TableCell>
                    <TableCell>Autor</TableCell>
                    <TableCell>Categorias</TableCell>
                    <TableCell>Ano</TableCell>
                    <TableCell align="center">Qtd</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="right">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {livrosLoading
                    ? Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 7 }).map((__, j) => (
                          <TableCell key={j}><Skeleton width="80%" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                    : livrosPaginados.map((livro) => {
                      const cats = parseCats(livro);
                      return (
                        <TableRow key={livro.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 200 }}>
                              {livro.titulo}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 150 }}>
                              {livro.autor}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={0.5} flexWrap="wrap">
                              {cats.slice(0, 2).map((c) => (
                                <Chip key={c} label={c} size="small" variant="outlined" sx={{ fontSize: 10, height: 20 }} />
                              ))}
                              {cats.length > 2 && (
                                <Chip label={`+${cats.length - 2}`} size="small" sx={{ fontSize: 10, height: 20 }} />
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell>{livro.ano}</TableCell>
                          <TableCell align="center">{livro.quantidade}</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={livro.status}
                              size="small"
                              color={livro.status === "Disponivel" ? "success" : "warning"}
                              sx={{ fontSize: 11 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                              <Tooltip title="Editar">
                                <IconButton size="small" onClick={() => { setLivroEdit(livro); setBookFormOpen(true); }}>
                                  <EditOutlined fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Excluir">
                                <IconButton size="small" color="error" onClick={() => confirmarDeletar(livro)}>
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  }
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Paginação livros */}
          {!livrosLoading && livrosFiltrados.length > PAGE_SIZE && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
              <Pagination
                count={totalPages} page={livroPage}
                onChange={(_, p) => setLivroPage(p)}
                color="primary" size={isMobile ? "small" : "medium"}
              />
            </Box>
          )}
        </Paper>
      )}

      {/* ── ABA USUÁRIOS ── */}
      {tab === 1 && (
        <Paper elevation={0} sx={{ borderRadius: 4, border: "1px solid rgba(167,139,250,0.2)" }}>
          {/* Toolbar */}
          <Box sx={{ p: 2, display: "flex", gap: 1.5, alignItems: "center" }}>
            <TextField
              placeholder="Buscar usuário..."
              value={userSearch}
              onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
              size="small"
              sx={{ flex: 1, maxWidth: 320 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
              }}
            />
            <Tooltip title="Atualizar">
              <IconButton onClick={carregarUsuarios} size="small"><Refresh /></IconButton>
            </Tooltip>
          </Box>

          <Divider />

          {/* Mobile: cards */}
          {isMobile ? (
            <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
              {usuariosLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} variant="rounded" height={80} sx={{ borderRadius: 3 }} />
                ))
                : usuariosPaginados.map((u) => (
                  <Card
                    key={u.username}
                    elevation={0}
                    sx={{ borderRadius: 3, border: "1px solid rgba(167,139,250,0.2)" }}
                  >
                    <CardContent sx={{ pb: "12px !important" }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Avatar
                            sx={{
                              width: 38, height: 38, fontWeight: 700, fontSize: 14,
                              bgcolor: u.cargo === "Admin" ? "secondary.main" : "primary.main",
                            }}
                          >
                            {u.username[0].toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={700}>{u.username}</Typography>
                            <Chip
                              label={u.cargo}
                              size="small"
                              color={u.cargo === "Admin" ? "secondary" : "default"}
                              sx={{ fontSize: 10, height: 18, mt: 0.25 }}
                            />
                          </Box>
                        </Box>
                        {u.username !== "admin" && (
                          <IconButton size="small" color="error" onClick={() => confirmarDeletarUser(u.username)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                ))
              }
            </Box>
          ) : (
            /* Desktop: tabela */
            <TableContainer>
              <Table sx={{ "& tbody tr:last-child td, & tbody tr:last-child th": { borderBottom: 0 } }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Usuário</TableCell>
                    <TableCell>Cargo</TableCell>
                    <TableCell align="right">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {usuariosLoading
                    ? Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        {[1, 2, 3].map((j) => <TableCell key={j}><Skeleton /></TableCell>)}
                      </TableRow>
                    ))
                    : usuariosPaginados.map((u) => (
                      <TableRow key={u.username} hover>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Avatar
                              sx={{
                                width: 32, height: 32,
                                bgcolor: u.cargo === "Admin" ? "secondary.main" : "primary.main",
                                fontSize: 13, fontWeight: 700,
                              }}
                            >
                              {u.username[0].toUpperCase()}
                            </Avatar>
                            <Typography variant="body2" fontWeight={600}>{u.username}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={u.cargo} size="small"
                            color={u.cargo === "Admin" ? "secondary" : "default"}
                            sx={{ fontSize: 11 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          {u.username !== "admin" && (
                            <Tooltip title="Excluir usuário">
                              <IconButton size="small" color="error" onClick={() => confirmarDeletarUser(u.username)}>
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  }
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Paginação usuários */}
          {!usuariosLoading && usuariosFiltrados.length > PAGE_SIZE && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
              <Pagination
                count={totalUserPages} page={userPage}
                onChange={(_, p) => setUserPage(p)}
                color="primary" size={isMobile ? "small" : "medium"}
              />
            </Box>
          )}
        </Paper>
      )}

      {/* BookForm */}
      <BookForm
        open={bookFormOpen}
        onClose={() => { setBookFormOpen(false); setLivroEdit(null); }}
        onSave={livroEdit ? handleEditarLivro : handleCriarLivro}
        livro={livroEdit}
      />

      {/* ConfirmDialog */}
      {confirm && (
        <ConfirmDialog
          open={Boolean(confirm)}
          onClose={() => setConfirm(null)}
          onConfirm={runConfirm}
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          confirmColor={confirm.confirmColor}
          icon={confirm.icon}
          loading={confirmLoading}
        />
      )}
    </Container>
  );
}
