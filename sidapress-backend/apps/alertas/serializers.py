from rest_framework import serializers
from .models import Alerta, NotificacionUsuario


class AlertaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alerta
        fields = [
            'id', 'tipo_alerta', 'nivel_severidad', 'titulo', 'mensaje',
            'datos_contexto', 'estado', 'anio_fiscal',
            'fecha_creacion', 'fecha_resolucion',
        ]


class NotificacionUsuarioSerializer(serializers.ModelSerializer):
    alerta = AlertaSerializer(read_only=True)

    class Meta:
        model = NotificacionUsuario
        fields = ['id', 'alerta', 'is_leida', 'fecha_lectura', 'fecha_creacion']
