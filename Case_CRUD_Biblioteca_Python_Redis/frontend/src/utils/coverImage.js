/**
 * Converte o título do livro no nome do arquivo de capa.
 * Ex: "Harry Potter e a Pedra Filosofal" → "harry_potter_e_a_pedra_filosofal"
 */
export function titleToFilename(titulo = "") {
  return titulo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "_");
}

/**
 * Retorna o caminho da imagem de capa.
 * As imagens ficam em /public/covers/ e são acessadas via /covers/nome.png
 */
export function getCoverUrl(titulo = "") {
  const filename = titleToFilename(titulo);
  return `/covers/${filename}.png`;
}
