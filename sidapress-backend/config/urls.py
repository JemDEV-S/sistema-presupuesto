from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.authentication.urls')),
    path('api/organizacion/', include('apps.organizacion.urls')),
    path('api/catalogos/', include('apps.catalogos.urls')),
    path('api/presupuesto/', include('apps.presupuesto.urls')),
    path('api/importacion/', include('apps.importacion.urls')),
    path('api/auditoria/', include('apps.auditoria.urls')),
    path('api/alertas/', include('apps.alertas.urls')),
    path('api/reportes/', include('apps.reportes.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
