from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from .models import LogAuditoria, SesionUsuario
from .serializers import LogAuditoriaSerializer, SesionUsuarioSerializer
from .filters import LogAuditoriaFilter, SesionUsuarioFilter
from .services import AuditService


class LogAuditoriaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = LogAuditoria.objects.select_related('usuario').all()
    serializer_class = LogAuditoriaSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filterset_class = LogAuditoriaFilter
    search_fields = ['tabla', 'usuario__username', 'usuario__first_name']
    ordering_fields = ['fecha_hora', 'accion', 'tabla']


class SesionUsuarioViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SesionUsuario.objects.select_related('usuario').all()
    serializer_class = SesionUsuarioSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filterset_class = SesionUsuarioFilter
    ordering_fields = ['fecha_inicio', 'is_active']


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def estadisticas_auditoria(request):
    dias = int(request.query_params.get('dias', 30))
    stats = AuditService.get_estadisticas(dias=dias)
    return Response(stats)
