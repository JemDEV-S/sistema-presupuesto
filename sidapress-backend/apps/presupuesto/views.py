from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.catalogos.models import AnioFiscal
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
    queryset = Meta.objects.select_related('anio_fiscal', 'unidad_organica').all()
    serializer_class = MetaSerializer
    permission_classes = [IsAuthenticated]
    filterset_class = MetaFilter
    search_fields = ['codigo', 'nombre', 'finalidad']
    ordering_fields = ['codigo', 'nombre']


class EjecucionPresupuestalViewSet(viewsets.ModelViewSet):
    queryset = EjecucionPresupuestal.objects.select_related(
        'anio_fiscal', 'meta', 'rubro', 'rubro__fuente', 'clasificador_gasto'
    ).prefetch_related('mensuales').all()
    serializer_class = EjecucionPresupuestalSerializer
    permission_classes = [IsAuthenticated]
    filterset_class = EjecucionFilter
    search_fields = ['meta__codigo', 'meta__nombre']
    ordering_fields = ['pim', 'certificado', 'meta__codigo']


class EjecucionMensualViewSet(viewsets.ModelViewSet):
    queryset = EjecucionMensual.objects.select_related(
        'ejecucion', 'ejecucion__meta', 'ejecucion__rubro'
    ).all()
    serializer_class = EjecucionMensualSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['ejecucion', 'mes']


class ModificacionViewSet(viewsets.ModelViewSet):
    queryset = ModificacionPresupuestal.objects.select_related(
        'ejecucion', 'ejecucion__meta'
    ).all()
    serializer_class = ModificacionPresupuestalSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['ejecucion', 'tipo']


class AvanceFisicoViewSet(viewsets.ModelViewSet):
    queryset = AvanceFisico.objects.select_related('meta', 'meta__unidad_organica').all()
    serializer_class = AvanceFisicoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['meta']


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_resumen(request):
    anio_obj = _resolve_anio(request)
    if not anio_obj:
        return Response({'detail': 'No hay año fiscal activo.'}, status=400)
    resumen = get_resumen_general(anio_obj.id)
    resumen['anio'] = anio_obj.anio
    return Response(resumen)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_tendencia(request):
    anio_obj = _resolve_anio(request)
    if not anio_obj:
        return Response([])
    return Response(get_ejecucion_mensual_acumulada(anio_obj.id))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_por_fuente(request):
    anio_obj = _resolve_anio(request)
    if not anio_obj:
        return Response([])
    return Response(get_ejecucion_por_fuente(anio_obj.id))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_por_generica(request):
    anio_obj = _resolve_anio(request)
    if not anio_obj:
        return Response([])
    return Response(get_ejecucion_por_generica(anio_obj.id))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_por_unidad(request):
    anio_obj = _resolve_anio(request)
    if not anio_obj:
        return Response([])
    return Response(get_ejecucion_por_unidad(anio_obj.id))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_top_metas(request):
    anio_obj = _resolve_anio(request)
    if not anio_obj:
        return Response([])
    limit = int(request.query_params.get('limit', 10))
    order = request.query_params.get('order', 'mayor_pim')
    return Response(get_top_metas(anio_obj.id, limit=limit, order=order))


def _extract_filters(request):
    """Extrae filtros comunes de query params. Acepta códigos (string) o IDs numéricos."""
    filters = {}
    if request.query_params.get('unidad_id'):
        filters['unidad_codigo'] = request.query_params['unidad_id']
    if request.query_params.get('fuente_id'):
        filters['fuente_codigo'] = request.query_params['fuente_id']
    if request.query_params.get('rubro_id'):
        filters['rubro_id'] = int(request.query_params['rubro_id'])
    if request.query_params.get('tipo_meta'):
        filters['tipo_meta'] = request.query_params['tipo_meta']
    if request.query_params.get('generica'):
        filters['generica'] = request.query_params['generica']
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
    """Ejecución agrupada por tipo de meta (ACTIVIDAD vs PROYECTO)."""
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
