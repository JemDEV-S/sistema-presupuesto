import hashlib
from django.conf import settings


def validate_file(uploaded_file):
    """Valida el archivo subido antes de procesar."""
    errors = []

    # Validar extensión
    name = uploaded_file.name.lower()
    if not (name.endswith('.xlsx') or name.endswith('.xls')):
        errors.append('El archivo debe ser de tipo Excel (.xlsx o .xls).')

    # Validar tamaño
    max_size = getattr(settings, 'MAX_UPLOAD_SIZE', 50 * 1024 * 1024)
    if uploaded_file.size > max_size:
        errors.append(f'El archivo excede el tamaño máximo permitido ({max_size // (1024*1024)}MB).')

    if uploaded_file.size == 0:
        errors.append('El archivo está vacío.')

    return errors


def calculate_file_hash(uploaded_file):
    """Calcula el hash SHA-256 del archivo para detectar duplicados."""
    sha256 = hashlib.sha256()
    uploaded_file.seek(0)
    for chunk in uploaded_file.chunks():
        sha256.update(chunk)
    uploaded_file.seek(0)
    return sha256.hexdigest()


def validate_row_data(row_data, row_number):
    """Valida los datos de una fila del Excel."""
    errors = []

    if not row_data.get('meta_codigo'):
        errors.append(f'Fila {row_number}: Código de meta vacío.')

    if not row_data.get('fuente_codigo'):
        errors.append(f'Fila {row_number}: Código de fuente vacío.')

    if not row_data.get('clasificador_codigo'):
        errors.append(f'Fila {row_number}: Código de clasificador vacío.')

    # Validar montos numéricos
    for campo in ['pia', 'pim', 'certificado']:
        valor = row_data.get(campo)
        if valor is not None:
            try:
                float(valor)
            except (ValueError, TypeError):
                errors.append(f'Fila {row_number}: {campo} no es un valor numérico válido ({valor}).')

    return errors
