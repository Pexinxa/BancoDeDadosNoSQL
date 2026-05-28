from django.db import migrations


class Migration(migrations.Migration):
    """
    Migration inicial limpa — todos os dados da aplicação
    (Produto, Categoria, Contato, Compra, Avaliação) agora vivem no Firebase Firestore.
    O SQLite é utilizado apenas pelo sistema de autenticação do Django.
    """

    initial = True

    dependencies = []

    operations = []
