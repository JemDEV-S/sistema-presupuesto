from rest_framework.permissions import BasePermission
from .models import UsuarioRol, Permiso


class HasPermission(BasePermission):
    """
    Permiso custom que verifica si el usuario tiene un permiso específico.
    Uso: permission_classes = [HasPermission]
    Y definir required_permission en la vista.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        required_permission = getattr(view, 'required_permission', None)
        if not required_permission:
            return True

        return user_has_permission(request.user, required_permission)


def user_has_permission(user, permission_code):
    """Verifica si un usuario tiene un permiso específico."""
    if user.is_superuser:
        return True

    roles_ids = UsuarioRol.objects.filter(
        usuario=user
    ).values_list('rol_id', flat=True)

    return Permiso.objects.filter(
        permiso_roles__rol_id__in=roles_ids,
        codigo=permission_code
    ).exists()


def get_user_permissions(user):
    """Obtiene todos los permisos de un usuario."""
    if user.is_superuser:
        return ['*.*']

    roles_ids = UsuarioRol.objects.filter(
        usuario=user
    ).values_list('rol_id', flat=True)

    permisos = Permiso.objects.filter(
        permiso_roles__rol_id__in=roles_ids
    ).distinct().values_list('codigo', flat=True)

    return list(permisos)


def get_user_unidades(user):
    """Obtiene las unidades orgánicas accesibles por el usuario."""
    if user.is_superuser:
        return None  # Acceso global

    usuario_roles = UsuarioRol.objects.filter(
        usuario=user
    ).select_related('unidad_organica')

    unidades_ids = set()
    for ur in usuario_roles:
        if ur.unidad_organica:
            unidades_ids.add(ur.unidad_organica_id)
            if ur.incluir_hijos:
                hijos = ur.unidad_organica.get_hijos_recursivo()
                unidades_ids.update(h.id for h in hijos)

    return list(unidades_ids)
