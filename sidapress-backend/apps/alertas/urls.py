from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'alertas', views.AlertaViewSet)
router.register(r'notificaciones', views.NotificacionViewSet, basename='notificacion')

urlpatterns = [
    path('generar/', views.generar_alertas_view, name='alertas-generar'),
    path('', include(router.urls)),
]
