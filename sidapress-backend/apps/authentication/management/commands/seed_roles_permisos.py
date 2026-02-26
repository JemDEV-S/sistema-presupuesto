from django.core.management.base import BaseCommand
from apps.authentication.models import Rol, Permiso, RolPermiso


class Command(BaseCommand):
    help = 'Crea roles y permisos iniciales del sistema'

    def handle(self, *args, **options):
        # Crear permisos
        permisos_data = [
            ('presupuesto.view', 'Ver presupuesto', 'presupuesto', 'view'),
            ('presupuesto.create', 'Crear presupuesto', 'presupuesto', 'create'),
            ('presupuesto.edit', 'Editar presupuesto', 'presupuesto', 'edit'),
            ('presupuesto.delete', 'Eliminar presupuesto', 'presupuesto', 'delete'),
            ('reportes.view', 'Ver reportes', 'reportes', 'view'),
            ('reportes.export', 'Exportar reportes', 'reportes', 'export'),
            ('metas.view', 'Ver metas', 'metas', 'view'),
            ('metas.edit', 'Editar metas', 'metas', 'edit'),
            ('importacion.create', 'Importar archivos', 'importacion', 'import'),
            ('importacion.view', 'Ver importaciones', 'importacion', 'view'),
            ('usuarios.view', 'Ver usuarios', 'usuarios', 'view'),
            ('usuarios.manage', 'Administrar usuarios', 'usuarios', 'manage'),
            ('alertas.view', 'Ver alertas', 'alertas', 'view'),
            ('alertas.manage', 'Administrar alertas', 'alertas', 'manage'),
            ('auditoria.view', 'Ver auditoría', 'auditoria', 'view'),
        ]

        permisos = {}
        for codigo, nombre, recurso, accion in permisos_data:
            permiso, created = Permiso.objects.get_or_create(
                codigo=codigo,
                defaults={'nombre': nombre, 'recurso': recurso, 'accion': accion}
            )
            permisos[codigo] = permiso
            status = 'CREADO' if created else 'ya existe'
            self.stdout.write(f'  Permiso: {codigo} - {status}')

        # Crear roles
        roles_data = [
            ('SUPERADMIN', 'Superadministrador', 0, True, list(permisos.keys())),
            ('ALCALDE', 'Alcalde/Alta Dirección', 1, True, [
                'presupuesto.view', 'reportes.view', 'reportes.export', 'alertas.view',
            ]),
            ('GERENTE', 'Gerente', 2, True, [
                'presupuesto.view', 'reportes.view', 'metas.view', 'metas.edit', 'alertas.view',
            ]),
            ('JEFE_OFICINA', 'Jefe de Oficina', 3, True, [
                'presupuesto.view', 'metas.view', 'alertas.view',
            ]),
            ('ANALISTA_PRESUPUESTO', 'Analista de Presupuesto', 4, True, [
                'presupuesto.view', 'presupuesto.create', 'presupuesto.edit',
                'reportes.view', 'reportes.export',
                'importacion.create', 'importacion.view',
                'metas.view', 'metas.edit', 'alertas.view', 'alertas.manage',
            ]),
            ('USUARIO_BASICO', 'Usuario Básico', 5, True, [
                'presupuesto.view', 'alertas.view',
            ]),
        ]

        for codigo, nombre, nivel, es_sistema, permisos_codigos in roles_data:
            rol, created = Rol.objects.get_or_create(
                codigo=codigo,
                defaults={
                    'nombre': nombre,
                    'nivel_jerarquico': nivel,
                    'es_sistema': es_sistema,
                }
            )
            status = 'CREADO' if created else 'ya existe'
            self.stdout.write(f'  Rol: {codigo} ({nombre}) - {status}')

            # Asignar permisos al rol
            for perm_codigo in permisos_codigos:
                if perm_codigo in permisos:
                    RolPermiso.objects.get_or_create(rol=rol, permiso=permisos[perm_codigo])

        self.stdout.write(self.style.SUCCESS('\nSeed completado exitosamente.'))
