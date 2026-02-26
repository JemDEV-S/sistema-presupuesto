from rest_framework import serializers
from .models import (
    Meta, EjecucionPresupuestal, EjecucionMensual,
    ModificacionPresupuestal, AvanceFisico,
)


class EjecucionMensualSerializer(serializers.ModelSerializer):
    class Meta:
        model = EjecucionMensual
        fields = ['id', 'mes', 'compromiso', 'devengado', 'girado', 'pagado']


class MetaSerializer(serializers.ModelSerializer):
    unidad_nombre = serializers.CharField(source='unidad_organica.nombre', read_only=True)
    anio = serializers.IntegerField(source='anio_fiscal.anio', read_only=True)

    class Meta:
        model = Meta
        fields = [
            'id', 'anio_fiscal', 'anio', 'unidad_organica', 'unidad_nombre',
            'codigo', 'nombre', 'finalidad', 'tipo_meta',
            'cantidad_meta_anual', 'is_active',
        ]


class EjecucionPresupuestalSerializer(serializers.ModelSerializer):
    meta_codigo = serializers.CharField(source='meta.codigo', read_only=True)
    meta_nombre = serializers.CharField(source='meta.nombre', read_only=True)
    rubro_nombre = serializers.CharField(source='rubro.nombre', read_only=True)
    rubro_codigo = serializers.CharField(source='rubro.codigo', read_only=True)
    fuente_nombre = serializers.CharField(source='rubro.fuente.nombre', read_only=True)
    clasificador_nombre = serializers.CharField(source='clasificador_gasto.nombre', read_only=True)
    clasificador_codigo = serializers.CharField(source='clasificador_gasto.codigo', read_only=True)
    mensuales = EjecucionMensualSerializer(many=True, read_only=True)
    # Campos calculados
    devengado_total = serializers.SerializerMethodField()
    girado_total = serializers.SerializerMethodField()
    avance_pct = serializers.SerializerMethodField()

    class Meta:
        model = EjecucionPresupuestal
        fields = [
            'id', 'anio_fiscal', 'meta', 'meta_codigo', 'meta_nombre',
            'rubro', 'rubro_codigo', 'rubro_nombre', 'fuente_nombre',
            'clasificador_gasto', 'clasificador_codigo', 'clasificador_nombre',
            'codigo_categoria_gasto', 'nombre_categoria_gasto', 'restringido',
            'pia', 'modificaciones', 'pim', 'certificado', 'compromiso_anual',
            'mensuales', 'devengado_total', 'girado_total', 'avance_pct',
        ]

    def get_devengado_total(self, obj):
        return sum(m.devengado for m in obj.mensuales.all())

    def get_girado_total(self, obj):
        return sum(m.girado for m in obj.mensuales.all())

    def get_avance_pct(self, obj):
        if obj.pim and obj.pim > 0:
            devengado = sum(m.devengado for m in obj.mensuales.all())
            return round(float(devengado / obj.pim * 100), 2)
        return 0


class EjecucionResumenSerializer(serializers.Serializer):
    """Serializer para resumen/dashboard sin detalle mensual."""
    id = serializers.IntegerField()
    meta_codigo = serializers.CharField()
    meta_nombre = serializers.CharField()
    rubro_nombre = serializers.CharField()
    fuente_nombre = serializers.CharField()
    pia = serializers.DecimalField(max_digits=15, decimal_places=2)
    pim = serializers.DecimalField(max_digits=15, decimal_places=2)
    certificado = serializers.DecimalField(max_digits=15, decimal_places=2)
    devengado_total = serializers.DecimalField(max_digits=15, decimal_places=2)
    girado_total = serializers.DecimalField(max_digits=15, decimal_places=2)
    avance_pct = serializers.FloatField()


class ModificacionPresupuestalSerializer(serializers.ModelSerializer):
    class Meta:
        model = ModificacionPresupuestal
        fields = [
            'id', 'ejecucion', 'tipo', 'monto', 'documento_referencia',
            'descripcion', 'fecha_modificacion',
        ]


class AvanceFisicoSerializer(serializers.ModelSerializer):
    meta_nombre = serializers.CharField(source='meta.nombre', read_only=True)

    class Meta:
        model = AvanceFisico
        fields = [
            'id', 'meta', 'meta_nombre',
            'cantidad_meta_semestral', 'avance_fisico_anual', 'avance_fisico_semestral',
            'observaciones',
        ]
