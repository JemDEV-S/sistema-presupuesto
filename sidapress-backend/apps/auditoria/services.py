import logging
from django.utils import timezone

logger = logging.getLogger(__name__)


class AuditService:
    """Servicio centralizado para registrar logs de auditoría."""

    @staticmethod
    def log(usuario, accion, tabla='', registro_id='', datos_anteriores=None,
            datos_nuevos=None, ip_address=None, user_agent=''):
        from .models import LogAuditoria
        try:
            LogAuditoria.objects.create(
                usuario=usuario,
                accion=accion,
                tabla=tabla,
                registro_id=str(registro_id) if registro_id else '',
                datos_anteriores=datos_anteriores,
                datos_nuevos=datos_nuevos,
                ip_address=ip_address,
                user_agent=user_agent[:500] if user_agent else '',
            )
        except Exception as e:
            logger.error(f'Error al registrar log de auditoría: {e}')

    @staticmethod
    def log_login(usuario, ip_address=None, user_agent=''):
        AuditService.log(
            usuario=usuario,
            accion='LOGIN',
            tabla='authentication',
            ip_address=ip_address,
            user_agent=user_agent,
        )

    @staticmethod
    def log_logout(usuario, ip_address=None, user_agent=''):
        AuditService.log(
            usuario=usuario,
            accion='LOGOUT',
            tabla='authentication',
            ip_address=ip_address,
            user_agent=user_agent,
        )

    @staticmethod
    def log_import(usuario, archivo_nombre, resultado, ip_address=None):
        AuditService.log(
            usuario=usuario,
            accion='IMPORT',
            tabla='importacion',
            datos_nuevos={'archivo': archivo_nombre, 'resultado': resultado},
            ip_address=ip_address,
        )

    @staticmethod
    def registrar_sesion(usuario, token_jti, ip_address=None, user_agent=''):
        from .models import SesionUsuario
        try:
            SesionUsuario.objects.create(
                usuario=usuario,
                token_jti=token_jti,
                ip_address=ip_address,
                user_agent=user_agent[:500] if user_agent else '',
            )
        except Exception as e:
            logger.error(f'Error al registrar sesión: {e}')

    @staticmethod
    def cerrar_sesion(token_jti):
        from .models import SesionUsuario
        try:
            SesionUsuario.objects.filter(
                token_jti=token_jti, is_active=True
            ).update(
                is_active=False,
                fecha_fin=timezone.now()
            )
        except Exception as e:
            logger.error(f'Error al cerrar sesión: {e}')

    @staticmethod
    def get_estadisticas(dias=30):
        from .models import LogAuditoria
        from django.db.models import Count
        from datetime import timedelta

        fecha_inicio = timezone.now() - timedelta(days=dias)
        logs = LogAuditoria.objects.filter(fecha_hora__gte=fecha_inicio)

        return {
            'total_acciones': logs.count(),
            'por_accion': dict(
                logs.values_list('accion').annotate(count=Count('id')).values_list('accion', 'count')
            ),
            'por_tabla': dict(
                logs.values_list('tabla').annotate(count=Count('id'))
                .order_by('-count')[:10]
                .values_list('tabla', 'count')
            ),
            'usuarios_activos': logs.values('usuario').distinct().count(),
        }
