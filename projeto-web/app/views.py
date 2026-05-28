from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth.hashers import make_password, check_password
from django.http import Http404
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from functools import wraps
from datetime import datetime, timezone
import os

from app.forms import (
    FormUsuario, FormEditarUsuario, FormAlterarSenha,
    FormAdminUsuario, FormEditarUsuarioAdmin,
    FormCategoria, FormContato, ProdutoForm,
)
from firebase_config import db


# ╔══════════════════════════════════════════════════════════╗
# ║          DECORATORS                                      ║
# ╚══════════════════════════════════════════════════════════╝

def login_required(view_func):
    @wraps(view_func)
    def _wrapped(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect('login')
        return view_func(request, *args, **kwargs)
    return _wrapped


def admin_required(view_func):
    @wraps(view_func)
    def _wrapped(request, *args, **kwargs):
        if not request.user.is_authenticated or not request.user.is_staff:
            return redirect('login')
        return view_func(request, *args, **kwargs)
    return _wrapped


# ╔══════════════════════════════════════════════════════════╗
# ║          HELPERS                                         ║
# ╚══════════════════════════════════════════════════════════╝

def _doc_to_dict(doc):
    d = doc.to_dict() or {}
    d['id'] = doc.id
    return d


def _listar_categorias():
    return [_doc_to_dict(doc) for doc in db.collection('categorias').order_by('nome').stream()]


def _salvar_imagem(arquivo):
    if not arquivo:
        return ''
    nome_base = os.path.basename(arquivo.name)
    caminho = default_storage.save(f'produtos/{nome_base}', ContentFile(arquivo.read()))
    return settings.MEDIA_URL + caminho


def buscar_avaliacoes_firebase():
    avaliacoes = []
    try:
        for doc in db.collection('avaliacao').stream():
            d = doc.to_dict()
            d['id'] = doc.id
            avaliacoes.append(d)
    except Exception as e:
        print('Erro Firebase (avaliações):', e)
    return avaliacoes


def _count_collection(nome):
    try:
        return sum(1 for _ in db.collection(nome).stream())
    except Exception:
        return 0


# ╔══════════════════════════════════════════════════════════╗
# ║          AUTENTICAÇÃO (Firestore)                        ║
# ╚══════════════════════════════════════════════════════════╝

def loginUsuario(request):
    if request.user.is_authenticated:
        return redirect('index')

    if request.method == 'POST':
        username = request.POST.get('username', '').strip()
        password = request.POST.get('password', '')

        docs = list(db.collection('usuarios').where('username', '==', username).stream())
        if docs:
            user_data = docs[0].to_dict()
            user_data['id'] = docs[0].id
            if check_password(password, user_data.get('password', '')):
                request.session['_auth_user_id'] = user_data['id']
                return redirect('index')

        return render(request, 'login.html', {'erro': 'Usuário ou senha inválidos.'})

    return render(request, 'login.html')


def logoutUsuario(request):
    request.session.pop('_auth_user_id', None)
    return redirect('login')


def cadastrarUsuario(request):
    form = FormUsuario(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        username = form.cleaned_data['username'].strip()

        # Verifica duplicidade
        existing = list(db.collection('usuarios').where('username', '==', username).stream())
        if existing:
            form.add_error('username', 'Este nome de usuário já está em uso.')
        else:
            db.collection('usuarios').add({
                'username':  username,
                'email':     form.cleaned_data.get('email', ''),
                'password':  make_password(form.cleaned_data['password1']),
                'is_staff':  False,
                'is_admin':  False,
                'criado_em': datetime.now(timezone.utc),
            })
            messages.success(request, 'Conta criada com sucesso! Faça login.')
            return redirect('login')

    return render(request, 'cadastro.html', {'form': form})


@login_required
def editarUsuario(request):
    if request.method == 'POST':
        form = FormEditarUsuario(request.POST)
        if form.is_valid():
            new_username = form.cleaned_data['username'].strip()
            # Verifica se novo username já existe (em outro usuário)
            docs = list(db.collection('usuarios').where('username', '==', new_username).stream())
            conflito = any(d.id != request.user.id for d in docs)
            if conflito:
                form.add_error('username', 'Este nome de usuário já está em uso.')
            else:
                db.collection('usuarios').document(request.user.id).update({
                    'username': new_username,
                    'email':    form.cleaned_data.get('email', ''),
                })
                messages.success(request, 'Perfil atualizado!')
                return redirect('perfil')
    else:
        form = FormEditarUsuario(initial={
            'username': request.user.username,
            'email':    request.user.email,
        })

    return render(request, 'edit-usuario.html', {'form': form})


@login_required
def alterarSenha(request):
    if request.method == 'POST':
        form = FormAlterarSenha(request.POST)
        if form.is_valid():
            # Busca o hash atual do usuário no Firestore
            doc = db.collection('usuarios').document(request.user.id).get()
            if not doc.exists:
                raise Http404
            user_data = doc.to_dict()

            senha_antiga = form.cleaned_data['senha_antiga']
            if not check_password(senha_antiga, user_data.get('password', '')):
                form.add_error('senha_antiga', 'Senha atual incorreta.')
            else:
                db.collection('usuarios').document(request.user.id).update({
                    'password': make_password(form.cleaned_data['nova_senha'])
                })
                return redirect('confirmasenha')
    else:
        form = FormAlterarSenha()

    return render(request, 'alterar-senha.html', {'form': form})


@login_required
def confirmarSenha(request):
    return render(request, 'confirma-senha.html')


# ╔══════════════════════════════════════════════════════════╗
# ║          PÁGINAS PÚBLICAS                                ║
# ╚══════════════════════════════════════════════════════════╝

def index(request):
    avaliacoes = buscar_avaliacoes_firebase()
    return render(request, 'index.html', {'avaliacoes': avaliacoes[:6]})


def quemSomos(request):
    return render(request, 'quem-somos.html')


def loja(request):
    produtos = [_doc_to_dict(doc) for doc in db.collection('produtos').order_by('nome').stream()]
    return render(request, 'loja.html', {'produtos': produtos})


def addContato(request):
    form = FormContato(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        db.collection('contatos').add({
            'nome':      form.cleaned_data['nome'],
            'email':     form.cleaned_data['email'],
            'assunto':   form.cleaned_data['assunto'],
            'mensagem':  form.cleaned_data['mensagem'],
            'criado_em': datetime.now(timezone.utc),
        })
        messages.success(request, 'Mensagem enviada! Logo entraremos em contato.')
        return redirect('addcontato')
    return render(request, 'add-contato.html', {'form': form})


# ╔══════════════════════════════════════════════════════════╗
# ║          PERFIL DO CLIENTE                               ║
# ╚══════════════════════════════════════════════════════════╝

@login_required
def perfil(request):
    docs = db.collection('compras').where('cliente_id', '==', request.user.id).stream()
    compras = [_doc_to_dict(doc) for doc in docs]
    compras.sort(
        key=lambda x: x.get('data') or datetime.min.replace(tzinfo=timezone.utc),
        reverse=True,
    )
    return render(request, 'perfil.html', {'compras': compras})


# ╔══════════════════════════════════════════════════════════╗
# ║          COMPRA                                          ║
# ╚══════════════════════════════════════════════════════════╝

@login_required
def comprarProduto(request, id_prod):
    doc = db.collection('produtos').document(id_prod).get()
    if not doc.exists:
        raise Http404('Produto não encontrado.')

    produto = _doc_to_dict(doc)
    if produto.get('quantidade', 0) <= 0:
        messages.error(request, 'Produto fora de estoque.')
        return redirect('loja')

    db.collection('produtos').document(id_prod).update(
        {'quantidade': produto['quantidade'] - 1}
    )
    db.collection('compras').add({
        'cliente_id':     request.user.id,
        'cliente_nome':   request.user.username,
        'produto_id':     id_prod,
        'nome_produto':   produto.get('nome', ''),
        'imagem_produto': produto.get('imagem_url', ''),
        'preco':          float(produto.get('preco', 0)),
        'quantidade':     1,
        'data':           datetime.now(timezone.utc),
        'avaliada':       False,
    })
    messages.success(request, f"Compra de '{produto.get('nome')}' concluída!")
    return redirect('perfil')


# ╔══════════════════════════════════════════════════════════╗
# ║          AVALIAÇÃO (Firebase)                            ║
# ╚══════════════════════════════════════════════════════════╝

@login_required
def avaliar(request, id_compra):
    doc = db.collection('compras').document(id_compra).get()
    if not doc.exists:
        raise Http404
    compra = _doc_to_dict(doc)
    if compra.get('cliente_id') != request.user.id:
        raise Http404

    if request.method == 'POST':
        nota      = request.POST.get('nota')
        comentario = request.POST.get('comentario', '')
        nome      = request.POST.get('nome') or request.user.username
        try:
            db.collection('avaliacao').add({
                'cliente':    nome,
                'usuario_id': request.user.id,
                'produto':    compra.get('nome_produto', ''),
                'comentario': comentario,
                'nota':       int(nota) if nota else 5,
            })
            db.collection('compras').document(id_compra).update({'avaliada': True})
            messages.success(request, 'Avaliação enviada com sucesso!')
            return redirect('perfil')
        except Exception as e:
            messages.error(request, f'Erro ao salvar avaliação: {e}')

    return render(request, 'avaliacao.html', {'compra': compra})


# ╔══════════════════════════════════════════════════════════╗
# ║          DASHBOARD (ADMIN)                               ║
# ╚══════════════════════════════════════════════════════════╝

@admin_required
def dashboard(request):
    return render(request, 'dashboard.html', {
        'total_usuarios':   _count_collection('usuarios'),
        'total_produtos':   _count_collection('produtos'),
        'total_categorias': _count_collection('categorias'),
        'total_compras':    _count_collection('compras'),
        'total_contatos':   _count_collection('contatos'),
        'total_avaliacoes': _count_collection('avaliacao'),
    })


# ─── Usuários (Admin) — tudo no Firestore ────────────────────────────────────

@admin_required
def listarUsuarios(request):
    usuarios = [_doc_to_dict(doc) for doc in db.collection('usuarios').stream()]
    usuarios.sort(key=lambda u: u.get('username', ''))
    return render(request, 'usuarios.html', {'usuarios': usuarios})


@admin_required
def addUsuarioAdmin(request):
    form = FormAdminUsuario(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        username = form.cleaned_data['username'].strip()
        existing = list(db.collection('usuarios').where('username', '==', username).stream())
        if existing:
            form.add_error('username', 'Este nome de usuário já está em uso.')
        else:
            is_staff = bool(form.cleaned_data.get('is_staff'))
            db.collection('usuarios').add({
                'username':  username,
                'email':     form.cleaned_data.get('email', ''),
                'password':  make_password(form.cleaned_data['password1']),
                'is_staff':  is_staff,
                'is_admin':  is_staff,
                'criado_em': datetime.now(timezone.utc),
            })
            return redirect('usuarios')
    return render(request, 'add-usuario.html', {'form': form})


@admin_required
def editUsuarioAdmin(request, id_user):
    doc = db.collection('usuarios').document(id_user).get()
    if not doc.exists:
        raise Http404
    usuario = _doc_to_dict(doc)

    if request.method == 'POST':
        form = FormEditarUsuarioAdmin(request.POST)
        if form.is_valid():
            is_staff = bool(form.cleaned_data.get('is_staff'))
            db.collection('usuarios').document(id_user).update({
                'username': form.cleaned_data['username'].strip(),
                'email':    form.cleaned_data.get('email', ''),
                'is_staff': is_staff,
                'is_admin': is_staff,
            })
            return redirect('usuarios')
    else:
        form = FormEditarUsuarioAdmin(initial={
            'username': usuario.get('username', ''),
            'email':    usuario.get('email', ''),
            'is_staff': usuario.get('is_staff', False),
        })

    return render(request, 'edit-usuario-admin.html', {'form': form, 'usuario': usuario})


@admin_required
def delUsuario(request, id_user):
    # Impede auto-exclusão
    if id_user == request.user.id:
        messages.error(request, 'Você não pode excluir sua própria conta.')
        return redirect('usuarios')
    db.collection('usuarios').document(id_user).delete()
    return redirect('usuarios')


# ─── Categoria (Admin) ────────────────────────────────────────────────────────

@admin_required
def listarCategoria(request):
    return render(request, 'categoria.html', {'categorias': _listar_categorias()})


@admin_required
def addCategoria(request):
    form = FormCategoria(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        db.collection('categorias').add({'nome': form.cleaned_data['nome']})
        return redirect('categoria')
    return render(request, 'add-categoria.html', {'form': form})


@admin_required
def editCategoria(request, id_cat):
    doc = db.collection('categorias').document(id_cat).get()
    if not doc.exists:
        raise Http404
    if request.method == 'POST':
        form = FormCategoria(request.POST)
        if form.is_valid():
            db.collection('categorias').document(id_cat).update(
                {'nome': form.cleaned_data['nome']}
            )
            return redirect('categoria')
    else:
        form = FormCategoria(initial={'nome': doc.to_dict().get('nome', '')})
    return render(request, 'edit-categoria.html', {'form': form})


@admin_required
def delCategoria(request, id_cat):
    db.collection('categorias').document(id_cat).delete()
    return redirect('categoria')


# ─── Produto (Admin) ──────────────────────────────────────────────────────────

@admin_required
def listarProduto(request):
    produtos = [_doc_to_dict(doc) for doc in db.collection('produtos').order_by('nome').stream()]
    return render(request, 'produto.html', {'produtos': produtos})


@admin_required
def addProduto(request):
    categorias = _listar_categorias()
    form = ProdutoForm(request.POST or None, request.FILES or None, categorias=categorias)
    if request.method == 'POST' and form.is_valid():
        imagem_url = _salvar_imagem(request.FILES.get('imagem'))
        cat_id   = form.cleaned_data.get('categoria_id') or ''
        cat_nome = ''
        if cat_id:
            cat_doc = db.collection('categorias').document(cat_id).get()
            if cat_doc.exists:
                cat_nome = cat_doc.to_dict().get('nome', '')
        db.collection('produtos').add({
            'nome':          form.cleaned_data['nome'],
            'imagem_url':    imagem_url,
            'descricao':     form.cleaned_data.get('descricao', ''),
            'quantidade':    form.cleaned_data['quantidade'],
            'preco':         float(form.cleaned_data['preco']),
            'plataforma':    form.cleaned_data['plataforma'],
            'categoria_id':  cat_id,
            'categoria_nome': cat_nome,
        })
        messages.success(request, 'Produto cadastrado com sucesso!')
        return redirect('produto')
    return render(request, 'add-produto.html', {'form': form})


@admin_required
def editProduto(request, id_prod):
    doc = db.collection('produtos').document(id_prod).get()
    if not doc.exists:
        raise Http404
    produto    = _doc_to_dict(doc)
    categorias = _listar_categorias()

    if request.method == 'POST':
        form = ProdutoForm(request.POST, request.FILES, categorias=categorias)
        if form.is_valid():
            imagem_url = (
                _salvar_imagem(request.FILES['imagem'])
                if request.FILES.get('imagem')
                else produto.get('imagem_url', '')
            )
            cat_id   = form.cleaned_data.get('categoria_id') or ''
            cat_nome = ''
            if cat_id:
                cat_doc = db.collection('categorias').document(cat_id).get()
                if cat_doc.exists:
                    cat_nome = cat_doc.to_dict().get('nome', '')
            db.collection('produtos').document(id_prod).update({
                'nome':          form.cleaned_data['nome'],
                'imagem_url':    imagem_url,
                'descricao':     form.cleaned_data.get('descricao', ''),
                'quantidade':    form.cleaned_data['quantidade'],
                'preco':         float(form.cleaned_data['preco']),
                'plataforma':    form.cleaned_data['plataforma'],
                'categoria_id':  cat_id,
                'categoria_nome': cat_nome,
            })
            messages.success(request, 'Produto atualizado!')
            return redirect('produto')
    else:
        form = ProdutoForm(
            initial={
                'nome':        produto.get('nome', ''),
                'descricao':   produto.get('descricao', ''),
                'quantidade':  produto.get('quantidade', 0),
                'preco':       produto.get('preco', 0),
                'plataforma':  produto.get('plataforma', ''),
                'categoria_id': produto.get('categoria_id', ''),
            },
            categorias=categorias,
        )
    return render(request, 'edit-produto.html', {'form': form, 'produto': produto})


@admin_required
def delProduto(request, id_prod):
    db.collection('produtos').document(id_prod).delete()
    return redirect('produto')


# ─── Contato (Admin) ──────────────────────────────────────────────────────────

@admin_required
def listarContato(request):
    contatos = [_doc_to_dict(doc) for doc in db.collection('contatos').stream()]
    return render(request, 'contato.html', {'contatos': contatos})


@admin_required
def delContato(request, id_contato):
    db.collection('contatos').document(id_contato).delete()
    return redirect('contato')


# ─── Compras (Admin) ──────────────────────────────────────────────────────────

@admin_required
def listarCompras(request):
    compras = [_doc_to_dict(doc) for doc in db.collection('compras').stream()]
    compras.sort(
        key=lambda x: x.get('data') or datetime.min.replace(tzinfo=timezone.utc),
        reverse=True,
    )
    return render(request, 'compras.html', {'compras': compras})


@admin_required
def delCompra(request, id_compra):
    db.collection('compras').document(id_compra).delete()
    return redirect('compras')


# ─── Avaliações (Admin) ───────────────────────────────────────────────────────

@admin_required
def listarAvaliacoes(request):
    return render(request, 'listaravaliacoes.html', {'avaliacoes': buscar_avaliacoes_firebase()})


@admin_required
def delAvaliacao(request, id_aval):
    try:
        db.collection('avaliacao').document(id_aval).delete()
    except Exception as e:
        messages.error(request, f'Erro ao excluir: {e}')
    return redirect('listaravaliacoes')
