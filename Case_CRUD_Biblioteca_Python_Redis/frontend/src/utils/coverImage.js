const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Converte o título do livro no nome do arquivo de capa.
 * Ex: "Harry Potter e a Pedra Filosofal" → "harry_potter_e_a_pedra_filosofal"
 */
export function titleToFilename(titulo = "") {
  return titulo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")   // remove acentos (range explícito, mais seguro)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, " ")      // especiais → espaço (igual ao Python)
    .replace(/\s+/g, "_")              // colapsa espaços → underscore único
    .replace(/_+/g, "_")               // garante nunca __ duplo
    .replace(/^_|_$/g, "");            // remove underscore no início/fim
}

/**
 * Retorna a URL primária da capa (.png) — servida pelo backend.
 */
export function getCoverUrl(titulo = "") {
  const filename = titleToFilename(titulo);
  return `${API_BASE}/covers/${filename}.png`;
}

/**
 * Retorna a lista de URLs a tentar em ordem (png → jpg → webp).
 * O componente de imagem tenta cada uma antes de mostrar o ícone.
 */
export function getCoverUrlList(titulo = "") {
  const filename = titleToFilename(titulo);
  return [
    `${API_BASE}/covers/${filename}.png`,
    `${API_BASE}/covers/${filename}.jpg`,
    `${API_BASE}/covers/${filename}.webp`,
  ];
}

/** Atalho: URL primária (.png) */
export function getCoverFallbackUrl(titulo = "") {
  const filename = titleToFilename(titulo);
  return `${API_BASE}/covers/${filename}.jpg`;
}
