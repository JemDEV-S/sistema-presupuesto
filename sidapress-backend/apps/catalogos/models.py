from django.db import models


class AnioFiscal(models.Model):
    anio = models.IntegerField(unique=True)
    is_active = models.BooleanField(default=True)
    is_cerrado = models.BooleanField(default=False)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'anio_fiscal'
        verbose_name = 'Año Fiscal'
        verbose_name_plural = 'Años Fiscales'
        ordering = ['-anio']

    def __str__(self):
        return str(self.anio)


class FuenteFinanciamiento(models.Model):
    codigo = models.CharField(max_length=10, unique=True)
    nombre = models.CharField(max_length=200)
    nombre_corto = models.CharField(max_length=50, blank=True, default='')
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'fuente_financiamiento'
        verbose_name = 'Fuente de Financiamiento'
        verbose_name_plural = 'Fuentes de Financiamiento'
        ordering = ['codigo']

    def __str__(self):
        return f'{self.codigo} - {self.nombre}'


class Rubro(models.Model):
    codigo = models.CharField(max_length=10, unique=True)
    nombre = models.CharField(max_length=200)
    nombre_corto = models.CharField(max_length=50, blank=True, default='')
    descripcion = models.TextField(blank=True, default='')
    fuente = models.ForeignKey(
        FuenteFinanciamiento, on_delete=models.CASCADE, related_name='rubros'
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'rubro'
        verbose_name = 'Rubro'
        verbose_name_plural = 'Rubros'
        ordering = ['codigo']

    def __str__(self):
        return f'{self.codigo} - {self.nombre}'


class ClasificadorGasto(models.Model):
    codigo = models.CharField(max_length=20, unique=True)
    nombre = models.CharField(max_length=300)
    tipo_transaccion = models.CharField(max_length=100, blank=True, default='')
    generica = models.CharField(max_length=100, blank=True, default='')
    subgenerica = models.CharField(max_length=100, blank=True, default='')
    subgenerica_det = models.CharField(max_length=100, blank=True, default='')
    especifica = models.CharField(max_length=100, blank=True, default='')
    especifica_det = models.CharField(max_length=100, blank=True, default='')
    nombre_tipo_transaccion = models.CharField(max_length=100, blank=True, default='')
    nombre_generica = models.CharField(max_length=200, blank=True, default='')
    nombre_subgenerica = models.CharField(max_length=200, blank=True, default='')
    nombre_subgenerica_det = models.CharField(max_length=200, blank=True, default='')
    nombre_especifica = models.CharField(max_length=200, blank=True, default='')
    nombre_especifica_det = models.CharField(max_length=300, blank=True, default='')
    descripcion_detallada = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'clasificador_gasto'
        verbose_name = 'Clasificador de Gasto'
        verbose_name_plural = 'Clasificadores de Gasto'
        ordering = ['codigo']

    def __str__(self):
        return f'{self.codigo} - {self.nombre}'
