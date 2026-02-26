from django.http import HttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.presupuesto.services.calculator_service import (
    get_resumen_general, get_ejecucion_mensual_acumulada,
    get_ejecucion_por_fuente, get_ejecucion_por_unidad, get_top_metas,
)
from apps.catalogos.models import AnioFiscal
from .generators.pdf_generator import (
    generar_reporte_resumen_pdf, generar_reporte_por_unidad_pdf,
    generar_reporte_top_metas_pdf,
)
from .generators.excel_generator import (
    generar_reporte_resumen_excel, generar_reporte_por_unidad_excel,
    generar_reporte_metas_excel, generar_reporte_tendencia_excel,
)


def _get_anio(request):
    anio_id = request.query_params.get('anio_fiscal_id')
    if anio_id:
        return int(anio_id)
    anio = AnioFiscal.objects.filter(is_active=True).first()
    return anio.id if anio else None


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def reporte_resumen_pdf(request):
    anio_id = _get_anio(request)
    if not anio_id:
        return Response({'detail': 'No hay año fiscal activo.'}, status=400)

    anio_obj = AnioFiscal.objects.get(id=anio_id)
    resumen = get_resumen_general(anio_id)
    buffer = generar_reporte_resumen_pdf(resumen, anio_obj.anio)

    response = HttpResponse(buffer.read(), content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="resumen_presupuestal_{anio_obj.anio}.pdf"'
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def reporte_resumen_excel(request):
    anio_id = _get_anio(request)
    if not anio_id:
        return Response({'detail': 'No hay año fiscal activo.'}, status=400)

    anio_obj = AnioFiscal.objects.get(id=anio_id)
    resumen = get_resumen_general(anio_id)
    buffer = generar_reporte_resumen_excel(resumen, anio_obj.anio)

    response = HttpResponse(
        buffer.read(),
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = f'attachment; filename="resumen_presupuestal_{anio_obj.anio}.xlsx"'
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def reporte_por_unidad_pdf(request):
    anio_id = _get_anio(request)
    if not anio_id:
        return Response({'detail': 'No hay año fiscal activo.'}, status=400)

    anio_obj = AnioFiscal.objects.get(id=anio_id)
    datos = get_ejecucion_por_unidad(anio_id)
    buffer = generar_reporte_por_unidad_pdf(datos, anio_obj.anio)

    response = HttpResponse(buffer.read(), content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="ejecucion_por_unidad_{anio_obj.anio}.pdf"'
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def reporte_por_unidad_excel(request):
    anio_id = _get_anio(request)
    if not anio_id:
        return Response({'detail': 'No hay año fiscal activo.'}, status=400)

    anio_obj = AnioFiscal.objects.get(id=anio_id)
    datos = get_ejecucion_por_unidad(anio_id)
    buffer = generar_reporte_por_unidad_excel(datos, anio_obj.anio)

    response = HttpResponse(
        buffer.read(),
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = f'attachment; filename="ejecucion_por_unidad_{anio_obj.anio}.xlsx"'
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def reporte_metas_pdf(request):
    anio_id = _get_anio(request)
    if not anio_id:
        return Response({'detail': 'No hay año fiscal activo.'}, status=400)

    anio_obj = AnioFiscal.objects.get(id=anio_id)
    limit = int(request.query_params.get('limit', 50))
    order = request.query_params.get('order', 'mayor_pim')
    datos = get_top_metas(anio_id, limit=limit, order=order)
    buffer = generar_reporte_top_metas_pdf(datos, anio_obj.anio)

    response = HttpResponse(buffer.read(), content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="metas_{anio_obj.anio}.pdf"'
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def reporte_metas_excel(request):
    anio_id = _get_anio(request)
    if not anio_id:
        return Response({'detail': 'No hay año fiscal activo.'}, status=400)

    anio_obj = AnioFiscal.objects.get(id=anio_id)
    limit = int(request.query_params.get('limit', 50))
    order = request.query_params.get('order', 'mayor_pim')
    datos = get_top_metas(anio_id, limit=limit, order=order)
    buffer = generar_reporte_metas_excel(datos, anio_obj.anio)

    response = HttpResponse(
        buffer.read(),
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = f'attachment; filename="metas_{anio_obj.anio}.xlsx"'
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def reporte_tendencia_excel(request):
    anio_id = _get_anio(request)
    if not anio_id:
        return Response({'detail': 'No hay año fiscal activo.'}, status=400)

    anio_obj = AnioFiscal.objects.get(id=anio_id)
    datos = get_ejecucion_mensual_acumulada(anio_id)
    buffer = generar_reporte_tendencia_excel(datos, anio_obj.anio)

    response = HttpResponse(
        buffer.read(),
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = f'attachment; filename="tendencia_mensual_{anio_obj.anio}.xlsx"'
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def reportes_disponibles(request):
    """Lista los reportes disponibles."""
    return Response([
        {
            'id': 'resumen',
            'nombre': 'Resumen de Ejecución Presupuestal',
            'descripcion': 'Resumen general con PIA, PIM, certificado, devengado e indicadores de avance.',
            'formatos': ['pdf', 'excel'],
        },
        {
            'id': 'por_unidad',
            'nombre': 'Ejecución por Unidad Orgánica',
            'descripcion': 'Detalle de ejecución presupuestal agrupada por cada unidad orgánica.',
            'formatos': ['pdf', 'excel'],
        },
        {
            'id': 'metas',
            'nombre': 'Reporte de Metas',
            'descripcion': 'Listado de metas con PIM, devengado y avance porcentual.',
            'formatos': ['pdf', 'excel'],
        },
        {
            'id': 'tendencia',
            'nombre': 'Tendencia Mensual',
            'descripcion': 'Ejecución mensual y acumulada de compromiso, devengado y girado.',
            'formatos': ['excel'],
        },
    ])
