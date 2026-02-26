from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'logs', views.LogAuditoriaViewSet)
router.register(r'sesiones', views.SesionUsuarioViewSet)

urlpatterns = [
    path('estadisticas/', views.estadisticas_auditoria, name='auditoria-estadisticas'),
    path('', include(router.urls)),
]
