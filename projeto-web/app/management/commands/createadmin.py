"""
Cria um usuário administrador diretamente no Firestore.

Uso:
    python manage.py createadmin --username admin --email admin@nexus.com --password suasenha
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from firebase_config import db
from datetime import datetime, timezone


class Command(BaseCommand):
    help = 'Cria um usuário administrador no Firebase Firestore'

    def add_arguments(self, parser):
        parser.add_argument('--username', required=True, help='Nome de usuário')
        parser.add_argument('--email',    default='',   help='E-mail (opcional)')
        parser.add_argument('--password', required=True, help='Senha')

    def handle(self, *args, **options):
        username = options['username']
        email    = options['email']
        password = options['password']

        # Verifica se já existe
        docs = list(db.collection('usuarios').where('username', '==', username).stream())
        if docs:
            self.stdout.write(self.style.ERROR(f'Erro: usuário "{username}" já existe.'))
            return

        db.collection('usuarios').add({
            'username':  username,
            'email':     email,
            'password':  make_password(password),
            'is_staff':  True,
            'is_admin':  True,
            'criado_em': datetime.now(timezone.utc),
        })

        self.stdout.write(self.style.SUCCESS(
            f'Admin "{username}" criado com sucesso! Acesse /login/ para entrar.'
        ))
