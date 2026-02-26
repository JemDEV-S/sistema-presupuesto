from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Usuario, Rol, Permiso, RolPermiso, UsuarioRol


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    list_display = ["username", "email", "first_name", "last_name", "dni", "cargo", "is_active"]
    list_filter = ["is_active", "is_staff", "is_superuser"]
    search_fields = ["username", "email", "first_name", "last_name", "dni"]
    fieldsets = UserAdmin.fieldsets + (
        ("Datos adicionales", {
            "fields": ("dni", "telefono", "cargo", "creado_por"),
        }),
    )


@admin.register(Rol)
class RolAdmin(admin.ModelAdmin):
    list_display = ["nombre", "codigo", "nivel_jerarquico", "es_sistema", "is_active"]
    list_filter = ["nivel_jerarquico", "es_sistema", "is_active"]
    search_fields = ["nombre", "codigo"]


@admin.register(Permiso)
class PermisoAdmin(admin.ModelAdmin):
    list_display = ["nombre", "codigo", "recurso", "accion"]
    list_filter = ["recurso", "accion"]
    search_fields = ["nombre", "codigo"]


@admin.register(RolPermiso)
class RolPermisoAdmin(admin.ModelAdmin):
    list_display = ["rol", "permiso"]
    list_filter = ["rol"]


@admin.register(UsuarioRol)
class UsuarioRolAdmin(admin.ModelAdmin):
    list_display = ["usuario", "rol", "unidad_organica", "incluir_hijos", "fecha_asignacion"]
    list_filter = ["rol"]
    search_fields = ["usuario__username"]
