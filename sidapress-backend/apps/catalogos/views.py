from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
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
    permission_classes = [IsAuthenticated]
    filterset_fields = ['is_active', 'generica']
    search_fields = ['codigo', 'nombre']
