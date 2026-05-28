# NEXUS Games — Loja de Jogos (Django + Firebase)

Sistema web completo de loja de jogos digitais, desenvolvido em Django com Firebase Firestore como banco de dados NoSQL para todos os dados da aplicação. Projeto final da disciplina WEB3.

## 🚀 Stack

- **Backend:** Django 5.2+ (Python)
- **Banco NoSQL:** Firebase Firestore (usuários, produtos, categorias, compras, contatos, avaliações)
- **Frontend:** HTML5 + CSS3 puro (sem framework JS)
- **Fontes:** Russo One + Inter (Google Fonts)

## 📂 Estrutura

```
projeto-web/
├── projeto/            # configurações Django (settings, urls, wsgi)
├── app/                # app principal (loja gamer)
│   ├── views.py        # toda a lógica + CRUD via Firestore
│   ├── urls.py         # rotas (IDs Firestore como string)
│   ├── forms.py        # formulários plain (sem ModelForm customizado)
│   ├── models.py       # vazio — dados no Firestore
│   ├── middleware.py   # FirestoreUser + FirestoreAuthMiddleware
│   ├── context_processors.py  # injeta user em todos os templates
│   ├── admin.py        # vazio — sem ORM
│   ├── management/
│   │   └── commands/
│   │       └── createadmin.py  # cria o primeiro admin no Firestore
│   └── templates/      # templates HTML
├── secrets/
│   └── firebase-adminsdk.json   # ⚠️ NÃO subir ao Git
├── media/
│   └── produtos/       # capas dos jogos enviadas pelo admin
├── firebase_config.py  # inicialização segura do Firestore
├── manage.py
└── requirements.txt
```

## ⚙️ Como rodar

```bash
# 1. Ativar o ambiente virtual
.\venv\Scripts\activate

# 2. Instalar dependências
pip install -r requirements.txt

# 3. Criar o primeiro admin (salvo no Firestore)
python manage.py createadmin --username admin --email admin@nexus.com --password suasenha

# 4. Rodar o servidor (sem migrate — não há banco relacional)
python manage.py runserver
```

> Não é necessário rodar `migrate`. O projeto não utiliza nenhum banco de dados SQL.

Acesse: `http://127.0.0.1:8000`

## 🔥 Firebase

O projeto usa o **Firebase Firestore** para armazenar todos os dados da aplicação.

### Configuração das credenciais

1. No [Firebase Console](https://console.firebase.google.com), vá em **Configurações do Projeto → Contas de serviço → Gerar nova chave privada**
2. Salve o JSON gerado em:

```
secrets/firebase-adminsdk.json
```

3. Certifique-se de que o Firestore está ativo no projeto Firebase:

```
Criar um banco de dados → Cloud Firestore → Criar banco de dados
```

> **Nunca** suba a pasta `secrets/` para o GitHub. Adicione ao `.gitignore`.

### Coleções Firestore utilizadas

| Coleção | Descrição |
|---|---|
| `usuarios` | Contas de usuários (clientes e admins) |
| `produtos` | Jogos cadastrados pelo admin |
| `categorias` | Gêneros/plataformas de jogos |
| `contatos` | Mensagens do formulário público |
| `compras` | Histórico de compras dos clientes |
| `avaliacao` | Avaliações dos clientes (exibidas na Home) |

## 🗺️ Páginas

### Públicas
| Rota | Descrição |
|---|---|
| `/` | Home — hero, features e avaliações do Firebase |
| `/quem-somos/` | Apresentação da equipe |
| `/loja/` | Catálogo de jogos (Firestore) |
| `/add-contato/` | Formulário de contato |
| `/login/` | Login |
| `/cadastro/` | Criar conta (cliente) |

### Cliente (logado)
| Rota | Descrição |
|---|---|
| `/perfil/` | Perfil + histórico de compras |
| `/comprar/<id>/` | Comprar produto |
| `/avaliar/<compra_id>/` | Avaliar uma compra concluída |
| `/alterar-senha/` | Alterar senha |
| `/editar-usuario/` | Editar dados pessoais |

### Admin (`is_staff = True`)
| Rota | Descrição |
|---|---|
| `/dashboard/` | Cards de resumo: usuários, produtos, categorias, vendas, contatos, avaliações |
| `/dashboard/usuarios/` | CRUD de usuários |
| `/categoria/` | CRUD de categorias |
| `/produto/` | CRUD de produtos (jogos) com upload de capa |
| `/compras/` | Listar e excluir vendas |
| `/contato/` | Mensagens recebidas |
| `/avaliacoes/` | Avaliações do Firestore |

## ✅ Requisitos do Projeto (PDF)

- [x] Home institucional com seções: Home, Quem Somos, Produtos, Login
- [x] Hero com CTA de cadastro
- [x] Avaliações dos clientes na Home (Firebase Firestore)
- [x] Quem Somos com nome dos alunos
- [x] Produtos cadastrados pelo admin (sem API externa)
- [x] Botão **Comprar** exibido somente para usuários logados
- [x] Estoque atualizado no Firestore após cada compra
- [x] Redirecionamento para perfil após compra
- [x] Histórico de compras no perfil do cliente
- [x] Botão de avaliação por compra (apenas após compra concluída)
- [x] Avaliações salvas e lidas do Firebase Firestore
- [x] Formulário de contato público (sem login)
- [x] Páginas Criar Conta e Login com links cruzados
- [x] Menu dinâmico: nome do usuário, link de perfil e logout
- [x] Dashboard admin com 6 cards
- [x] CRUD completo: Usuários, Produtos, Categorias
- [x] Listagem com exclusão: Vendas, Contatos, Avaliações
- [x] Restrição de acesso via `@admin_required` em todas as rotas admin

## 🎮 Tema

Visual dark gamer: laranja vibrante `#ff7a00`, neon rosa e ciano, fundo escuro `#0d0d0d`.
Fontes **Russo One** para títulos e **Inter** para corpo. Animações suaves, modal de
confirmação para exclusões e layout totalmente responsivo.
