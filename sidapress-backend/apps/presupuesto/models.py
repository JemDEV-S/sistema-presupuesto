from django.db import models
from django.conf import settings


class Meta(models.Model):
    TIPO_META = [
        ('PRODUCTO', 'Producto'),
        ('PROYECTO', 'Proyecto'),
    ]

    TIPO_ACTIVIDAD = [
        ('ACTIVIDAD', 'Actividad'),
        ('OBRA', 'Obra'),
        ('ACCION_INVERSION', 'Acción de Inversión'),
    ]

    anio_fiscal = models.ForeignKey(
        'catalogos.AnioFiscal', on_delete=models.CASCADE, related_name='metas'
    )
    unidad_organica = models.ForeignKey(
        'organizacion.UnidadOrganica', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='metas'
    )
    codigo = models.CharField(max_length=20)
    nombre = models.CharField(max_length=500)
    finalidad = models.TextField(blank=True, default='')
    tipo_meta = models.CharField(max_length=20, choices=TIPO_META, default='PRODUCTO')
    cantidad_meta_anual = models.DecimalField(max_digits=15, decimal_places=2, default=0)

    # Códigos numéricos (para cruce con otros reportes)
    sec_func = models.IntegerField(null=True, blank=True)
    codigo_programa_pptal = models.CharField(max_length=20, blank=True, default='')
    codigo_producto_proyecto = models.CharField(max_length=20, blank=True, default='')
    codigo_actividad = models.CharField(max_length=20, blank=True, default='')
    codigo_funcion = models.CharField(max_length=10, blank=True, default='')
    codigo_division_fn = models.CharField(max_length=10, blank=True, default='')
    codigo_grupo_fn = models.CharField(max_length=10, blank=True, default='')
    codigo_finalidad = models.CharField(max_length=20, blank=True, default='')
    # Nombres descriptivos (sin código)
    nombre_programa_pptal = models.CharField(max_length=300, blank=True, default='')
    nombre_producto_proyecto = models.CharField(max_length=500, blank=True, default='')
    nombre_actividad = models.CharField(max_length=500, blank=True, default='')
    # Tipo y clasificación
    tipo_producto_proyecto = models.CharField(max_length=50, blank=True, default='')
    tipo_actividad = models.CharField(max_length=20, choices=TIPO_ACTIVIDAD, blank=True, default='')
    codigo_unidad_medida = models.CharField(max_length=10, blank=True, default='')
    nombre_unidad_medida = models.CharField(max_length=100, blank=True, default='')
    is_active = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'meta'
        verbose_name = 'Meta'
        verbose_name_plural = 'Metas'
        ordering = ['codigo']
        unique_together = ['anio_fiscal', 'codigo']

    def __str__(self):
        return f'{self.codigo} - {self.nombre}'


class EjecucionPresupuestal(models.Model):
    anio_fiscal = models.ForeignKey(
        'catalogos.AnioFiscal', on_delete=models.CASCADE, related_name='ejecuciones'
    )
    meta = models.ForeignKey(
        Meta, on_delete=models.CASCADE, related_name='ejecuciones'
    )
    rubro = models.ForeignKey(
        'catalogos.Rubro', on_delete=models.CASCADE, related_name='ejecuciones'
    )
    clasificador_gasto = models.ForeignKey(
        'catalogos.ClasificadorGasto', on_delete=models.CASCADE, related_name='ejecuciones'
    )
    # Categoría de gasto (5.GASTOS CORRIENTES, 6.GASTOS DE CAPITAL)
    codigo_categoria_gasto = models.CharField(max_length=10, blank=True, default='')
    nombre_categoria_gasto = models.CharField(max_length=100, blank=True, default='')
    # Indicador de restricción de modificación
    restringido = models.BooleanField(default=False)
    # Montos presupuestales
    pia = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    modificaciones = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    pim = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    certificado = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    compromiso_anual = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    # Metadata
    archivo_origen = models.ForeignKey(
        'importacion.ImportacionArchivo', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='ejecuciones'
    )
    importado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='ejecuciones_importadas'
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ejecucion_presupuestal'
        verbose_name = 'Ejecución Presupuestal'
        verbose_name_plural = 'Ejecuciones Presupuestales'
        indexes = [
            models.Index(fields=['anio_fiscal', 'meta']),
            models.Index(fields=['anio_fiscal', 'rubro']),
        ]

    def __str__(self):
        return f'{self.meta} - {self.rubro} ({self.anio_fiscal})'


class EjecucionMensual(models.Model):
    ejecucion = models.ForeignKey(
        EjecucionPresupuestal, on_delete=models.CASCADE, related_name='mensuales'
    )
    mes = models.IntegerField()  # 1-12
    compromiso = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    devengado = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    girado = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    pagado = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ejecucion_mensual'
        verbose_name = 'Ejecución Mensual'
        verbose_name_plural = 'Ejecuciones Mensuales'
        unique_together = ['ejecucion', 'mes']
        ordering = ['ejecucion', 'mes']
        indexes = [
            models.Index(fields=['ejecucion', 'mes']),
        ]

    def __str__(self):
        return f'{self.ejecucion} - Mes {self.mes}'


class ModificacionPresupuestal(models.Model):
    TIPOS = [
        ('CREDITO', 'Crédito Suplementario'),
        ('TRANSFERENCIA', 'Transferencia de Partidas'),
        ('HABILITACION', 'Habilitación'),
        ('ANULACION', 'Anulación'),
    ]

    ejecucion = models.ForeignKey(
        EjecucionPresupuestal, on_delete=models.CASCADE, related_name='modificaciones_detalle'
    )
    tipo = models.CharField(max_length=20, choices=TIPOS)
    monto = models.DecimalField(max_digits=15, decimal_places=2)
    documento_referencia = models.CharField(max_length=100, blank=True, default='')
    descripcion = models.TextField(blank=True, default='')
    fecha_modificacion = models.DateField()
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='modificaciones_registradas'
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'modificacion_presupuestal'
        verbose_name = 'Modificación Presupuestal'
        verbose_name_plural = 'Modificaciones Presupuestales'
        ordering = ['-fecha_modificacion']

    def __str__(self):
        return f'{self.tipo} - S/ {self.monto}'


class AvanceFisico(models.Model):
    meta = models.OneToOneField(
        Meta, on_delete=models.CASCADE, related_name='avance_fisico'
    )
    cantidad_meta_semestral = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    avance_fisico_anual = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    avance_fisico_semestral = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    observaciones = models.TextField(blank=True, default='')
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='avances_registrados'
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'avance_fisico'
        verbose_name = 'Avance Físico'
        verbose_name_plural = 'Avances Físicos'

    def __str__(self):
        return f'{self.meta} - Avance anual: {self.avance_fisico_anual}'
