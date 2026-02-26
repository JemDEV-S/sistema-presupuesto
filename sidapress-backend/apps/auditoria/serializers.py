from rest_framework import serializers
from .models import LogAuditoria, SesionUsuario


class LogAuditoriaSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario.get_full_name', read_only=True)
    usuario_username = serializers.CharField(source='usuario.username', read_only=True)

    class Meta:
        model = LogAuditoria
        fields = [
            'id', 'usuario', 'usuario_nombre', 'usuario_username',
            'accion', 'tabla', 'registro_id',
            'datos_anteriores', 'datos_nuevos',
            'ip_address', 'user_agent', 'fecha_hora',
        ]
        read_only_fields = fields


class SesionUsuarioSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario.get_full_name', read_only=True)
    usuario_username = serializers.CharField(source='usuario.username', read_only=True)

    class Meta:
        model = SesionUsuario
        fields = [
            'id', 'usuario', 'usuario_nombre', 'usuario_username',
            'token_jti', 'ip_address', 'user_agent',
            'fecha_inicio', 'fecha_fin', 'is_active',
        ]
        read_only_fields = fields
