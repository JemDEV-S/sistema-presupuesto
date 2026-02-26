from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import Usuario, Rol, Permiso, UsuarioRol, RolPermiso


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(username=data['username'], password=data['password'])
        if not user:
            raise serializers.ValidationError('Credenciales inválidas.')
        if not user.is_active:
            raise serializers.ValidationError('Usuario inactivo.')
        data['user'] = user
        return data


class PermisoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permiso
        fields = ['id', 'nombre', 'codigo', 'recurso', 'accion']


class RolSerializer(serializers.ModelSerializer):
    permisos = serializers.SerializerMethodField()

    class Meta:
        model = Rol
        fields = ['id', 'nombre', 'codigo', 'descripcion', 'nivel_jerarquico', 'es_sistema', 'permisos']

    def get_permisos(self, obj):
        permisos = Permiso.objects.filter(permiso_roles__rol=obj)
        return PermisoSerializer(permisos, many=True).data


class UsuarioRolSerializer(serializers.ModelSerializer):
    rol_nombre = serializers.CharField(source='rol.nombre', read_only=True)
    rol_codigo = serializers.CharField(source='rol.codigo', read_only=True)
    unidad_nombre = serializers.CharField(source='unidad_organica.nombre', read_only=True, default=None)

    class Meta:
        model = UsuarioRol
        fields = ['id', 'rol', 'rol_nombre', 'rol_codigo', 'unidad_organica', 'unidad_nombre', 'incluir_hijos']


class UsuarioSerializer(serializers.ModelSerializer):
    roles = serializers.SerializerMethodField()
    permisos = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'dni', 'telefono', 'cargo', 'is_active', 'is_staff',
            'is_superuser', 'roles', 'permisos', 'last_login',
        ]
        read_only_fields = ['is_superuser', 'last_login']

    def get_roles(self, obj):
        usuario_roles = UsuarioRol.objects.filter(usuario=obj).select_related('rol', 'unidad_organica')
        return UsuarioRolSerializer(usuario_roles, many=True).data

    def get_permisos(self, obj):
        if obj.is_superuser:
            return ['*.*']
        roles_ids = UsuarioRol.objects.filter(usuario=obj).values_list('rol_id', flat=True)
        permisos = Permiso.objects.filter(permiso_roles__rol_id__in=roles_ids).distinct()
        return [p.codigo for p in permisos]


class UsuarioCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = Usuario
        fields = [
            'id', 'username', 'email', 'password', 'first_name', 'last_name',
            'dni', 'telefono', 'cargo', 'is_active',
        ]

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = Usuario(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UsuarioUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = [
            'email', 'first_name', 'last_name',
            'dni', 'telefono', 'cargo', 'is_active',
        ]


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Contraseña actual incorrecta.')
        return value
