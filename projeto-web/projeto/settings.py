"""
Django settings — NEXUS Games
Banco de dados: Firebase Firestore (100% NoSQL, zero SQLite)
Sessões e mensagens: cookies assinados (sem BD)
"""
from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get(
    'DJANGO_SECRET_KEY',
    'django-insecure-nnkqmc^trdu^w9%90uq6&4^0c4r#w%@--^8!$vvsxda=-p4%qx'
)

DEBUG = os.environ.get('DJANGO_DEBUG', 'True') != 'False'

ALLOWED_HOSTS = os.environ.get('DJANGO_ALLOWED_HOSTS', '*').split(',')

CSRF_TRUSTED_ORIGINS = [
    o for o in os.environ.get('DJANGO_CSRF_TRUSTED_ORIGINS', '').split(',') if o
]

# ─── Apps instalados ───────────────────────────────────────────────────────────
# django.contrib.auth, admin, contenttypes e sessions foram removidos.
# Autenticação é feita via Firestore + cookies assinados.
INSTALLED_APPS = [
    'django.contrib.staticfiles',
    'django.contrib.messages',
    'app',
]

# ─── Middleware ────────────────────────────────────────────────────────────────
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',   # signed_cookies
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'app.middleware.FirestoreAuthMiddleware',                  # auth via Firestore
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'projeto.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.messages.context_processors.messages',
                'app.context_processors.auth_context',   # injeta 'user' nos templates
            ],
        },
    },
]

WSGI_APPLICATION = 'projeto.wsgi.application'

# ─── Banco de dados ────────────────────────────────────────────────────────────
# Sem banco relacional. Todos os dados vivem no Firebase Firestore.
DATABASES = {}

# ─── Sessões (cookie assinado — sem tabela no BD) ──────────────────────────────
SESSION_ENGINE = 'django.contrib.sessions.backends.signed_cookies'
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_AGE = 60 * 60 * 24 * 7   # 7 dias

# ─── Mensagens flash (cookie — sem tabela no BD) ──────────────────────────────
MESSAGE_STORAGE = 'django.contrib.messages.storage.cookie.CookieStorage'

# ─── Internacionalização ───────────────────────────────────────────────────────
LANGUAGE_CODE = 'pt-br'
TIME_ZONE     = 'America/Sao_Paulo'
USE_I18N      = True
USE_TZ        = True

# ─── Arquivos estáticos e mídia ────────────────────────────────────────────────
STATIC_URL  = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL  = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
