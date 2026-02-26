import django_filters
from .models import LogAuditoria, SesionUsuario


class LogAuditoriaFilter(django_filters.FilterSet):
    fecha_desde = django_filters.DateTimeFilter(field_name='fecha_hora', lookup_expr='gte')
    fecha_hasta = django_filters.DateTimeFilter(field_name='fecha_hora', lookup_expr='lte')
    usuario = django_filters.NumberFilter(field_name='usuario_id')

    class Meta:
        model = LogAuditoria
        fields = ['accion', 'tabla', 'usuario']


class SesionUsuarioFilter(django_filters.FilterSet):
    usuario = django_filters.NumberFilter(field_name='usuario_id')

    class Meta:
        model = SesionUsuario
        fields = ['usuario', 'is_active']
