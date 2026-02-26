from django.urls import path
from . import views

urlpatterns = [
    path('disponibles/', views.reportes_disponibles, name='reportes-disponibles'),
    # Resumen
    path('resumen/pdf/', views.reporte_resumen_pdf, name='reporte-resumen-pdf'),
    path('resumen/excel/', views.reporte_resumen_excel, name='reporte-resumen-excel'),
    # Por unidad
    path('por-unidad/pdf/', views.reporte_por_unidad_pdf, name='reporte-unidad-pdf'),
    path('por-unidad/excel/', views.reporte_por_unidad_excel, name='reporte-unidad-excel'),
    # Metas
    path('metas/pdf/', views.reporte_metas_pdf, name='reporte-metas-pdf'),
    path('metas/excel/', views.reporte_metas_excel, name='reporte-metas-excel'),
    # Tendencia
    path('tendencia/excel/', views.reporte_tendencia_excel, name='reporte-tendencia-excel'),
]
