def auth_context(request):
    """Injeta 'user' em todos os templates (substitui o context processor do Django auth)."""
    return {'user': getattr(request, 'user', None)}
