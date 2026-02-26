from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Usuario, Rol, Permiso, UsuarioRol, RolPermiso
from .serializers import (
    LoginSerializer, UsuarioSerializer, UsuarioCreateSerializer,
    UsuarioUpdateSerializer, ChangePasswordSerializer,
    RolSerializer, PermisoSerializer, UsuarioRolSerializer,
)
from apps.auditoria.services import AuditService


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    user = serializer.validated_data['user']
    refresh = RefreshToken.for_user(user)

    ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', ''))
    if ',' in ip:
        ip = ip.split(',')[0].strip()
    user_agent = request.META.get('HTTP_USER_AGENT', '')

    AuditService.log_login(user, ip_address=ip, user_agent=user_agent)
    AuditService.registrar_sesion(
        usuario=user,
        token_jti=str(refresh['jti']),
        ip_address=ip,
        user_agent=user_agent,
    )

    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': UsuarioSerializer(user).data,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            AuditService.cerrar_sesion(str(token['jti']))
            token.blacklist()
    except Exception:
        pass

    ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', ''))
    if ',' in ip:
        ip = ip.split(',')[0].strip()
    AuditService.log_logout(request.user, ip_address=ip,
                            user_agent=request.META.get('HTTP_USER_AGENT', ''))

    return Response({'detail': 'Sesión cerrada correctamente.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    serializer = UsuarioSerializer(request.user)
    return Response(serializer.data)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile_view(request):
    serializer = UsuarioUpdateSerializer(request.user, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(UsuarioSerializer(request.user).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
    serializer.is_valid(raise_exception=True)
    request.user.set_password(serializer.validated_data['new_password'])
    request.user.save()
    return Response({'detail': 'Contraseña actualizada correctamente.'})


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all().order_by('username')
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_serializer_class(self):
        if self.action == 'create':
            return UsuarioCreateSerializer
        if self.action in ['update', 'partial_update']:
            return UsuarioUpdateSerializer
        return UsuarioSerializer

    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)

    @action(detail=True, methods=['post'])
    def asignar_rol(self, request, pk=None):
        usuario = self.get_object()
        rol_id = request.data.get('rol_id')
        unidad_organica_id = request.data.get('unidad_organica_id')
        incluir_hijos = request.data.get('incluir_hijos', False)

        if not rol_id:
            return Response({'detail': 'rol_id es requerido.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            rol = Rol.objects.get(id=rol_id)
        except Rol.DoesNotExist:
            return Response({'detail': 'Rol no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        usuario_rol, created = UsuarioRol.objects.get_or_create(
            usuario=usuario,
            rol=rol,
            unidad_organica_id=unidad_organica_id,
            defaults={
                'incluir_hijos': incluir_hijos,
                'asignado_por': request.user,
            }
        )

        if not created:
            return Response({'detail': 'El usuario ya tiene este rol asignado.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'detail': 'Rol asignado correctamente.'}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def quitar_rol(self, request, pk=None):
        usuario = self.get_object()
        usuario_rol_id = request.data.get('usuario_rol_id')

        deleted, _ = UsuarioRol.objects.filter(id=usuario_rol_id, usuario=usuario).delete()
        if not deleted:
            return Response({'detail': 'Asignación no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        return Response({'detail': 'Rol removido correctamente.'})


class RolViewSet(viewsets.ModelViewSet):
    queryset = Rol.objects.all()
    serializer_class = RolSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    @action(detail=True, methods=['post'])
    def asignar_permiso(self, request, pk=None):
        rol = self.get_object()
        permiso_id = request.data.get('permiso_id')

        if not permiso_id:
            return Response({'detail': 'permiso_id es requerido.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            permiso = Permiso.objects.get(id=permiso_id)
        except Permiso.DoesNotExist:
            return Response({'detail': 'Permiso no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        _, created = RolPermiso.objects.get_or_create(rol=rol, permiso=permiso)
        if not created:
            return Response({'detail': 'Permiso ya asignado.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'detail': 'Permiso asignado.'}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def quitar_permiso(self, request, pk=None):
        rol = self.get_object()
        permiso_id = request.data.get('permiso_id')

        deleted, _ = RolPermiso.objects.filter(rol=rol, permiso_id=permiso_id).delete()
        if not deleted:
            return Response({'detail': 'Permiso no encontrado en este rol.'}, status=status.HTTP_404_NOT_FOUND)

        return Response({'detail': 'Permiso removido.'})


class PermisoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Permiso.objects.all()
    serializer_class = PermisoSerializer
    permission_classes = [IsAuthenticated]
