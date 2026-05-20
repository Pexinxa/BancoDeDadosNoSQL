# Biblioteca Digital

Sistema completo de gerenciamento de biblioteca digital com autenticação por roles, empréstimos com prazo automático, lista de espera, favoritos e notificações — construído com **FastAPI + Redis + React + Material UI**, orquestrado via **Docker Compose**.

**Stack:** FastAPI · Redis · React · Material UI v5 · Vite · Docker · HTTP Basic Auth

---


## Apresentação em Vídeo
https://youtu.be/8aBFedhuc60

---

##  Como Executar

> **Pré-requisito:** Docker Desktop instalado e em execução.

```bash
# Na pasta biblioteca-digital/
docker compose up --build
```

| Serviço     | URL                         |
|-------------|-----------------------------|
|  Frontend | http://localhost:5173       |
|  API      | http://localhost:5000       |
|  Swagger  | http://localhost:5000/docs  |

```bash
# Parar os containers
docker compose down

# Parar e remover volumes (Redis + capas)
docker compose down -v
```

> **Dica de armazenamento:** após um rebuild, rode `docker image prune -f` para remover imagens intermediárias e liberar espaço em disco.

---

##  Credenciais de Acesso

### Administrador padrão

| Campo   | Valor   |
|---------|---------|
| Usuário | `admin` |
| Senha   | `admin` |

O admin é recriado automaticamente a cada inicialização — mesmo que o volume Redis esteja vazio ou desatualizado.

### Usuários comuns

Crie sua conta pela tela **Criar conta** no próprio sistema. Cada usuário pode ter até **3 empréstimos simultâneos** com prazo de **10 minutos** cada.

---

##  Arquitetura

```
┌────────────────────────────────────────────────────────────────┐
│                  FRONTEND  React + Vite + MUI                  │
│                                                                │
│  /          → HomePage   (catálogo público + hero + busca)     │
│  /admin     → AdminPage  (CRUD livros, gestão usuários)        │
│  /perfil    → UserPage   (empréstimos, favoritos, notifs)      │
│                                                                │
│  AuthContext · ToastContext · api.js (Axios + HTTP Basic)      │
└────────────────────────────────────────────────────────────────┘
                           ↕ HTTP/REST  :5000
┌────────────────────────────────────────────────────────────────┐
│                     BACKEND  FastAPI                           │
│                                                                │
│  Públicas               │  Autenticadas (HTTP Basic)          │
│  ────────────────        │  ──────────────────────────         │
│  GET  /livros            │  POST /livros/{id}/emprestar        │
│  GET  /livros/{id}       │  POST /livros/{id}/devolver         │
│  POST /auth/cadastro     │  POST /livros/{id}/favoritos        │
│  GET  /auth/login        │  POST /livros/{id}/espera           │
│  GET  /covers/{arquivo}  │  GET  /usuarios/me/*                │
│                          │  POST /livros          (admin)      │
│                          │  PUT  /livros/{id}     (admin)      │
│                          │  DELETE /livros/{id}   (admin)      │
│                          │  POST /livros/upload-capa (admin)   │
│                          │  GET  /auth/usuarios   (admin)      │
│                          │  DELETE /auth/usuarios (admin)      │
└────────────────────────────────────────────────────────────────┘
                           ↕ Redis Protocol  :6379
┌────────────────────────────────────────────────────────────────┐
│                     REDIS  (DB 1)                              │
│  usuario:{username}          → hash  (credenciais + cargo)     │
│  livro:{id}                  → hash  (metadados do livro)      │
│  livro_id                    → int   (contador auto-increment)  │
│  emprestimo:{user}:{livro}   → hash  (prazo de devolução)      │
│  emprestimos_vencimento      → zset  (score = timestamp unix)  │
│  usuario:{user}:emprestimos  → set   (livro IDs ativos)        │
│  usuario:{user}:favoritos    → set   (livro IDs favoritados)   │
│  usuario:{user}:espera       → set   (livro IDs aguardados)    │
│  livro:{id}:espera           → set   (users na fila)           │
│  usuario:{user}:notificacoes → list  (JSON, ordem cronológica) │
└────────────────────────────────────────────────────────────────┘
```

---

##  Funcionalidades

### Área pública (sem login)
- Hero com slogan e barra de busca em tempo real
- Catálogo de livros em cards com capa real ou ícone fallback
- Busca por título e autor
- Modal de detalhes com sinopse, status e categorias

### Usuários autenticados
- Emprestar livros disponíveis (máximo 3 simultâneos, prazo de 10 min)
- Entrar na lista de espera quando o livro está indisponível
- Favoritar livros
- Receber notificações quando um livro da fila de espera fica disponível
- Página de perfil com abas: Empréstimos · Favoritos · Lista de Espera · Notificações
- Countdown em tempo real para devolução de cada empréstimo

### Painel Admin
- Estatísticas: total de livros, disponíveis, usuários cadastrados
- Cadastrar, editar e excluir livros (com proteção para livros com empréstimos ativos)
- Upload de capa por livro (JPEG, PNG, WebP — até 5 MB)
- Gerenciamento de usuários com exclusão (exceto o admin padrão)

---

##  Endpoints da API

### Auth

| Método | Rota                        | Descrição                     | Acesso  |
|--------|-----------------------------|-------------------------------|---------|
| POST   | `/auth/cadastro`            | Cadastrar novo usuário        | Público |
| GET    | `/auth/login`               | Login (HTTP Basic → sessão)   | Público |
| GET    | `/auth/usuarios`            | Listar todos os usuários      | Admin   |
| DELETE | `/auth/usuarios/{username}` | Excluir usuário               | Admin   |

### Livros

| Método | Rota                        | Descrição                     | Acesso  |
|--------|-----------------------------|-------------------------------|---------|
| GET    | `/livros`                   | Listar todos os livros        | Público |
| GET    | `/livros/{id}`              | Buscar livro por ID           | Público |
| POST   | `/livros`                   | Cadastrar livro               | Admin   |
| PUT    | `/livros/{id}`              | Atualizar livro               | Admin   |
| DELETE | `/livros/{id}`              | Excluir livro                 | Admin   |
| POST   | `/livros/upload-capa`       | Upload de capa (`?titulo=...`)| Admin   |
| POST   | `/livros/{id}/emprestar`    | Emprestar livro               | Usuário |
| POST   | `/livros/{id}/devolver`     | Devolver livro                | Usuário |
| POST   | `/livros/{id}/favoritos`    | Favoritar livro               | Usuário |
| DELETE | `/livros/{id}/favoritos`    | Desfavoritar livro            | Usuário |
| POST   | `/livros/{id}/espera`       | Entrar na lista de espera     | Usuário |

### Usuário (perfil)

| Método | Rota                                    | Descrição                        | Acesso  |
|--------|-----------------------------------------|----------------------------------|---------|
| GET    | `/usuarios/me/emprestimos`              | Listar empréstimos ativos        | Usuário |
| GET    | `/usuarios/me/favoritos`               | Listar favoritos                 | Usuário |
| GET    | `/usuarios/me/espera`                  | Listar lista de espera           | Usuário |
| GET    | `/usuarios/me/notificacoes`            | Listar notificações              | Usuário |
| PATCH  | `/usuarios/me/notificacoes/{i}/lida`   | Marcar notificação como lida     | Usuário |
| DELETE | `/usuarios/me/notificacoes/{i}`        | Remover notificação              | Usuário |

### Estático

| Método | Rota                | Descrição                      |
|--------|---------------------|--------------------------------|
| GET    | `/covers/{arquivo}` | Servir imagem de capa          |
| GET    | `/`                 | Health check da API            |

---

## 🖼️ Sistema de Capas

- Upload via painel admin (POST `/livros/upload-capa?titulo=...`)
- Formatos aceitos: JPEG, PNG, WebP, GIF (máx. 5 MB)
- Salvas no volume Docker mapeado em `./frontend/public/covers:/covers`
- Nome do arquivo gerado a partir do título: `titulo_do_livro.ext`
  - Caracteres especiais viram espaço, acentos são removidos, espaços múltiplos colapsam em `_` único
  - Ex: `"Mau Começo - Desventuras em Série"` → `mau_comeco_desventuras_em_serie.jpg`
- O frontend tenta `.png` primeiro e faz fallback para `.jpg` automaticamente
- Se nenhuma capa existir, exibe ícone de livro como placeholder

---

## ⏱️ Controle de Empréstimos

- Máximo de **3 livros** emprestados por usuário simultaneamente
- Prazo de **10 minutos** por empréstimo (configurável em `livro_controller.py`)
- Um job em background verifica vencimentos a cada 30 segundos e devolve livros automaticamente
- Ao devolver automaticamente, o usuário recebe uma notificação
- Usuários na lista de espera são notificados quando o livro fica disponível

---

## 🗄️ Modelagem Redis

| Chave                           | Tipo   | Conteúdo                                    |
|---------------------------------|--------|---------------------------------------------|
| `usuario:{username}`            | Hash   | `username`, `password_hash`, `cargo`        |
| `livro:{id}`                    | Hash   | `titulo`, `autor`, `categorias`, `ano`, `quantidade`, `status`, `sinopse` |
| `livro_id`                      | String | Contador inteiro auto-incrementado          |
| `emprestimo:{user}:{livro}`     | Hash   | `username`, `livro_id`, `devolucao_em`      |
| `emprestimos_vencimento`        | ZSet   | Membro `user:livro_id`, score = timestamp   |
| `usuario:{user}:emprestimos`    | Set    | IDs dos livros com empréstimo ativo         |
| `usuario:{user}:favoritos`      | Set    | IDs dos livros favoritados                  |
| `usuario:{user}:espera`         | Set    | IDs dos livros aguardados                   |
| `livro:{id}:espera`             | Set    | Usernames na fila deste livro               |
| `usuario:{user}:notificacoes`   | List   | JSON strings `{mensagem, lida}`             |

---

## ⚙️ Variáveis de Ambiente

### `docker-compose.yml` — backend

| Variável     | Padrão    | Descrição                              |
|--------------|-----------|----------------------------------------|
| `REDIS_HOST` | `redis`   | Hostname do serviço Redis              |
| `REDIS_PORT` | `6379`    | Porta do Redis                         |
| `REDIS_DB`   | `1`       | Banco Redis usado pela aplicação       |
| `COVERS_DIR` | `/covers` | Caminho interno das capas no container |

### `frontend/.env`

| Variável       | Padrão                  | Descrição                    |
|----------------|-------------------------|------------------------------|
| `VITE_API_URL` | `http://localhost:5000` | URL base da API (baked no build) |
