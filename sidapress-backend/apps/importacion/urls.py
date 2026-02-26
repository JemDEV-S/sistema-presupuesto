from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'archivos', views.ImportacionArchivoViewSet)

urlpatterns = [
    path('upload/', views.upload_excel, name='importacion-upload'),
    path('', include(router.urls)),
]
