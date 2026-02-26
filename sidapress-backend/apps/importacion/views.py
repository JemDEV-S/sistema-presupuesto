import hashlib
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.conf import settings
from .models import ImportacionArchivo
from .serializers import ImportacionArchivoSerializer, UploadExcelSerializer
from .importers.excel_mef_importer import process_excel_file
from apps.catalogos.models import AnioFiscal


class ImportacionArchivoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ImportacionArchivo.objects.all()
    serializer_class = ImportacionArchivoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['estado', 'anio_fiscal']


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_excel(request):
    """Sube y procesa un archivo Excel del MEF."""
    serializer = UploadExcelSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    archivo = request.FILES.get('archivo')
    anio_fiscal_id = serializer.validated_data['anio_fiscal']

    if not archivo:
        return Response({'detail': 'No se proporcionó archivo.'}, status=400)

    # Validar extensión
    name = archivo.name.lower()
    if not (name.endswith('.xlsx') or name.endswith('.xls')):
        return Response({'detail': 'El archivo debe ser Excel (.xlsx o .xls).'}, status=400)

    # Validar tamaño
    max_size = getattr(settings, 'MAX_UPLOAD_SIZE', 50 * 1024 * 1024)
    if archivo.size > max_size:
        return Response({'detail': f'Archivo excede tamaño máximo ({max_size // (1024*1024)}MB).'}, status=400)

    # Validar año fiscal
    try:
        anio = AnioFiscal.objects.get(id=anio_fiscal_id)
    except AnioFiscal.DoesNotExist:
        return Response({'detail': 'Año fiscal no encontrado.'}, status=404)

    # Calcular hash
    sha256 = hashlib.sha256()
    for chunk in archivo.chunks():
        sha256.update(chunk)
    file_hash = sha256.hexdigest()
    archivo.seek(0)

    # Verificar si el mismo archivo ya fue importado (por hash)
    forzar = serializer.validated_data.get('forzar', False)
    importacion_existente = ImportacionArchivo.objects.filter(
        hash_archivo=file_hash
    ).order_by('-fecha_inicio').first()

    if importacion_existente and not forzar:
        return Response({
            'detail': 'Este archivo ya fue importado anteriormente.',
            'importacion_anterior': ImportacionArchivoSerializer(importacion_existente).data,
            'mensaje': 'Envíe forzar=true para reimportar. Solo se actualizarán registros con montos diferentes.',
        }, status=409)

    # Crear registro de importación
    importacion = ImportacionArchivo.objects.create(
        archivo=archivo,
        nombre_archivo=archivo.name,
        hash_archivo=file_hash,
        tamanio=archivo.size,
        anio_fiscal=anio,
        importado_por=request.user,
    )

    # Procesar archivo
    success = process_excel_file(importacion, user=request.user)

    # Refrescar desde DB
    importacion.refresh_from_db()
    response_data = ImportacionArchivoSerializer(importacion).data

    if success:
        return Response(response_data, status=201)
    else:
        return Response(response_data, status=400)
