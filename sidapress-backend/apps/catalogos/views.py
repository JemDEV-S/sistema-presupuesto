from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from apps.authentication.permissions import HasPermission
from .models import AnioFiscal, FuenteFinanciamiento, Rubro, ClasificadorGasto
from .serializers import (
    AnioFiscalSerializer, FuenteFinanciamientoSerializer,
    RubroSerializer, ClasificadorGastoSerializer,
)


class AnioFiscalViewSet(viewsets.ModelViewSet):
    queryset = AnioFiscal.objects.all()
    serializer_class = AnioFiscalSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['is_active', 'is_cerrado']


class FuenteFinanciamientoViewSet(viewsets.ModelViewSet):
    queryset = FuenteFinanciamiento.objects.all()
    serializer_class = FuenteFinanciamientoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['is_active']
    search_fields = ['codigo', 'nombre']


class RubroViewSet(viewsets.ModelViewSet):
    queryset = Rubro.objects.select_related('fuente').all()
    serializer_class = RubroSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['is_active', 'fuente']
    search_fields = ['codigo', 'nombre']


class ClasificadorGastoViewSet(viewsets.ModelViewSet):
    queryset = ClasificadorGasto.objects.all()
    serializer_class = ClasificadorGastoSerializer
    filterset_fields = ['is_active', 'generica']
    search_fields = ['codigo', 'nombre']

    permission_map = {
        'list': 'clasificador.view', 'retrieve': 'clasificador.view',
        'create': 'clasificador.create',
        'update': 'clasificador.edit', 'partial_update': 'clasificador.edit',
        'destroy': 'clasificador.delete',
    }

    def get_permissions(self):
        self.required_permission = self.permission_map.get(self.action)
        return [IsAuthenticated(), HasPermission()]
