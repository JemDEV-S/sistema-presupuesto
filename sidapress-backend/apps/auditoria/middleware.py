import json
import logging
from django.utils.deprecation import MiddlewareMixin
from .services import AuditService

logger = logging.getLogger(__name__)


class AuditMiddleware(MiddlewareMixin):
    """
    Middleware que registra automáticamente las acciones de los usuarios.
    Captura CREATE, UPDATE, DELETE en endpoints de la API.
    """

    AUDIT_METHODS = {'POST', 'PUT', 'PATCH', 'DELETE'}
    SKIP_PATHS = {'/api/auth/login/', '/api/auth/refresh/', '/api/auth/logout/'}

    def process_response(self, request, response):
        if not hasattr(request, 'user') or not request.user.is_authenticated:
            return response

        if request.method not in self.AUDIT_METHODS:
            return response

        if request.path in self.SKIP_PATHS:
            return response

        if not request.path.startswith('/api/'):
            return response

        if response.status_code >= 400:
            return response

        try:
            accion = self._get_accion(request.method)
            tabla = self._get_tabla(request.path)
            registro_id = self._get_registro_id(request.path, response)

            datos_nuevos = None
            if request.method in ('POST', 'PUT', 'PATCH'):
                try:
                    if hasattr(request, 'body'):
                        body = request.body.decode('utf-8', errors='ignore')
                        if body and body.strip().startswith('{'):
                            datos_nuevos = json.loads(body)
                            if 'password' in datos_nuevos:
                                datos_nuevos['password'] = '***'
                except Exception:
                    pass

            AuditService.log(
                usuario=request.user,
                accion=accion,
                tabla=tabla,
                registro_id=str(registro_id) if registro_id else '',
                datos_nuevos=datos_nuevos,
                ip_address=self._get_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
            )
        except Exception as e:
            logger.error(f'Error en AuditMiddleware: {e}')

        return response

    def _get_accion(self, method):
        mapping = {
            'POST': 'CREATE',
            'PUT': 'UPDATE',
            'PATCH': 'UPDATE',
            'DELETE': 'DELETE',
        }
        return mapping.get(method, 'UPDATE')

    def _get_tabla(self, path):
        parts = [p for p in path.split('/') if p and p != 'api']
        if len(parts) >= 1:
            return parts[0]
        return ''

    def _get_registro_id(self, path, response):
        parts = [p for p in path.rstrip('/').split('/') if p]
        for part in reversed(parts):
            if part.isdigit():
                return part

        if hasattr(response, 'data') and isinstance(response.data, dict):
            return response.data.get('id', '')
        return ''

    def _get_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')
