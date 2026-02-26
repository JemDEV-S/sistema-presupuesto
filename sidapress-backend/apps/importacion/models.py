from django.db import models
from django.conf import settings


class ImportacionArchivo(models.Model):
    ESTADOS = [
        ('PENDIENTE', 'Pendiente'),
        ('PROCESANDO', 'Procesando'),
        ('COMPLETADO', 'Completado'),
        ('ERROR', 'Error'),
        ('PARCIAL', 'Completado parcialmente'),
    ]

    archivo = models.FileField(upload_to='uploads/excel/')
    nombre_archivo = models.CharField(max_length=255)
    hash_archivo = models.CharField(max_length=64)
    tamanio = models.IntegerField(default=0)
    anio_fiscal = models.ForeignKey(
        'catalogos.AnioFiscal', on_delete=models.CASCADE, related_name='importaciones'
    )
    estado = models.CharField(max_length=20, choices=ESTADOS, default='PENDIENTE')
    total_filas = models.IntegerField(default=0)
    filas_procesadas = models.IntegerField(default=0)
    filas_con_error = models.IntegerField(default=0)
    filas_creadas = models.IntegerField(default=0)
    filas_actualizadas = models.IntegerField(default=0)
    filas_sin_cambios = models.IntegerField(default=0)
    log_errores = models.JSONField(default=list, blank=True)
    estadisticas_detalle = models.JSONField(default=dict, blank=True)
    importado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='importaciones'
    )
    fecha_inicio = models.DateTimeField(auto_now_add=True)
    fecha_fin = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'importacion_archivo'
        verbose_name = 'Importación de Archivo'
        verbose_name_plural = 'Importaciones de Archivos'
        ordering = ['-fecha_inicio']

    def __str__(self):
        return f'{self.nombre_archivo} ({self.estado})'
