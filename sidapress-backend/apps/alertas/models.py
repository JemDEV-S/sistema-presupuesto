from django.db import models
from django.conf import settings


class Alerta(models.Model):
    TIPOS = [
        ('SUBEJECUCION', 'Sub ejecución'),
        ('SOBRECERTIFICACION', 'Sobre certificación'),
        ('META_ATRASADA', 'Meta atrasada'),
        ('MODIFICACION', 'Modificación presupuestal'),
        ('VENCIMIENTO', 'Vencimiento'),
    ]

    SEVERIDADES = [
        ('INFO', 'Información'),
        ('WARNING', 'Advertencia'),
        ('CRITICAL', 'Crítico'),
    ]

    ESTADOS = [
        ('ACTIVA', 'Activa'),
        ('LEIDA', 'Leída'),
        ('RESUELTA', 'Resuelta'),
    ]

    tipo_alerta = models.CharField(max_length=30, choices=TIPOS)
    nivel_severidad = models.CharField(max_length=10, choices=SEVERIDADES, default='INFO')
    titulo = models.CharField(max_length=200)
    mensaje = models.TextField()
    datos_contexto = models.JSONField(default=dict, blank=True)
    estado = models.CharField(max_length=10, choices=ESTADOS, default='ACTIVA')
    anio_fiscal = models.ForeignKey(
        'catalogos.AnioFiscal', on_delete=models.CASCADE,
        related_name='alertas', null=True, blank=True
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_resolucion = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'alerta'
        verbose_name = 'Alerta'
        verbose_name_plural = 'Alertas'
        ordering = ['-fecha_creacion']

    def __str__(self):
        return f'[{self.nivel_severidad}] {self.titulo}'


class NotificacionUsuario(models.Model):
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='notificaciones'
    )
    alerta = models.ForeignKey(
        Alerta, on_delete=models.CASCADE, related_name='notificaciones'
    )
    is_leida = models.BooleanField(default=False)
    fecha_lectura = models.DateTimeField(null=True, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notificacion_usuario'
        verbose_name = 'Notificación de Usuario'
        verbose_name_plural = 'Notificaciones de Usuarios'
        ordering = ['-fecha_creacion']
        unique_together = ['usuario', 'alerta']

    def __str__(self):
        return f'{self.usuario} - {self.alerta}'
