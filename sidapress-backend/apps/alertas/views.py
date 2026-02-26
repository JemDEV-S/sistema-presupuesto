from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from .models import Alerta, NotificacionUsuario
from .serializers import AlertaSerializer, NotificacionUsuarioSerializer
from .generators.alert_generator import generar_alertas
from apps.catalogos.models import AnioFiscal


class AlertaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Alerta.objects.all()
    serializer_class = AlertaSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['tipo_alerta', 'nivel_severidad', 'estado', 'anio_fiscal']
    ordering_fields = ['fecha_creacion', 'nivel_severidad']

    @action(detail=True, methods=['post'])
    def resolver(self, request, pk=None):
        alerta = self.get_object()
        alerta.estado = 'RESUELTA'
        alerta.fecha_resolucion = timezone.now()
        alerta.save()
        return Response({'detail': 'Alerta marcada como resuelta.'})


class NotificacionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificacionUsuarioSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return NotificacionUsuario.objects.filter(
            usuario=self.request.user
        ).select_related('alerta')

    @action(detail=True, methods=['post'])
    def leer(self, request, pk=None):
        notif = self.get_object()
        notif.is_leida = True
        notif.fecha_lectura = timezone.now()
        notif.save()
        return Response({'detail': 'Notificación marcada como leída.'})

    @action(detail=False, methods=['post'])
    def leer_todas(self, request):
        updated = NotificacionUsuario.objects.filter(
            usuario=request.user, is_leida=False
        ).update(is_leida=True, fecha_lectura=timezone.now())
        return Response({'detail': f'{updated} notificaciones marcadas como leídas.'})

    @action(detail=False, methods=['get'])
    def no_leidas(self, request):
        count = NotificacionUsuario.objects.filter(
            usuario=request.user, is_leida=False
        ).count()
        return Response({'count': count})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generar_alertas_view(request):
    """Genera alertas automáticas para un año fiscal."""
    anio = request.data.get('anio')
    if not anio:
        anio_obj = AnioFiscal.objects.filter(is_active=True).first()
    else:
        try:
            anio_obj = AnioFiscal.objects.get(anio=int(anio))
        except AnioFiscal.DoesNotExist:
            return Response({'detail': 'Año fiscal no encontrado.'}, status=404)

    if not anio_obj:
        return Response({'detail': 'No hay año fiscal activo.'}, status=400)

    alertas = generar_alertas(anio_obj)
    return Response({
        'detail': f'Se generaron {len(alertas)} alertas.',
        'total': len(alertas),
        'alertas': AlertaSerializer(alertas, many=True).data,
    })
