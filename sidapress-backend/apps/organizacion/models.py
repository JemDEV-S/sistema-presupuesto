from django.db import models
from django.conf import settings


class UnidadOrganica(models.Model):
    NIVELES = [
        (1, 'Órgano'),
        (2, 'Unidad Orgánica'),
        (3, 'Sub Unidad Orgánica'),
    ]

    codigo = models.CharField(max_length=20, unique=True)
    nombre = models.CharField(max_length=200)
    nombre_corto = models.CharField(max_length=50, blank=True, default='')
    nivel = models.IntegerField(choices=NIVELES, default=1)
    parent = models.ForeignKey(
        'self', on_delete=models.CASCADE, null=True, blank=True,
        related_name='hijos'
    )
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='unidades_responsable'
    )
    is_active = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'unidad_organica'
        verbose_name = 'Unidad Orgánica'
        verbose_name_plural = 'Unidades Orgánicas'
        ordering = ['codigo']

    def __str__(self):
        return f'{self.codigo} - {self.nombre}'

    def get_hijos_recursivo(self):
        hijos = list(self.hijos.filter(is_active=True))
        for hijo in self.hijos.filter(is_active=True):
            hijos.extend(hijo.get_hijos_recursivo())
        return hijos
