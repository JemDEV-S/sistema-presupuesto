#!/bin/bash
# =============================================================================
# Script de despliegue para SIDAPRESS en cPanel
# Dominio: sistema01.munisanjeronimocusco.gob.pe
# =============================================================================

set -e

echo "========================================="
echo "  SIDAPRESS - Despliegue en cPanel"
echo "========================================="

# Variables - AJUSTAR segun tu cPanel
HOME_DIR="$HOME"
REPO_DIR="$HOME_DIR/sidapress"
BACKEND_DIR="$REPO_DIR/sidapress-backend"
FRONTEND_DIR="$REPO_DIR/sidapress-frontend"
PUBLIC_HTML="$HOME_DIR/public_html"
REPO_URL="https://github.com/JemDEV-S/sistema-presupuesto.git"

# =============================================
# PASO 1: Clonar o actualizar repositorio
# =============================================
echo ""
echo "[1/6] Clonando/actualizando repositorio..."

if [ -d "$REPO_DIR/.git" ]; then
    cd "$REPO_DIR"
    git pull origin main
    echo "  -> Repositorio actualizado"
else
    git clone "$REPO_URL" "$REPO_DIR"
    echo "  -> Repositorio clonado"
fi

# =============================================
# PASO 2: Backend - Instalar dependencias
# =============================================
echo ""
echo "[2/6] Configurando backend..."

cd "$BACKEND_DIR"

# Copiar .env de produccion si no existe
if [ ! -f ".env" ] || [ "$1" == "--reset-env" ]; then
    if [ -f ".env.production" ]; then
        cp .env.production .env
        echo "  -> .env copiado desde .env.production"
        echo "  -> IMPORTANTE: Edita $BACKEND_DIR/.env con tus credenciales reales"
    fi
fi

# Crear directorio de logs si no existe
mkdir -p logs

# Activar virtualenv e instalar dependencias
# NOTA: Ajustar la ruta del virtualenv segun tu cPanel
VENV_PATH="$HOME_DIR/virtualenv/sidapress-backend/3.11/bin/activate"
if [ -f "$VENV_PATH" ]; then
    source "$VENV_PATH"
    pip install -r requirements.txt --quiet
    echo "  -> Dependencias instaladas"
else
    echo "  -> ERROR: No se encontro el virtualenv en $VENV_PATH"
    echo "  -> Crea la Python App desde cPanel primero"
    exit 1
fi

# =============================================
# PASO 3: Backend - Migraciones y static files
# =============================================
echo ""
echo "[3/6] Ejecutando migraciones..."

python manage.py migrate --noinput
echo "  -> Migraciones aplicadas"

python manage.py collectstatic --noinput
echo "  -> Archivos estaticos recopilados"

# =============================================
# PASO 4: Frontend - Build de produccion
# =============================================
echo ""
echo "[4/6] Construyendo frontend..."

cd "$FRONTEND_DIR"

# Verificar si Node.js esta disponible
if command -v node &> /dev/null; then
    npm install --production=false --quiet
    npm run build
    echo "  -> Frontend compilado"
else
    echo "  -> ADVERTENCIA: Node.js no disponible en el servidor"
    echo "  -> Opcion: Haz 'npm run build' localmente y sube la carpeta dist/"
fi

# =============================================
# PASO 5: Copiar frontend a public_html
# =============================================
echo ""
echo "[5/6] Desplegando frontend en public_html..."

if [ -d "$FRONTEND_DIR/dist" ]; then
    # Limpiar public_html pero conservar .htaccess y archivos del backend
    find "$PUBLIC_HTML" -maxdepth 1 -not -name '.htaccess' -not -name '.well-known' -not -name 'cgi-bin' -not -path "$PUBLIC_HTML" -exec rm -rf {} + 2>/dev/null || true

    # Copiar build del frontend
    cp -r "$FRONTEND_DIR/dist/"* "$PUBLIC_HTML/"

    # Copiar .htaccess si existe en el build
    if [ -f "$FRONTEND_DIR/dist/.htaccess" ]; then
        cp "$FRONTEND_DIR/dist/.htaccess" "$PUBLIC_HTML/.htaccess"
    fi

    echo "  -> Frontend desplegado en public_html"
else
    echo "  -> ERROR: No se encontro la carpeta dist/"
    echo "  -> Ejecuta 'npm run build' primero"
fi

# =============================================
# PASO 6: Reiniciar aplicacion Python
# =============================================
echo ""
echo "[6/6] Reiniciando aplicacion..."

# Passenger se reinicia tocando restart.txt
RESTART_FILE="$BACKEND_DIR/tmp/restart.txt"
mkdir -p "$BACKEND_DIR/tmp"
touch "$RESTART_FILE"
echo "  -> Aplicacion reiniciada (Passenger)"

echo ""
echo "========================================="
echo "  Despliegue completado!"
echo "========================================="
echo ""
echo "URL: https://sistema01.munisanjeronimocusco.gob.pe"
echo ""
echo "Si es la primera vez, recuerda:"
echo "  1. Editar $BACKEND_DIR/.env con credenciales reales"
echo "  2. Crear superusuario: python manage.py createsuperuser"
echo "  3. Verificar la configuracion de Python App en cPanel"
echo ""
