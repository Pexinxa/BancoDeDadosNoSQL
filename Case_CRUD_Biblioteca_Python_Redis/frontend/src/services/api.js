import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function buildHeaders(session) {
  const headers = { "Content-Type": "application/json" };
  if (session?.token) {
    headers["Authorization"] = `Basic ${session.token}`;
  }
  return headers;
}

const api = axios.create({ baseURL: BASE_URL });

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function cadastrar(username, password) {
  const res = await api.post("/auth/cadastro", { username, password });
  return res.data;
}

export async function login(username, password) {
  const token = btoa(`${username}:${password}`);
  const res = await api.get("/auth/login", {
    headers: { Authorization: `Basic ${token}` },
  });
  return { ...res.data, token };
}

export async function listarUsuarios(session) {
  const res = await api.get("/auth/usuarios", { headers: buildHeaders(session) });
  return res.data;
}

export async function deletarUsuario(username, session) {
  const res = await api.delete(`/auth/usuarios/${username}`, {
    headers: buildHeaders(session),
  });
  return res.data;
}

// ── Livros ────────────────────────────────────────────────────────────────────

export async function listarLivros() {
  const res = await api.get("/livros");
  return res.data;
}

export async function buscarLivro(id) {
  const res = await api.get(`/livros/${id}`);
  return res.data;
}

export async function criarLivro(data, session) {
  const res = await api.post("/livros", data, { headers: buildHeaders(session) });
  return res.data;
}

export async function atualizarLivro(id, data, session) {
  const res = await api.put(`/livros/${id}`, data, { headers: buildHeaders(session) });
  return res.data;
}

export async function deletarLivro(id, session) {
  const res = await api.delete(`/livros/${id}`, { headers: buildHeaders(session) });
  return res.data;
}

export async function uploadCapa(titulo, file, session) {
  const formData = new FormData();
  formData.append("file", file);   // só o arquivo — titulo vai como query param
  const res = await api.post("/livros/upload-capa", formData, {
    headers: {
      Authorization: session?.token ? `Basic ${session.token}` : undefined,
      // Content-Type é definido automaticamente pelo axios (multipart/form-data + boundary)
    },
    params: { titulo },
  });
  return res.data;
}

// ── Empréstimos ───────────────────────────────────────────────────────────────

export async function emprestar(livroId, session) {
  const res = await api.post(`/livros/${livroId}/emprestar`, {}, {
    headers: buildHeaders(session),
  });
  return res.data;
}

export async function devolver(livroId, session) {
  const res = await api.post(`/livros/${livroId}/devolver`, {}, {
    headers: buildHeaders(session),
  });
  return res.data;
}

// ── Favoritos ─────────────────────────────────────────────────────────────────

export async function favoritar(livroId, session) {
  const res = await api.post(`/livros/${livroId}/favoritos`, {}, {
    headers: buildHeaders(session),
  });
  return res.data;
}

export async function removerFavorito(livroId, session) {
  const res = await api.delete(`/livros/${livroId}/favoritos`, {
    headers: buildHeaders(session),
  });
  return res.data;
}

// ── Lista de espera ───────────────────────────────────────────────────────────

export async function entrarEspera(livroId, session) {
  const res = await api.post(`/livros/${livroId}/espera`, {}, {
    headers: buildHeaders(session),
  });
  return res.data;
}

// ── Perfil do usuário ─────────────────────────────────────────────────────────

export async function listarEmprestimos(session) {
  const res = await api.get("/usuarios/me/emprestimos", { headers: buildHeaders(session) });
  return res.data;
}

export async function listarFavoritos(session) {
  const res = await api.get("/usuarios/me/favoritos", { headers: buildHeaders(session) });
  return res.data;
}

export async function listarEspera(session) {
  const res = await api.get("/usuarios/me/espera", { headers: buildHeaders(session) });
  return res.data;
}

export async function listarNotificacoes(session) {
  const res = await api.get("/usuarios/me/notificacoes", { headers: buildHeaders(session) });
  return res.data;
}

export async function marcarNotificacaoLida(index, session) {
  const res = await api.patch(`/usuarios/me/notificacoes/${index}/lida`, {}, {
    headers: buildHeaders(session),
  });
  return res.data;
}

export async function removerNotificacao(index, session) {
  const res = await api.delete(`/usuarios/me/notificacoes/${index}`, {
    headers: buildHeaders(session),
  });
  return res.data;
}
