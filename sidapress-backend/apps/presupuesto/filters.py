import django_filters
from .models import Meta, EjecucionPresupuestal


class MetaFilter(django_filters.FilterSet):
    anio = django_filters.NumberFilter(field_name='anio_fiscal__anio')
    unidad = django_filters.NumberFilter(field_name='unidad_organica__id')
    tipo = django_filters.CharFilter(field_name='tipo_meta')
    tipo_actividad = django_filters.CharFilter(field_name='tipo_actividad')

    class Meta:
        model = Meta
        fields = ['anio', 'unidad', 'tipo', 'tipo_actividad', 'is_active']


class EjecucionFilter(django_filters.FilterSet):
    anio = django_filters.NumberFilter(field_name='anio_fiscal__anio')
    meta = django_filters.NumberFilter(field_name='meta__id')
    meta_codigo = django_filters.CharFilter(field_name='meta__codigo')
    rubro = django_filters.NumberFilter(field_name='rubro__id')
    fuente = django_filters.NumberFilter(field_name='rubro__fuente__id')
    clasificador = django_filters.NumberFilter(field_name='clasificador_gasto__id')
    generica = django_filters.CharFilter(field_name='clasificador_gasto__generica')
    categoria_gasto = django_filters.CharFilter(field_name='codigo_categoria_gasto')
    unidad = django_filters.NumberFilter(field_name='meta__unidad_organica__id')
    pim_min = django_filters.NumberFilter(field_name='pim', lookup_expr='gte')
    pim_max = django_filters.NumberFilter(field_name='pim', lookup_expr='lte')

    class Meta:
        model = EjecucionPresupuestal
        fields = ['anio', 'meta', 'rubro', 'fuente', 'clasificador', 'categoria_gasto', 'unidad']
