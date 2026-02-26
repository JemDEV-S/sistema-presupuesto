from rest_framework import serializers
from .models import ImportacionArchivo


class ImportacionArchivoSerializer(serializers.ModelSerializer):
    importado_por_nombre = serializers.SerializerMethodField()

    class Meta:
        model = ImportacionArchivo
        fields = [
            'id', 'nombre_archivo', 'hash_archivo', 'tamanio', 'anio_fiscal',
            'estado', 'total_filas', 'filas_procesadas', 'filas_con_error',
            'filas_creadas', 'filas_actualizadas', 'filas_sin_cambios',
            'estadisticas_detalle',
            'log_errores', 'importado_por', 'importado_por_nombre',
            'fecha_inicio', 'fecha_fin',
        ]
        read_only_fields = [
            'hash_archivo', 'tamanio', 'estado', 'total_filas',
            'filas_procesadas', 'filas_con_error',
            'filas_creadas', 'filas_actualizadas', 'filas_sin_cambios',
            'estadisticas_detalle', 'log_errores',
            'fecha_inicio', 'fecha_fin',
        ]

    def get_importado_por_nombre(self, obj):
        if obj.importado_por:
            return f'{obj.importado_por.first_name} {obj.importado_por.last_name}'
        return None


class UploadExcelSerializer(serializers.Serializer):
    archivo = serializers.FileField()
    anio_fiscal = serializers.IntegerField()
    forzar = serializers.BooleanField(default=False, required=False)
