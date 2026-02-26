"""
Configuración de producción para SIDAPRESS.
Usar con: DJANGO_SETTINGS_MODULE=config.settings_prod
"""
from .settings import *

# Seguridad
DEBUG = False
SECRET_KEY = config('SECRET_KEY')

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='').split(',')

# HTTPS
SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=True, cast=bool)
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# CORS restringido
CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', default='').split(',')

# Renderers (sin browsable API en producción)
REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'] = [
    'rest_framework.renderers.JSONRenderer',
]

# JWT más estricto en producción
SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'] = timedelta(minutes=30)
SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'] = timedelta(days=1)

# Logging de producción
LOGGING['handlers']['file'] = {
    'class': 'logging.handlers.RotatingFileHandler',
    'filename': BASE_DIR / 'logs' / 'production.log',
    'maxBytes': 10 * 1024 * 1024,  # 10MB
    'backupCount': 5,
    'formatter': 'verbose',
}
LOGGING['root']['level'] = 'WARNING'
LOGGING['loggers']['django']['level'] = 'WARNING'

# Archivos estáticos
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.ManifestStaticFilesStorage'

# Caché en producción (memoria para empezar, cambiar a Redis cuando esté disponible)
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'sidapress-cache',
        'TIMEOUT': 300,
    }
}

# Si Redis está disponible, descomentar:
# CACHES = {
#     'default': {
#         'BACKEND': 'django.core.cache.backends.redis.RedisCache',
#         'LOCATION': config('REDIS_URL', default='redis://127.0.0.1:6379/1'),
#         'TIMEOUT': 300,
#     }
# }
