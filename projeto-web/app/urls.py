from django.urls import path
from . import views

urlpatterns = [
    # ─── Páginas Públicas ────────────────────────────────────────────────────
    path('', views.index, name='index'),
    path('quem-somos/', views.quemSomos, name='quemsomos'),
    path('loja/', views.loja, name='loja'),

    # ─── Contato (público) ───────────────────────────────────────────────────
    path('add-contato/', views.addContato, name='addcontato'),

    # ─── Autenticação ────────────────────────────────────────────────────────
    path('login/', views.loginUsuario, name='login'),
    path('logout/', views.logoutUsuario, name='logout'),
    path('cadastro/', views.cadastrarUsuario, name='cadastro'),

    # ─── Conta do cliente ────────────────────────────────────────────────────
    path('perfil/', views.perfil, name='perfil'),
    path('editar-usuario/', views.editarUsuario, name='editarusuario'),
    path('alterar-senha/', views.alterarSenha, name='alterarsenha'),
    path('alterar-senha/confirma/', views.confirmarSenha, name='confirmasenha'),

    # ─── Compra (ID Firestore = string) ──────────────────────────────────────
    path('comprar/<str:id_prod>/', views.comprarProduto, name='comprar'),

    # ─── Avaliação (ID Firestore = string) ───────────────────────────────────
    path('avaliar/<str:id_compra>/', views.avaliar, name='avaliar'),

    # ─── Dashboard ───────────────────────────────────────────────────────────
    path('dashboard/', views.dashboard, name='dashboard'),

    # ─── Usuários (Admin) — IDs Firestore = string ───────────────────────────
    path('dashboard/usuarios/', views.listarUsuarios, name='usuarios'),
    path('dashboard/usuarios/add/', views.addUsuarioAdmin, name='addusuarioadmin'),
    path('dashboard/usuarios/edit/<str:id_user>/', views.editUsuarioAdmin, name='editusuarioadmin'),
    path('dashboard/usuarios/del/<str:id_user>/', views.delUsuario, name='delusuario'),

    # ─── Categoria (Admin) ───────────────────────────────────────────────────
    path('categoria/', views.listarCategoria, name='categoria'),
    path('add-categoria/', views.addCategoria, name='addcategoria'),
    path('edit-categoria/<str:id_cat>/', views.editCategoria, name='editcategoria'),
    path('del-categoria/<str:id_cat>/', views.delCategoria, name='delcategoria'),

    # ─── Produto (Admin) ─────────────────────────────────────────────────────
    path('produto/', views.listarProduto, name='produto'),
    path('add-produto/', views.addProduto, name='addproduto'),
    path('edit-produto/<str:id_prod>/', views.editProduto, name='editproduto'),
    path('del-produto/<str:id_prod>/', views.delProduto, name='delproduto'),

    # ─── Contato (Admin) ─────────────────────────────────────────────────────
    path('contato/', views.listarContato, name='contato'),
    path('del-contato/<str:id_contato>/', views.delContato, name='delcontato'),

    # ─── Compras (Admin) ─────────────────────────────────────────────────────
    path('compras/', views.listarCompras, name='compras'),
    path('compras/del/<str:id_compra>/', views.delCompra, name='delcompra'),

    # ─── Avaliações (Admin) ──────────────────────────────────────────────────
    path('avaliacoes/', views.listarAvaliacoes, name='listaravaliacoes'),
    path('avaliacoes/del/<str:id_aval>/', views.delAvaliacao, name='delavaliacao'),
]
