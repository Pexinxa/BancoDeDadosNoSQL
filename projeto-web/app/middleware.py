from firebase_config import db


class FirestoreUser:
    """
    Substitui o User do Django.
    Carregado a partir de um documento da coleção 'usuarios' no Firestore.
    """

    def __init__(self, data=None):
        if data:
            self.id            = data.get('id', '')
            self.username      = data.get('username', '')
            self.email         = data.get('email', '')
            self.is_staff      = bool(data.get('is_staff', False))
            self.is_admin      = bool(data.get('is_admin', False))
            self.is_authenticated = True
            self.is_active     = True
        else:
            # Usuário anônimo
            self.id            = None
            self.username      = ''
            self.email         = ''
            self.is_staff      = False
            self.is_admin      = False
            self.is_authenticated = False
            self.is_active     = True

    def __str__(self):
        return self.username or 'Anônimo'

    def __bool__(self):
        return self.is_authenticated


class FirestoreAuthMiddleware:
    """
    Lê '_auth_user_id' da sessão (cookie assinado), busca o usuário
    na coleção 'usuarios' do Firestore e popula request.user.
    Nenhum banco de dados SQL é utilizado.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        user_id = request.session.get('_auth_user_id')

        if user_id:
            try:
                doc = db.collection('usuarios').document(user_id).get()
                if doc.exists:
                    data = doc.to_dict()
                    data['id'] = doc.id
                    request.user = FirestoreUser(data)
                else:
                    # Sessão aponta para usuário inexistente — limpa
                    request.session.pop('_auth_user_id', None)
                    request.user = FirestoreUser()
            except Exception:
                request.user = FirestoreUser()
        else:
            request.user = FirestoreUser()

        return self.get_response(request)
