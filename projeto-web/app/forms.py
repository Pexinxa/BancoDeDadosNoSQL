from django import forms


# ─── Plataformas ───────────────────────────────────────────────────────────────

PLATAFORMAS = [
    ('', 'Selecione a plataforma...'),
    ('PC', 'PC'),
    ('PS5', 'PlayStation 5'),
    ('PS4', 'PlayStation 4'),
    ('XBOX', 'Xbox'),
    ('SWITCH', 'Nintendo Switch'),
    ('MOBILE', 'Mobile'),
]


# ─── Autenticação (Firestore — sem Django ORM) ─────────────────────────────────

class FormUsuario(forms.Form):
    """Cadastro de novo usuário (cliente)."""
    username  = forms.CharField(max_length=100, label='Nome de usuário')
    email     = forms.EmailField(label='E-mail')
    password1 = forms.CharField(widget=forms.PasswordInput, label='Senha',
                                min_length=8,
                                help_text='Mínimo de 8 caracteres.')
    password2 = forms.CharField(widget=forms.PasswordInput, label='Confirmação de senha')

    def clean_password2(self):
        p1 = self.cleaned_data.get('password1', '')
        p2 = self.cleaned_data.get('password2', '')
        if p1 and p2 and p1 != p2:
            raise forms.ValidationError('As senhas não conferem.')
        return p2


class FormEditarUsuario(forms.Form):
    """Edição de perfil pelo próprio cliente."""
    username = forms.CharField(max_length=100, label='Nome de usuário')
    email    = forms.EmailField(label='E-mail', required=False)


class FormAlterarSenha(forms.Form):
    """Alteração de senha pelo cliente logado."""
    senha_antiga       = forms.CharField(widget=forms.PasswordInput, label='Senha atual')
    nova_senha         = forms.CharField(widget=forms.PasswordInput, label='Nova senha', min_length=8)
    confirma_nova_senha = forms.CharField(widget=forms.PasswordInput, label='Confirmar nova senha')

    def clean(self):
        cleaned = super().clean()
        ns = cleaned.get('nova_senha', '')
        cn = cleaned.get('confirma_nova_senha', '')
        if ns and cn and ns != cn:
            raise forms.ValidationError('As novas senhas não conferem.')
        return cleaned


class FormAdminUsuario(forms.Form):
    """Criação de usuário pelo admin (com opção de perfil)."""
    username  = forms.CharField(max_length=100, label='Nome de usuário')
    email     = forms.EmailField(label='E-mail', required=False)
    password1 = forms.CharField(widget=forms.PasswordInput, label='Senha', min_length=8)
    password2 = forms.CharField(widget=forms.PasswordInput, label='Confirmação de senha')
    is_staff  = forms.BooleanField(label='Perfil Admin', required=False)

    def clean_password2(self):
        p1 = self.cleaned_data.get('password1', '')
        p2 = self.cleaned_data.get('password2', '')
        if p1 and p2 and p1 != p2:
            raise forms.ValidationError('As senhas não conferem.')
        return p2


class FormEditarUsuarioAdmin(forms.Form):
    """Edição de usuário pelo admin."""
    username = forms.CharField(max_length=100, label='Nome de usuário')
    email    = forms.EmailField(label='E-mail', required=False)
    is_staff = forms.BooleanField(label='Perfil Admin', required=False)


# ─── Contato (Firestore) ───────────────────────────────────────────────────────

class FormContato(forms.Form):
    nome     = forms.CharField(max_length=100, label='Seu nome')
    email    = forms.EmailField(max_length=100, label='Seu e-mail')
    assunto  = forms.CharField(max_length=100, label='Assunto')
    mensagem = forms.CharField(
        widget=forms.Textarea(attrs={'rows': 5, 'placeholder': 'Escreva sua mensagem...'}),
        label='Mensagem',
    )


# ─── Categoria (Firestore) ─────────────────────────────────────────────────────

class FormCategoria(forms.Form):
    nome = forms.CharField(
        max_length=100,
        label='Nome da categoria',
        widget=forms.TextInput(attrs={'placeholder': 'Ex: RPG, Ação, Aventura...'}),
    )


# ─── Produto (Firestore + upload de imagem para media/) ───────────────────────

class ProdutoForm(forms.Form):
    nome       = forms.CharField(max_length=100, label='Nome do jogo')
    imagem     = forms.ImageField(required=False, label='Capa')
    descricao  = forms.CharField(
        widget=forms.Textarea(attrs={'rows': 4}),
        required=False,
        label='Descrição',
    )
    quantidade = forms.IntegerField(min_value=0, initial=0, label='Estoque')
    preco      = forms.DecimalField(max_digits=10, decimal_places=2, label='Preço (R$)')
    plataforma = forms.ChoiceField(choices=PLATAFORMAS, label='Plataforma')
    categoria_id = forms.ChoiceField(required=False, label='Categoria/Gênero')

    def __init__(self, *args, categorias=None, **kwargs):
        super().__init__(*args, **kwargs)
        choices = [('', '--- Nenhuma ---')]
        if categorias:
            choices += [(c['id'], c['nome']) for c in categorias]
        self.fields['categoria_id'].choices = choices
