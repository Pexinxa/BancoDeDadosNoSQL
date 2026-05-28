from . import views
from django.urls import path

urlpatterns = [
    
path('produtos/', views.listarProdutosApi, name='apiProduto'),
path('produtos/<int:id>', views.listarProdutosApi, name='apiProduto'),
path('produto/cadastrar/', views.cadastrarProdutoApi, name='apiCadastrarProduto'),

path('produtos/atualizar/<int:id>/',
     views.AtualizarProdutoApi,
     name='apiAtualizarProduto'),

path('produtos/deletar/<int:id>/',
     views.deletarProdutoApi, name='deletarProduto'),



]

