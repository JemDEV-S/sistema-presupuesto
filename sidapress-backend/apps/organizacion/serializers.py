from rest_framework import serializers
from .models import UnidadOrganica


class UnidadOrganicaSerializer(serializers.ModelSerializer):
    responsable_nombre = serializers.SerializerMethodField()
    parent_nombre = serializers.CharField(source='parent.nombre', read_only=True, default=None)

    class Meta:
        model = UnidadOrganica
        fields = [
            'id', 'codigo', 'nombre', 'nombre_corto', 'nivel',
            'parent', 'parent_nombre', 'responsable', 'responsable_nombre',
            'is_active',
        ]

    def get_responsable_nombre(self, obj):
        if obj.responsable:
            return f'{obj.responsable.first_name} {obj.responsable.last_name}'
        return None


class UnidadOrganicaTreeSerializer(serializers.ModelSerializer):
    """Serializer que incluye hijos recursivamente para vista de árbol."""
    children = serializers.SerializerMethodField()

    class Meta:
        model = UnidadOrganica
        fields = ['id', 'codigo', 'nombre', 'nombre_corto', 'nivel', 'is_active', 'children']

    def get_children(self, obj):
        hijos = obj.hijos.filter(is_active=True).order_by('codigo')
        return UnidadOrganicaTreeSerializer(hijos, many=True).data
