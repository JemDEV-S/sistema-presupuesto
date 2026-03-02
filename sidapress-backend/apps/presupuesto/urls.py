from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r"metas", views.MetaViewSet, basename="meta")
router.register(r"ejecuciones", views.EjecucionPresupuestalViewSet, basename="ejecucionpresupuestal")
router.register(r"ejecuciones-mensuales", views.EjecucionMensualViewSet, basename="ejecucionmensual")
router.register(r"modificaciones", views.ModificacionViewSet, basename="modificacionpresupuestal")
router.register(r"avances-fisicos", views.AvanceFisicoViewSet, basename="avancefisico")

urlpatterns = [
    # Dashboard endpoints
    path("dashboard/resumen/", views.dashboard_resumen, name="dashboard-resumen"),
    path("dashboard/tendencia/", views.dashboard_tendencia, name="dashboard-tendencia"),
    path("dashboard/por-fuente/", views.dashboard_por_fuente, name="dashboard-por-fuente"),
    path("dashboard/por-generica/", views.dashboard_por_generica, name="dashboard-por-generica"),
    path("dashboard/por-unidad/", views.dashboard_por_unidad, name="dashboard-por-unidad"),
    path("dashboard/top-metas/", views.dashboard_top_metas, name="dashboard-top-metas"),
    # Dashboard por unidad orgánica
    path("dashboard/unidad-detalle/", views.dashboard_unidad_detalle, name="dashboard-unidad-detalle"),
    path("dashboard/unidad-metas/", views.dashboard_unidad_metas, name="dashboard-unidad-metas"),
    path("dashboard/unidad-clasificadores/", views.dashboard_unidad_clasificadores, name="dashboard-unidad-clasificadores"),
    # Dashboard por rubros
    path("dashboard/por-rubro/", views.dashboard_por_rubro, name="dashboard-por-rubro"),
    # Dashboard por tipo meta / producto-proyecto
    path("dashboard/por-tipo-meta/", views.dashboard_por_tipo_meta, name="dashboard-por-tipo-meta"),
    path("dashboard/por-producto-proyecto/", views.dashboard_por_producto_proyecto, name="dashboard-por-producto-proyecto"),
    # Dashboard por clasificadores
    path("dashboard/clasificador-detalle/", views.dashboard_clasificador_detalle, name="dashboard-clasificador-detalle"),
    # Tendencia filtrada (compartido)
    path("dashboard/tendencia-filtrada/", views.dashboard_tendencia_filtrada, name="dashboard-tendencia-filtrada"),
    # CRUD
    path("", include(router.urls)),
]
