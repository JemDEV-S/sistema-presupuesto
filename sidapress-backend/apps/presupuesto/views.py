from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.catalogos.models import AnioFiscal
from apps.authentication.permissions import get_user_unidades, HasPermission
from apps.organizacion.models import UnidadOrganica
from .models import Meta, EjecucionPresupuestal, EjecucionMensual, ModificacionPresupuestal, AvanceFisico
from .serializers import (
    MetaSerializer, EjecucionPresupuestalSerializer,
    EjecucionMensualSerializer, ModificacionPresupuestalSerializer,
    AvanceFisicoSerializer,
)
from .filters import MetaFilter, EjecucionFilter
from .services.calculator_service import (
    get_resumen_general, get_ejecucion_mensual_acumulada,
    get_ejecucion_por_fuente, get_ejecucion_por_generica,
    get_ejecucion_por_unidad, get_top_metas,
    get_resumen_filtrado, get_metas_por_unidad, get_clasificadores_por_unidad,
    get_ejecucion_por_rubro, get_ejecucion_por_tipo_meta,
    get_ejecucion_por_producto_proyecto, get_tendencia_filtrada,
    get_ejecucion_por_clasificador_detalle,
)


def _get_allowed_unidad_ids(user):
    """Retorna lista de IDs de unidades permitidas, o None para acceso global."""
    return get_user_unidades(user)


def _validate_unidad_access(user, unidad_codigo):
    """Verifica si el usuario tiene acceso a una unidad específica."""
    allowed_ids = _get_allowed_unidad_ids(user)
    if allowed_ids is None:
        return True
    allowed_codigos = set(
        UnidadOrganica.objects.filter(id__in=allowed_ids).values_list('codigo', flat=True)
    )
    return unidad_codigo in allowed_codigos


def _resolve_anio(request):
    """Resuelve el año fiscal desde query params o usa el activo."""
    anio_fiscal_id = request.query_params.get('anio_fiscal_id')
    if anio_fiscal_id:
        try:
            return AnioFiscal.objects.get(id=int(anio_fiscal_id))
        except AnioFiscal.DoesNotExist:
            return None

    anio = request.query_params.get('anio')
    if anio:
        try:
            return AnioFiscal.objects.get(anio=int(anio))
        except AnioFiscal.DoesNotExist:
            return None

    return AnioFiscal.objects.filter(is_active=True).first()


class MetaViewSet(viewsets.ModelViewSet):
    serializer_class = MetaSerializer
    filterset_class = MetaFilter
    search_fields = ['codigo', 'nombre', 'finalidad']
    ordering_fields = ['codigo', 'nombre']

    permission_map = {
        'list': 'metas.view', 'retrieve': 'metas.view',
        'create': 'metas.create',
        'update': 'metas.edit', 'partial_update': 'metas.edit',
        'destroy': 'metas.delete',
    }

    def get_permissions(self):
        self.required_permission = self.permission_map.get(self.action)
        return [IsAuthenticated(), HasPermission()]

    def get_queryset(self):
        qs = Meta.objects.select_related('anio_fiscal', 'unidad_organica').all()
        allowed = _get_allowed_unidad_ids(self.request.user)
        if allowed is not None:
            qs = qs.filter(unidad_organica_id__in=allowed)
        return qs


class EjecucionPresupuestalViewSet(viewsets.ModelViewSet):
    serializer_class = EjecucionPresupuestalSerializer
    permission_classes = [IsAuthenticated]
    filterset_class = EjecucionFilter
    search_fields = ['meta__codigo', 'meta__nombre']
    ordering_fields = ['pim', 'certificado', 'meta__codigo']

    def get_queryset(self):
        qs = EjecucionPresupuestal.objects.select_related(
            'anio_fiscal', 'meta', 'rubro', 'rubro__fuente', 'clasificador_gasto'
        ).prefetch_related('mensuales').all()
        allowed = _get_allowed_unidad_ids(self.request.user)
        if allowed is not None:
            qs = qs.filter(meta__unidad_organica_id__in=allowed)
        return qs


class EjecucionMensualViewSet(viewsets.ModelViewSet):
    serializer_class = EjecucionMensualSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['ejecucion', 'mes']

    def get_queryset(self):
        qs = EjecucionMensual.objects.select_related(
            'ejecucion', 'ejecucion__meta', 'ejecucion__rubro'
        ).all()
        allowed = _get_allowed_unidad_ids(self.request.user)
        if allowed is not None:
            qs = qs.filter(ejecucion__meta__unidad_organica_id__in=allowed)
        return qs


class ModificacionViewSet(viewsets.ModelViewSet):
    serializer_class = ModificacionPresupuestalSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['ejecucion', 'tipo']

    def get_queryset(self):
        qs = ModificacionPresupuestal.objects.select_related(
            'ejecucion', 'ejecucion__meta'
        ).all()
        allowed = _get_allowed_unidad_ids(self.request.user)
        if allowed is not None:
            qs = qs.filter(ejecucion__meta__unidad_organica_id__in=allowed)
        return qs


class AvanceFisicoViewSet(viewsets.ModelViewSet):
    serializer_class = AvanceFisicoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['meta']

    def get_queryset(self):
        qs = AvanceFisico.objects.select_related('meta', 'meta__unidad_organica').all()
        allowed = _get_allowed_unidad_ids(self.request.user)
        if allowed is not None:
            qs = qs.filter(meta__unidad_organica_id__in=allowed)
        return qs


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_resumen(request):
    anio_obj = _resolve_anio(request)
    if not anio_obj:
        return Response({'detail': 'No hay año fiscal activo.'}, status=400)
    allowed = _get_allowed_unidad_ids(request.user)
    resumen = get_resumen_general(anio_obj.id, allowed_unidad_ids=allowed)
    resumen['anio'] = anio_obj.anio
    return Response(resumen)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_tendencia(request):
    anio_obj = _resolve_anio(request)
    if not anio_obj:
        return Response([])
    allowed = _get_allowed_unidad_ids(request.user)
    return Response(get_ejecucion_mensual_acumulada(anio_obj.id, allowed_unidad_ids=allowed))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_por_fuente(request):
    anio_obj = _resolve_anio(request)
    if not anio_obj:
        return Response([])
    allowed = _get_allowed_unidad_ids(request.user)
    return Response(get_ejecucion_por_fuente(anio_obj.id, allowed_unidad_ids=allowed))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_por_generica(request):
    anio_obj = _resolve_anio(request)
    if not anio_obj:
        return Response([])
    allowed = _get_allowed_unidad_ids(request.user)
    return Response(get_ejecucion_por_generica(anio_obj.id, allowed_unidad_ids=allowed))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_por_unidad(request):
    anio_obj = _resolve_anio(request)
    if not anio_obj:
        return Response([])
    allowed = _get_allowed_unidad_ids(request.user)
    return Response(get_ejecucion_por_unidad(anio_obj.id, allowed_unidad_ids=allowed))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_top_metas(request):
    anio_obj = _resolve_anio(request)
    if not anio_obj:
        return Response([])
    limit = int(request.query_params.get('limit', 10))
    order = request.query_params.get('order', 'mayor_pim')
    allowed = _get_allowed_unidad_ids(request.user)
    return Response(get_top_metas(anio_obj.id, limit=limit, order=order, allowed_unidad_ids=allowed))


def _extract_filters(request):
    """Extrae filtros comunes de query params. Acepta códigos (string) o IDs numéricos.
    Inyecta filtro de seguridad por unidades permitidas del usuario."""
    filters = {}
    if request.query_params.get('unidad_id'):
        filters['unidad_codigo'] = request.query_params['unidad_id']
    if request.query_params.get('fuente_id'):
        filters['fuente_codigo'] = request.query_params['fuente_id']
    if request.query_params.get('rubro_id'):
        filters['rubro_id'] = int(request.query_params['rubro_id'])
    if request.query_params.get('tipo_meta'):
        filters['tipo_meta'] = request.query_params['tipo_meta']
    if request.query_params.get('tipo_actividad'):
        filters['tipo_actividad'] = request.query_params['tipo_actividad']
    if request.query_params.get('generica'):
        filters['generica'] = request.query_params['generica']

    # Seguridad: inyectar unidades permitidas del usuario
    allowed = _get_allowed_unidad_ids(request.user)
    if allowed is not None:
        filters['allowed_unidad_ids'] = allowed

    return filters


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_unidad_detalle(request):
    """Resumen de ejecución para una unidad orgánica específica."""
    anio_obj = _resolve_anio(request)
    if not anio_obj:
        return Response({'detail': 'No hay año fiscal activo.'}, status=400)
    unidad_id = request.query_params.get('unidad_id')
    if not unidad_id:
        return Response({'detail': 'Se requiere unidad_id.'}, status=400)
    if not _validate_unidad_access(request.user, unidad_id):
        return Response({'detail': 'No tiene acceso a esta unidad.'}, status=403)
    filters = _extract_filters(request)
    return Response(get_resumen_filtrado(anio_obj.id, filters))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_unidad_metas(request):
    """Metas con detalle de ejecución para una unidad orgánica."""
    anio_obj = _resolve_anio(request)
    if not anio_obj:
        return Response([])
    unidad_id = request.query_params.get('unidad_id')
    if not unidad_id:
        return Response([])
    if not _validate_unidad_access(request.user, unidad_id):
        return Response({'detail': 'No tiene acceso a esta unidad.'}, status=403)
    return Response(get_metas_por_unidad(anio_obj.id, unidad_id))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_unidad_clasificadores(request):
    """Clasificadores de gasto para una unidad orgánica."""
    anio_obj = _resolve_anio(request)
    if not anio_obj:
        return Response([])
    unidad_id = request.query_params.get('unidad_id')
    if not unidad_id:
        return Response([])
    if not _validate_unidad_access(request.user, unidad_id):
        return Response({'detail': 'No tiene acceso a esta unidad.'}, status=403)
    return Response(get_clasificadores_por_unidad(anio_obj.id, unidad_id))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_por_rubro(request):
    """Ejecución agrupada por rubro."""
    anio_obj = _resolve_anio(request)
    if not anio_obj:
        return Response([])
    filters = _extract_filters(request)
    return Response(get_ejecucion_por_rubro(anio_obj.id, filters))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_por_tipo_meta(request):
    """Ejecución agrupada por tipo de meta (PRODUCTO vs PROYECTO)."""
    anio_obj = _resolve_anio(request)
    if not anio_obj:
        return Response([])
    filters = _extract_filters(request)
    return Response(get_ejecucion_por_tipo_meta(anio_obj.id, filters))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_por_producto_proyecto(request):
    """Ejecución agrupada por producto/proyecto."""
    anio_obj = _resolve_anio(request)
    if not anio_obj:
        return Response([])
    filters = _extract_filters(request)
    return Response(get_ejecucion_por_producto_proyecto(anio_obj.id, filters))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_clasificador_detalle(request):
    """Ejecución detallada por clasificador de gasto."""
    anio_obj = _resolve_anio(request)
    if not anio_obj:
        return Response([])
    filters = _extract_filters(request)
    return Response(get_ejecucion_por_clasificador_detalle(anio_obj.id, filters))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_tendencia_filtrada(request):
    """Tendencia mensual con filtros opcionales."""
    anio_obj = _resolve_anio(request)
    if not anio_obj:
        return Response([])
    filters = _extract_filters(request)
    return Response(get_tendencia_filtrada(anio_obj.id, filters))
