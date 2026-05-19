# 📚 Biblioteca Digital

Sistema de gerenciamento de biblioteca digital com autenticação por roles, upload de capas e controle de empréstimos — construído com **FastAPI + Redis + React + Tailwind CSS**, orquestrado via **Docker Compose**.

**Stack:** FastAPI · Redis · React · Tailwind CSS · Docker · JWT

---

## 🚀 Como Executar

> **Pré-requisito:** Docker Desktop instalado e em execução.

```bash
# Na pasta biblioteca-digital/
docker compose up --build
```

| Serviço      | URL                          |
|--------------|------------------------------|
| 🌐 Frontend  | http://localhost:5173        |
| ⚙️ API       | http://localhost:8000        |
| 📖 Swagger   | http://localhost:8000/docs   |

Para parar:

```bash
docker compose down
```

Para remover também os volumes (Redis + capas):

```bash
docker compose down -v
```

---

## 🔑 Credenciais de Acesso

### Administrador (hardcoded)

| Campo  | Valor                  |
|--------|------------------------|
| E-mail | `admin@biblioteca.com` |
| Senha  | `admin123`             |

> O admin tem acesso completo: cadastro, edição, exclusão de livros, upload de capas e dashboard de estatísticas.

### Usuários comuns

Crie sua conta pela tela **Criar conta** no próprio sistema.  
Cada usuário pode ter até **3 empréstimos simultâneos**.

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                       FRONTEND (React + Vite)               │
│                                                             │
│  Área Pública              │  Área Admin (JWT)              │
│  ──────────────────        │  ─────────────────────         │
│  / → Catálogo              │  /admin → Dashboard            │
│  /auth → Login/Cadastro    │  /admin/editar/:id → Editar    │
│                                                             │
│  AuthContext · api.js (Axios + interceptor JWT)             │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│                       BACKEND (FastAPI)                     │
│                                                             │
│  Rotas Públicas            │  Rotas Protegidas (Bearer)     │
│  ──────────────────        │  ──────────────────────────    │
│  GET  /livros              │  POST /livros/{id}/emprestar   │
│  GET  /livros/{id}         │  POST /livros/{id}/devolver    │
│  POST /auth/register       │  GET  /meus-emprestimos        │
│  POST /auth/login          │  GET  /admin/estatisticas      │
│                            │  PUT  /admin/livros/{id}       │
│                            │  DELETE /admin/livros/{id}     │
│                            │  POST /admin/livros/{id}/cover │
│                                                             │
│  config.py · database.py · models.py                        │
│  repository.py · auth.py · main.py                          │
└─────────────────────────────────────────────────────────────┘
                            ↕ Redis Protocol
┌─────────────────────────────────────────────────────────────┐
│                       REDIS                                 │
│  livro:{id} → JSON          livros:index → Set              │
│  usuario:{id} → JSON        usuarios:index → Set            │
│  emprestimos:usuario:{id} → Set (IDs dos livros)            │
│  livro:emprestado_por:{id} → String (user_id)               │
└─────────────────────────────────────────────────────────────┘
```

---

## Funcionalidades

### Área Pública (sem login)
- Hero com barra de busca em tempo real
- Catálogo em cards com foto de capa (ou gradiente por categoria)
- Filtro por categoria com abas
- Paginação

### Usuários autenticados
- Emprestar livros disponíveis (máximo 3 simultâneos)
- Devolver livros emprestados
- Contador de empréstimos ativos no topo do catálogo

### Painel Admin
- Dashboard com estatísticas (total de livros, disponíveis, emprestados, categorias)
- Cadastrar, editar e excluir livros
- Upload de capa por livro (JPEG, PNG, WebP — até 5 MB)
- Botões de ação direto nos cards do catálogo

---

## Roles e Permissões

| Ação                         | Guest | Usuário | Admin |
|------------------------------|:-----:|:-------:|:-----:|
| Ver catálogo                 | ✅    | ✅      | ✅    |
| Buscar e filtrar livros      | ✅    | ✅      | ✅    |
| Criar conta / fazer login    | ✅    | —       | —     |
| Emprestar livro              | ❌    | ✅      | ❌    |
| Devolver livro               | ❌    | ✅      | ✅    |
| Ver meus empréstimos         | ❌    | ✅      | ✅    |
| Cadastrar livro              | ❌    | ❌      | ✅    |
| Editar livro                 | ❌    | ❌      | ✅    |
| Excluir livro                | ❌    | ❌      | ✅    |
| Upload de capa               | ❌    | ❌      | ✅    |
| Ver estatísticas (dashboard) | ❌    | ❌      | ✅    |

---

## Endpoints da API

### Auth

| Método | Rota             | Descrição                          | Acesso  |
|--------|------------------|------------------------------------|---------|
| POST   | `/auth/register` | Cadastrar novo usuário             | Público |
| POST   | `/auth/login`    | Login (`{email, password}` → JWT)  | Público |

### Livros

| Método | Rota           | Descrição                           | Acesso  |
|--------|----------------|-------------------------------------|---------|
| GET    | `/livros`      | Listar (paginação, busca, filtros)  | Público |
| GET    | `/livros/{id}` | Buscar livro por ID                 | Público |
| POST   | `/livros`      | Cadastrar livro                     | Público |

### Empréstimos

| Método | Rota                      | Descrição                       | Acesso  |
|--------|---------------------------|---------------------------------|---------|
| POST   | `/livros/{id}/emprestar`  | Emprestar livro                 | Usuário |
| POST   | `/livros/{id}/devolver`   | Devolver livro                  | Usuário |
| GET    | `/meus-emprestimos`       | Listar meus empréstimos ativos  | Usuário |

### Admin

| Método | Rota                        | Descrição                       | Acesso |
|--------|-----------------------------|---------------------------------|--------|
| GET    | `/admin/estatisticas`       | Estatísticas gerais do acervo   | Admin  |
| PUT    | `/admin/livros/{id}`        | Atualizar livro                 | Admin  |
| DELETE | `/admin/livros/{id}`        | Excluir livro                   | Admin  |
| POST   | `/admin/livros/{id}/cover`  | Upload de capa (multipart/form) | Admin  |

### Outros

| Método | Rota               | Descrição                        |
|--------|--------------------|----------------------------------|
| GET    | `/health`          | Status da API e conexão Redis    |
| GET    | `/covers/{arquivo}`| Servir imagem de capa estática   |

---

## Sistema de Capas

- Upload via formulário de edição (painel admin)
- Formatos aceitos: JPEG, PNG, WebP, GIF
- Tamanho máximo: **5 MB**
- Armazenadas no volume Docker `covers_data`, servidas em `/covers/{livro_id}.{ext}`
- O catálogo exibe a capa real quando disponível; caso contrário, exibe gradiente colorido por categoria

---

## Controle de Empréstimos

- Cada usuário pode ter no máximo **3 livros emprestados** ao mesmo tempo
- O contador é exibido no topo do catálogo: `Seus empréstimos: X/3`
- Ao atingir o limite, o botão "Emprestar" fica desabilitado
- O usuário só pode devolver livros que ele mesmo pegou emprestado
- Admins podem devolver qualquer livro

---

## Modelagem Redis

| Chave                         | Tipo   | Conteúdo                           |
|-------------------------------|--------|------------------------------------|
| `livro:{id}`                  | String | JSON com todos os campos do livro  |
| `livros:index`                | Set    | Todos os IDs de livros             |
| `livro:emprestado_por:{id}`   | String | user_id de quem emprestou          |
| `usuario:{id}`                | String | JSON com dados do usuário          |
| `usuarios:email:{email}`      | String | ID do usuário (índice de lookup)   |
| `usuarios:index`              | Set    | Todos os IDs de usuários           |
| `emprestimos:usuario:{id}`    | Set    | IDs dos livros emprestados         |

**Campos do livro:**

| Campo                   | Tipo   | Regras                       |
|-------------------------|--------|------------------------------|
| `id`                    | UUID4  | Gerado automaticamente       |
| `titulo`                | string | 1–200 chars                  |
| `autor`                 | string | 1–150 chars                  |
| `categoria`             | string | 1–100 chars                  |
| `ano_publicacao`        | int    | 1000–2100                    |
| `quantidade_disponivel` | int    | ≥ 0                          |
| `status`                | enum   | `"Disponível"` / `"Emprestado"` |
| `capa_url`              | string | Caminho da imagem (opcional) |
| `emprestado_por`        | string | Nome do usuário (opcional)   |
| `criado_em`             | ISO 8601 | Automático                 |
| `atualizado_em`         | ISO 8601 | Atualizado a cada PUT      |

---
