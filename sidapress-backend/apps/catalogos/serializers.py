from rest_framework import serializers
from .models import AnioFiscal, FuenteFinanciamiento, Rubro, ClasificadorGasto


class AnioFiscalSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnioFiscal
        fields = ['id', 'anio', 'is_active', 'is_cerrado']


class FuenteFinanciamientoSerializer(serializers.ModelSerializer):
    class Meta:
        model = FuenteFinanciamiento
        fields = ['id', 'codigo', 'nombre', 'nombre_corto', 'is_active']


class RubroSerializer(serializers.ModelSerializer):
    fuente_nombre = serializers.CharField(source='fuente.nombre', read_only=True)

    class Meta:
        model = Rubro
        fields = ['id', 'codigo', 'nombre', 'nombre_corto', 'fuente', 'fuente_nombre', 'is_active']


class ClasificadorGastoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClasificadorGasto
        fields = [
            'id', 'codigo', 'nombre', 'tipo_transaccion',
            'generica', 'subgenerica', 'subgenerica_det', 'especifica', 'especifica_det', 'is_active',
        ]
