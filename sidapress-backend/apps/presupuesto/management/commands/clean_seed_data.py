from django.core.management.base import BaseCommand
from django.db import connection
from apps.presupuesto.models import EjecucionMensual, EjecucionPresupuestal, Meta, ModificacionPresupuestal, AvanceFisico
from apps.catalogos.models import FuenteFinanciamiento, Rubro, ClasificadorGasto
from apps.organizacion.models import UnidadOrganica
from apps.alertas.models import Alerta, NotificacionUsuario
from apps.importacion.models import ImportacionArchivo


class Command(BaseCommand):
    help = 'Elimina todos los datos de seeders/prueba para permitir importación limpia desde Excel'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirma la eliminación sin preguntar',
        )

    def handle(self, *args, **options):
        if not options['confirm']:
            self.stdout.write(self.style.WARNING(
                'ADVERTENCIA: Esto eliminará TODOS los datos de presupuesto, '
                'catálogos (fuentes, clasificadores), unidades orgánicas, '
                'alertas e importaciones.'
            ))
            self.stdout.write('Ejecute con --confirm para proceder.')
            return

        self.stdout.write('Limpiando datos...')

        # Orden de eliminación respetando foreign keys
        counts = {}

        counts['notificaciones'] = NotificacionUsuario.objects.all().delete()[0]
        counts['alertas'] = Alerta.objects.all().delete()[0]
        counts['avances_fisicos'] = AvanceFisico.objects.all().delete()[0]
        counts['ejecuciones_mensuales'] = EjecucionMensual.objects.all().delete()[0]
        counts['modificaciones'] = ModificacionPresupuestal.objects.all().delete()[0]
        counts['ejecuciones'] = EjecucionPresupuestal.objects.all().delete()[0]
        counts['metas'] = Meta.objects.all().delete()[0]
        counts['importaciones'] = ImportacionArchivo.objects.all().delete()[0]
        counts['clasificadores'] = ClasificadorGasto.objects.all().delete()[0]
        counts['rubros'] = Rubro.objects.all().delete()[0]
        counts['fuentes'] = FuenteFinanciamiento.objects.all().delete()[0]
        counts['unidades'] = UnidadOrganica.objects.all().delete()[0]

        for name, count in counts.items():
            if count > 0:
                self.stdout.write(f'  {name}: {count} registros eliminados')

        self.stdout.write(self.style.SUCCESS('\nLimpieza completada. Base de datos lista para importación.'))
