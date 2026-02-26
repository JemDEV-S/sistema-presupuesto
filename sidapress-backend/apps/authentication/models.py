from django.contrib.auth.models import AbstractUser
from django.db import models


class Usuario(AbstractUser):
    dni = models.CharField(max_length=8, unique=True, null=True, blank=True)
    telefono = models.CharField(max_length=15, blank=True, default='')
    cargo = models.CharField(max_length=100, blank=True, default='')
    is_active = models.BooleanField(default=True)
    creado_por = models.ForeignKey(
        'self', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='usuarios_creados'
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'usuario'
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['username']

    def __str__(self):
        return f'{self.first_name} {self.last_name} ({self.username})'


class Rol(models.Model):
    NIVELES = [
        (0, 'Superadmin'),
        (1, 'Alcalde/Alta Dirección'),
        (2, 'Gerente'),
        (3, 'Jefe de Oficina'),
        (4, 'Analista Presupuesto'),
        (5, 'Usuario Básico'),
    ]

    nombre = models.CharField(max_length=100)
    codigo = models.CharField(max_length=50, unique=True)
    descripcion = models.TextField(blank=True, default='')
    nivel_jerarquico = models.IntegerField(choices=NIVELES, default=5)
    es_sistema = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'rol'
        verbose_name = 'Rol'
        verbose_name_plural = 'Roles'
        ordering = ['nivel_jerarquico']

    def __str__(self):
        return self.nombre


class Permiso(models.Model):
    ACCIONES = [
        ('view', 'Ver'),
        ('create', 'Crear'),
        ('edit', 'Editar'),
        ('delete', 'Eliminar'),
        ('export', 'Exportar'),
        ('import', 'Importar'),
        ('manage', 'Administrar'),
    ]

    nombre = models.CharField(max_length=100)
    codigo = models.CharField(max_length=100, unique=True)
    recurso = models.CharField(max_length=50)
    accion = models.CharField(max_length=20, choices=ACCIONES)
    descripcion = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'permiso'
        verbose_name = 'Permiso'
        verbose_name_plural = 'Permisos'
        ordering = ['recurso', 'accion']
        unique_together = ['recurso', 'accion']

    def __str__(self):
        return f'{self.recurso}.{self.accion}'


class RolPermiso(models.Model):
    rol = models.ForeignKey(Rol, on_delete=models.CASCADE, related_name='rol_permisos')
    permiso = models.ForeignKey(Permiso, on_delete=models.CASCADE, related_name='permiso_roles')

    class Meta:
        db_table = 'rol_permiso'
        unique_together = ['rol', 'permiso']

    def __str__(self):
        return f'{self.rol} - {self.permiso}'


class UsuarioRol(models.Model):
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='usuario_roles')
    rol = models.ForeignKey(Rol, on_delete=models.CASCADE, related_name='rol_usuarios')
    unidad_organica = models.ForeignKey(
        'organizacion.UnidadOrganica', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='usuario_roles'
    )
    incluir_hijos = models.BooleanField(default=False)
    fecha_asignacion = models.DateTimeField(auto_now_add=True)
    asignado_por = models.ForeignKey(
        Usuario, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='roles_asignados'
    )

    class Meta:
        db_table = 'usuario_rol'
        unique_together = ['usuario', 'rol', 'unidad_organica']

    def __str__(self):
        return f'{self.usuario} - {self.rol}'
