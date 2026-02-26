from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'anios-fiscales', views.AnioFiscalViewSet)
router.register(r'fuentes', views.FuenteFinanciamientoViewSet)
router.register(r'rubros', views.RubroViewSet)
router.register(r'clasificadores', views.ClasificadorGastoViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
