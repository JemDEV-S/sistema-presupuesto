from django.db import models
from django.conf import settings


class LogAuditoria(models.Model):
    ACCIONES = [
        ('CREATE', 'Crear'),
        ('UPDATE', 'Actualizar'),
        ('DELETE', 'Eliminar'),
        ('LOGIN', 'Inicio de sesión'),
        ('LOGOUT', 'Cierre de sesión'),
        ('IMPORT', 'Importación'),
        ('EXPORT', 'Exportación'),
    ]

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='logs_auditoria'
    )
    accion = models.CharField(max_length=20, choices=ACCIONES)
    tabla = models.CharField(max_length=100, blank=True, default='')
    registro_id = models.CharField(max_length=50, blank=True, default='')
    datos_anteriores = models.JSONField(null=True, blank=True)
    datos_nuevos = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default='')
    fecha_hora = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'log_auditoria'
        verbose_name = 'Log de Auditoría'
        verbose_name_plural = 'Logs de Auditoría'
        ordering = ['-fecha_hora']
        indexes = [
            models.Index(fields=['-fecha_hora', 'usuario']),
            models.Index(fields=['tabla', 'accion']),
        ]

    def __str__(self):
        return f'{self.usuario} - {self.accion} - {self.fecha_hora}'


class SesionUsuario(models.Model):
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='sesiones'
    )
    token_jti = models.CharField(max_length=255, unique=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default='')
    fecha_inicio = models.DateTimeField(auto_now_add=True)
    fecha_fin = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'sesion_usuario'
        verbose_name = 'Sesión de Usuario'
        verbose_name_plural = 'Sesiones de Usuarios'
        ordering = ['-fecha_inicio']

    def __str__(self):
        return f'{self.usuario} - {self.fecha_inicio}'
