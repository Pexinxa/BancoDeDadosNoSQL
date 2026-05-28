import firebase_admin
from firebase_admin import credentials, firestore
from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent

# Procura as credenciais em secrets/firebase-adminsdk.json por padrão.
# Para sobrescrever, defina a variável de ambiente FIREBASE_CREDENTIALS_PATH.
DEFAULT_CREDENTIALS_PATH = BASE_DIR / 'secrets' / 'firebase-adminsdk.json'
credentials_path = Path(os.environ.get('FIREBASE_CREDENTIALS_PATH', DEFAULT_CREDENTIALS_PATH))

if not credentials_path.exists():
    raise FileNotFoundError(
        f'Arquivo de credenciais do Firebase não encontrado em: {credentials_path}\n'
        'Coloque o JSON em secrets/firebase-adminsdk.json '
        'ou defina a variável de ambiente FIREBASE_CREDENTIALS_PATH.'
    )

cred = credentials.Certificate(credentials_path)

# Evita erro "already initialized" em reloads do dev server
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()
