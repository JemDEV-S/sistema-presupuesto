import logging
from decimal import Decimal
from django.utils import timezone
from django.db.models import Sum
from apps.presupuesto.models import EjecucionPresupuestal, EjecucionMensual, Meta
from apps.alertas.models import Alerta, NotificacionUsuario
from apps.authentication.models import UsuarioRol

logger = logging.getLogger(__name__)


def generar_alertas(anio_fiscal):
    """Genera alertas automáticas de ejecución presupuestal."""
    mes_actual = timezone.now().month
    alertas_generadas = []

    # Obtener ejecuciones del año
    ejecuciones = EjecucionPresupuestal.objects.filter(
        anio_fiscal=anio_fiscal
    ).select_related('meta', 'meta__unidad_organica')

    avance_esperado = (mes_actual / 12) * 70  # 70% del avance temporal

    for ejec in ejecuciones:
        if ejec.pim <= 10000:
            continue

        devengado = EjecucionMensual.objects.filter(
            ejecucion=ejec
        ).aggregate(total=Sum('devengado'))['total'] or Decimal('0')

        avance_real = float(devengado / ejec.pim * 100) if ejec.pim > 0 else 0

        # 1. Alerta de subejecución
        if avance_real < avance_esperado:
            alerta = Alerta.objects.create(
                tipo_alerta='SUBEJECUCION',
                nivel_severidad='WARNING',
                titulo=f'Baja ejecución en meta {ejec.meta.codigo}',
                mensaje=(
                    f'La meta {ejec.meta.codigo} - {ejec.meta.nombre[:100]} tiene un avance de '
                    f'{avance_real:.1f}% vs {avance_esperado:.1f}% esperado. '
                    f'PIM: S/ {ejec.pim:,.2f}, Devengado: S/ {devengado:,.2f}'
                ),
                datos_contexto={
                    'meta_id': ejec.meta.id,
                    'meta_codigo': ejec.meta.codigo,
                    'pim': float(ejec.pim),
                    'devengado': float(devengado),
                    'avance_real': round(avance_real, 2),
                    'avance_esperado': round(avance_esperado, 2),
                },
                anio_fiscal=anio_fiscal,
            )
            alertas_generadas.append(alerta)

        # 2. Alerta de sobrecertificación
        if ejec.certificado > ejec.pim:
            alerta = Alerta.objects.create(
                tipo_alerta='SOBRECERTIFICACION',
                nivel_severidad='CRITICAL',
                titulo=f'Sobrecertificación en meta {ejec.meta.codigo}',
                mensaje=(
                    f'El certificado (S/ {ejec.certificado:,.2f}) excede el PIM '
                    f'(S/ {ejec.pim:,.2f}) en la meta {ejec.meta.codigo}.'
                ),
                datos_contexto={
                    'meta_id': ejec.meta.id,
                    'meta_codigo': ejec.meta.codigo,
                    'pim': float(ejec.pim),
                    'certificado': float(ejec.certificado),
                    'exceso': float(ejec.certificado - ejec.pim),
                },
                anio_fiscal=anio_fiscal,
            )
            alertas_generadas.append(alerta)

    # Crear notificaciones para usuarios relevantes
    for alerta in alertas_generadas:
        meta_id = alerta.datos_contexto.get('meta_id')
        if meta_id:
            try:
                meta = Meta.objects.get(id=meta_id)
                unidad = meta.unidad_organica
                # Notificar a usuarios con roles en esta unidad
                usuario_roles = UsuarioRol.objects.filter(
                    unidad_organica=unidad
                ).select_related('usuario')

                for ur in usuario_roles:
                    NotificacionUsuario.objects.get_or_create(
                        usuario=ur.usuario,
                        alerta=alerta,
                    )

                # También notificar a superadmins
                from apps.authentication.models import Usuario
                superadmins = Usuario.objects.filter(is_superuser=True, is_active=True)
                for admin in superadmins:
                    NotificacionUsuario.objects.get_or_create(
                        usuario=admin,
                        alerta=alerta,
                    )
            except Meta.DoesNotExist:
                pass

    logger.info(f'Alertas generadas: {len(alertas_generadas)}')
    return alertas_generadas
