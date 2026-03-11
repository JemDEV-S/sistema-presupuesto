from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import UnidadOrganica
from .serializers import UnidadOrganicaSerializer, UnidadOrganicaTreeSerializer


class UnidadOrganicaViewSet(viewsets.ModelViewSet):
    queryset = UnidadOrganica.objects.select_related('parent', 'responsable').all()
    serializer_class = UnidadOrganicaSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['nivel', 'is_active', 'parent']
    search_fields = ['codigo', 'nombre']

    @action(detail=False, methods=['get'])
    def tree(self, request):
        """Retorna la estructura organizacional como árbol."""
        raices = UnidadOrganica.objects.filter(
            parent__isnull=True, is_active=True
        ).order_by('codigo')
        serializer = UnidadOrganicaTreeSerializer(raices, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def hijos(self, request, pk=None):
        """Retorna los hijos directos de una unidad orgánica."""
        unidad = self.get_object()
        hijos = unidad.hijos.filter(is_active=True).order_by('codigo')
        serializer = UnidadOrganicaSerializer(hijos, many=True)
        return Response(serializer.data)
