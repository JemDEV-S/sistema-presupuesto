import random
from decimal import Decimal
from django.core.management.base import BaseCommand
from apps.catalogos.models import AnioFiscal, FuenteFinanciamiento, Rubro, ClasificadorGasto
from apps.organizacion.models import UnidadOrganica
from apps.presupuesto.models import Meta, EjecucionPresupuestal, EjecucionMensual


class Command(BaseCommand):
    help = 'Crea datos de ejemplo para presupuesto'

    def handle(self, *args, **options):
        # 1. Año Fiscal
        anio, _ = AnioFiscal.objects.get_or_create(anio=2026, defaults={'is_active': True})
        self.stdout.write(f'  Año fiscal: {anio}')

        # 2. Fuentes de Financiamiento y Rubros
        fuentes_rubros_data = [
            ('1', 'RECURSOS ORDINARIOS', 'RO', [
                ('00', 'RECURSOS ORDINARIOS', 'RO'),
            ]),
            ('2', 'RECURSOS DIRECTAMENTE RECAUDADOS', 'RDR', [
                ('09', 'RECURSOS DIRECTAMENTE RECAUDADOS', 'RDR'),
            ]),
            ('3', 'RECURSOS POR OPERACIONES OFICIALES DE CREDITO', 'ROOC', [
                ('19', 'RECURSOS POR OPERACIONES OFICIALES DE CREDITO', 'ROOC'),
            ]),
            ('4', 'DONACIONES Y TRANSFERENCIAS', 'DT', [
                ('13', 'DONACIONES Y TRANSFERENCIAS', 'DT'),
            ]),
            ('5', 'RECURSOS DETERMINADOS', 'RD', [
                ('07', 'FONDO DE COMPENSACION MUNICIPAL', 'FCM'),
                ('08', 'IMPUESTOS MUNICIPALES', 'IM'),
                ('18', 'CANON Y SOBRECANON, REGALIAS', 'CSC'),
            ]),
        ]
        rubros = {}
        for f_codigo, f_nombre, f_corto, rubros_list in fuentes_rubros_data:
            fuente, _ = FuenteFinanciamiento.objects.get_or_create(
                codigo=f_codigo, defaults={'nombre': f_nombre, 'nombre_corto': f_corto}
            )
            for r_codigo, r_nombre, r_corto in rubros_list:
                rubro, _ = Rubro.objects.get_or_create(
                    codigo=r_codigo,
                    defaults={'nombre': r_nombre, 'nombre_corto': r_corto, 'fuente': fuente}
                )
                rubros[r_codigo] = rubro
        self.stdout.write(f'  Rubros: {len(rubros)}')

        # 3. Clasificadores de Gasto
        clasificadores_data = [
            ('2.1.1', 'RETRIBUCIONES Y COMPLEMENTOS EN EFECTIVO', '2.1', 'PERSONAL Y OBLIGACIONES SOCIALES', 'Retribuciones', ''),
            ('2.1.3', 'CONTRIBUCIONES A LA SEGURIDAD SOCIAL', '2.1', 'PERSONAL Y OBLIGACIONES SOCIALES', 'Contribuciones', ''),
            ('2.2.1', 'PENSIONES', '2.2', 'PENSIONES Y OTRAS PRESTACIONES SOCIALES', 'Pensiones', ''),
            ('2.3.1', 'COMPRA DE BIENES', '2.3', 'BIENES Y SERVICIOS', 'Bienes', ''),
            ('2.3.2', 'CONTRATACION DE SERVICIOS', '2.3', 'BIENES Y SERVICIOS', 'Servicios', ''),
            ('2.4.1', 'DONACIONES Y TRANSFERENCIAS CORRIENTES', '2.4', 'DONACIONES Y TRANSFERENCIAS', 'Donaciones', ''),
            ('2.5.1', 'EDIFICIOS Y ESTRUCTURAS', '2.5', 'OTROS GASTOS', 'Edificios', ''),
            ('2.6.3', 'ADQUISICION DE VEHICULOS', '2.6', 'ADQUISICION DE ACTIVOS NO FINANCIEROS', 'Vehículos', ''),
            ('2.6.7', 'INVERSIONES INTANGIBLES', '2.6', 'ADQUISICION DE ACTIVOS NO FINANCIEROS', 'Intangibles', ''),
        ]
        clasificadores = {}
        for codigo, nombre, tipo, generica, subg, esp in clasificadores_data:
            c, _ = ClasificadorGasto.objects.get_or_create(
                codigo=codigo,
                defaults={
                    'nombre': nombre, 'tipo_transaccion': tipo,
                    'generica': generica, 'subgenerica': subg, 'especifica': esp,
                }
            )
            clasificadores[codigo] = c
        self.stdout.write(f'  Clasificadores: {len(clasificadores)}')

        # 4. Unidades Orgánicas
        unidades_data = [
            ('001', 'ALCALDÍA', 'ALC', 1, None),
            ('002', 'GERENCIA MUNICIPAL', 'GM', 1, None),
            ('003', 'GERENCIA DE ADMINISTRACIÓN Y FINANZAS', 'GAF', 2, '002'),
            ('004', 'GERENCIA DE INFRAESTRUCTURA Y DESARROLLO URBANO', 'GIDU', 2, '002'),
            ('005', 'GERENCIA DE DESARROLLO SOCIAL', 'GDS', 2, '002'),
            ('006', 'GERENCIA DE SERVICIOS PÚBLICOS', 'GSP', 2, '002'),
            ('007', 'OFICINA DE PLANIFICACIÓN Y PRESUPUESTO', 'OPP', 3, '002'),
            ('008', 'OFICINA DE TECNOLOGÍAS DE LA INFORMACIÓN', 'OTI', 3, '003'),
            ('009', 'SUB GERENCIA DE OBRAS PÚBLICAS', 'SGOP', 3, '004'),
            ('010', 'SUB GERENCIA DE PROGRAMAS SOCIALES', 'SGPS', 3, '005'),
        ]
        unidades = {}
        for codigo, nombre, corto, nivel, parent_cod in unidades_data:
            parent = unidades.get(parent_cod) if parent_cod else None
            u, _ = UnidadOrganica.objects.get_or_create(
                codigo=codigo,
                defaults={'nombre': nombre, 'nombre_corto': corto, 'nivel': nivel, 'parent': parent}
            )
            unidades[codigo] = u
        self.stdout.write(f'  Unidades: {len(unidades)}')

        # 5. Metas
        metas_data = [
            ('0001', 'GESTIÓN ADMINISTRATIVA', 'PRODUCTO', '003'),
            ('0002', 'CONDUCCIÓN Y ORIENTACIÓN SUPERIOR', 'PRODUCTO', '001'),
            ('0003', 'GESTIÓN DE RECURSOS HUMANOS', 'PRODUCTO', '003'),
            ('0004', 'LIMPIEZA PÚBLICA', 'PRODUCTO', '006'),
            ('0005', 'SERENAZGO', 'PRODUCTO', '006'),
            ('0006', 'MANTENIMIENTO VIAL', 'PRODUCTO', '004'),
            ('0007', 'PROGRAMA VASO DE LECHE', 'PRODUCTO', '005'),
            ('0008', 'MEJORAMIENTO DE PISTAS Y VEREDAS', 'PROYECTO', '009'),
            ('0009', 'CONSTRUCCIÓN DE PARQUE RECREACIONAL', 'PROYECTO', '009'),
            ('0010', 'MODERNIZACIÓN DE SISTEMAS DE INFORMACIÓN', 'PROYECTO', '008'),
            ('0011', 'PROGRAMA DE ADULTO MAYOR', 'PRODUCTO', '010'),
            ('0012', 'DEMUNA Y DEFENSA CIVIL', 'PRODUCTO', '005'),
        ]
        metas = {}
        for codigo, nombre, tipo, unidad_cod in metas_data:
            m, _ = Meta.objects.get_or_create(
                anio_fiscal=anio, codigo=codigo,
                defaults={
                    'nombre': nombre, 'tipo_meta': tipo,
                    'unidad_organica': unidades[unidad_cod],
                    'cantidad_meta_anual': random.randint(50, 500),
                }
            )
            metas[codigo] = m
        self.stdout.write(f'  Metas: {len(metas)}')

        # 6. Ejecuciones Presupuestales con datos mensuales
        rubros_list = list(rubros.values())
        clasificadores_list = list(clasificadores.values())
        count_ejec = 0

        for meta_cod, meta in metas.items():
            n_ejecuciones = random.randint(1, 3)
            for _ in range(n_ejecuciones):
                rubro = random.choice(rubros_list)
                clasificador = random.choice(clasificadores_list)

                pia = Decimal(str(random.randint(50000, 2000000)))
                modificaciones = Decimal(str(random.randint(-50000, 200000)))
                pim = pia + modificaciones
                certificado = pim * Decimal(str(random.uniform(0.5, 0.95)))

                ejec, created = EjecucionPresupuestal.objects.get_or_create(
                    anio_fiscal=anio, meta=meta,
                    rubro=rubro, clasificador_gasto=clasificador,
                    defaults={
                        'pia': pia, 'modificaciones': modificaciones,
                        'pim': pim, 'certificado': certificado.quantize(Decimal('0.01')),
                        'compromiso_anual': (certificado * Decimal('0.9')).quantize(Decimal('0.01')),
                        'codigo_categoria_gasto': '5',
                        'nombre_categoria_gasto': 'GASTOS CORRIENTES',
                    }
                )

                if created:
                    count_ejec += 1
                    pim_mensual = float(pim) / 12
                    for mes in range(1, 13):
                        if mes <= 1:
                            factor = random.uniform(0.6, 1.1)
                        else:
                            factor = 0

                        devengado = Decimal(str(pim_mensual * factor)).quantize(Decimal('0.01'))
                        compromiso = (devengado * Decimal('1.05')).quantize(Decimal('0.01'))
                        girado = (devengado * Decimal(str(random.uniform(0.85, 1.0)))).quantize(Decimal('0.01'))
                        pagado = (girado * Decimal(str(random.uniform(0.8, 1.0)))).quantize(Decimal('0.01'))

                        EjecucionMensual.objects.get_or_create(
                            ejecucion=ejec, mes=mes,
                            defaults={
                                'compromiso': max(compromiso, Decimal('0')),
                                'devengado': max(devengado, Decimal('0')),
                                'girado': max(girado, Decimal('0')),
                                'pagado': max(pagado, Decimal('0')),
                            }
                        )

        self.stdout.write(f'  Ejecuciones: {count_ejec}')
        self.stdout.write(self.style.SUCCESS('\nSeed de presupuesto completado.'))
