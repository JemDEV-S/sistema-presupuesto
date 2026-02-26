from django.contrib import admin
from .models import LogAuditoria, SesionUsuario


@admin.register(LogAuditoria)
class LogAuditoriaAdmin(admin.ModelAdmin):
    list_display = ['usuario', 'accion', 'tabla', 'registro_id', 'ip_address', 'fecha_hora']
    list_filter = ['accion', 'tabla', 'fecha_hora']
    search_fields = ['usuario__username', 'tabla', 'registro_id']
    readonly_fields = [
        'usuario', 'accion', 'tabla', 'registro_id',
        'datos_anteriores', 'datos_nuevos',
        'ip_address', 'user_agent', 'fecha_hora',
    ]
    date_hierarchy = 'fecha_hora'

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser


@admin.register(SesionUsuario)
class SesionUsuarioAdmin(admin.ModelAdmin):
    list_display = ['usuario', 'ip_address', 'fecha_inicio', 'fecha_fin', 'is_active']
    list_filter = ['is_active', 'fecha_inicio']
    search_fields = ['usuario__username']
    readonly_fields = [
        'usuario', 'token_jti', 'ip_address', 'user_agent',
        'fecha_inicio', 'fecha_fin', 'is_active',
    ]
