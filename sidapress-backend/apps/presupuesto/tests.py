from decimal import Decimal
from django.test import TestCase
from rest_framework.test import APIClient
from apps.authentication.models import Usuario
from apps.catalogos.models import AnioFiscal, FuenteFinanciamiento, Rubro, ClasificadorGasto
from apps.organizacion.models import UnidadOrganica
from apps.presupuesto.models import Meta, EjecucionPresupuestal, EjecucionMensual
from apps.presupuesto.services.calculator_service import get_resumen_general


class PresupuestoTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = Usuario.objects.create_superuser(
            username='admin_test', password='admin123',
            email='admin@test.com',
        )
        self.client.force_authenticate(user=self.user)

        self.anio = AnioFiscal.objects.create(anio=2026, is_active=True)
        self.fuente = FuenteFinanciamiento.objects.create(
            codigo='1', nombre='Recursos Ordinarios',
        )
        self.rubro = Rubro.objects.create(
            codigo='00', nombre='Recursos Ordinarios',
            fuente=self.fuente,
        )
        self.clasificador = ClasificadorGasto.objects.create(
            codigo='2.3.1.1.1.1', nombre='Alimentos', generica='2.3',
        )
        self.unidad = UnidadOrganica.objects.create(
            codigo='01', nombre='Gerencia Municipal', nivel=1,
        )
        self.meta = Meta.objects.create(
            anio_fiscal=self.anio, unidad_organica=self.unidad,
            codigo='0001', nombre='Meta de prueba',
        )
        self.ejecucion = EjecucionPresupuestal.objects.create(
            anio_fiscal=self.anio, meta=self.meta,
            rubro=self.rubro,
            clasificador_gasto=self.clasificador,
            pia=Decimal('100000'), pim=Decimal('120000'),
            certificado=Decimal('80000'), compromiso_anual=Decimal('75000'),
        )
        EjecucionMensual.objects.create(
            ejecucion=self.ejecucion, mes=1,
            compromiso=Decimal('10000'), devengado=Decimal('8000'),
            girado=Decimal('7000'), pagado=Decimal('6000'),
        )

    def test_resumen_general(self):
        resumen = get_resumen_general(self.anio.id)
        self.assertEqual(float(resumen['pim']), 120000.0)
        self.assertEqual(float(resumen['devengado']), 8000.0)
        self.assertGreater(resumen['avance_devengado_pct'], 0)

    def test_dashboard_resumen_endpoint(self):
        response = self.client.get(f'/api/presupuesto/dashboard/resumen/?anio_fiscal_id={self.anio.id}')
        self.assertEqual(response.status_code, 200)
        self.assertIn('pim', response.data)

    def test_metas_list(self):
        response = self.client.get('/api/presupuesto/metas/')
        self.assertEqual(response.status_code, 200)
