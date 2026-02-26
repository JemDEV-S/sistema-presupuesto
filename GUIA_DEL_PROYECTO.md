# SIDAPRESS - Guia Completa del Proyecto

## Sistema de Dashboard Presupuestal Municipal

---

## 1. Que es SIDAPRESS?

SIDAPRESS es un sistema web para monitorear la ejecucion presupuestal de una municipalidad. Permite visualizar cuanto dinero se asigno (PIA/PIM), cuanto se comprometio, certifico, devengo y giro, todo desglosado por unidades organicas, rubros, metas, clasificadores de gasto, etc.

**Stack tecnologico:**

| Capa | Tecnologia | Version |
|------|-----------|---------|
| Frontend | React + Vite | React 19, Vite 7 |
| UI | Material-UI (MUI) | 7.3 |
| Graficos | Recharts | 3.7 |
| Estado global | Zustand | 5.0 |
| Cache de datos | TanStack React Query | 5.90 |
| Formularios | React Hook Form | 7.71 |
| Backend | Django + DRF | Django 5.0, DRF 3.14 |
| Base de datos | MySQL | via PyMySQL |
| Autenticacion | JWT | simplejwt 5.3 |

---

## 2. Estructura de Carpetas

```
Proyecto Presupuesto/
├── sidapress-backend/          # API REST (Django)
│   ├── config/                 # Configuracion Django
│   │   ├── settings.py         # Base de datos, apps, JWT, CORS, etc.
│   │   └── urls.py             # Enrutamiento principal de la API
│   └── apps/                   # Aplicaciones Django
│       ├── authentication/     # Usuarios, roles, permisos, login
│       ├── organizacion/       # Unidades organicas (organigrama)
│       ├── catalogos/          # Tablas maestras (anios, fuentes, rubros, clasificadores)
│       ├── presupuesto/        # CORE: metas, ejecucion, dashboards
│       ├── importacion/        # Carga de archivos Excel
│       ├── reportes/           # Generacion de PDF/Excel
│       ├── alertas/            # Alertas automaticas
│       └── auditoria/          # Registro de cambios
│
└── sidapress-frontend/         # Interfaz web (React)
    └── src/
        ├── pages/              # Paginas completas
        │   ├── auth/           # Login
        │   ├── dashboards/     # 5 dashboards
        │   ├── presupuesto/    # Tablas de metas y ejecucion
        │   ├── reportes/       # Generacion de reportes
        │   └── admin/          # Usuarios, roles, auditoria, importacion, alertas
        ├── components/         # Componentes reutilizables
        │   ├── charts/         # Graficos (7 componentes)
        │   ├── tables/         # Tablas (2 componentes)
        │   ├── widgets/        # KPI Cards
        │   └── common/         # Layout, Sidebar, Navbar, FilterBar
        ├── services/           # Llamadas HTTP a la API
        ├── hooks/              # React Query hooks
        ├── store/              # Estado global (Zustand)
        ├── routes/             # Definicion de rutas
        ├── styles/             # Tema MUI
        └── utils/              # Formatters, constantes
```

---

## 3. Conceptos de Presupuesto Publico

Para entender el sistema, primero hay que entender el ciclo presupuestal peruano:

### 3.1 Jerarquia de Montos

```
PIA (Presupuesto Institucional de Apertura)
  El presupuesto aprobado al inicio del anio fiscal.

  + Modificaciones (creditos, transferencias, habilitaciones, anulaciones)
  = PIM (Presupuesto Institucional Modificado)
      El presupuesto actualizado despues de todas las modificaciones.

      → Certificado: Fondos reservados/garantizados para un gasto.
        → Compromiso: Obligacion formal de pago (contrato firmado).
          → Devengado: Servicio/bien recibido conforme (obligacion reconocida).
            → Girado: Cheque o transferencia emitida.
              → Pagado: Pago efectivamente recibido por el proveedor.
```

### 3.2 Indicadores Clave

| Indicador | Formula | Que mide |
|-----------|---------|----------|
| Avance Devengado % | (Devengado / PIM) x 100 | Que tan bien se esta ejecutando el presupuesto |
| Avance Certificado % | (Certificado / PIM) x 100 | Cuanto del presupuesto ya esta reservado |
| Eficiencia de Gasto | (Devengado / Certificado) x 100 | Del dinero reservado, cuanto ya se gasto |
| Saldo por Certificar | PIM - Certificado | Dinero aun disponible para certificar |
| Saldo por Devengar | Certificado - Devengado | Dinero certificado pendiente de gastar |

### 3.3 Entidades del Dominio

- **Meta**: Una actividad o proyecto con presupuesto asignado (ej: "Mantenimiento de vias", "Construccion de colegio").
- **Unidad Organica**: Departamento de la municipalidad (ej: "Gerencia de Infraestructura"). Tiene jerarquia de 3 niveles: Organo > Unidad > Sub Unidad.
- **Fuente de Financiamiento**: De donde viene el dinero (ej: "Recursos Ordinarios", "Canon Minero").
- **Rubro**: Subdivision de la fuente (ej: dentro de "Recursos Directamente Recaudados" hay rubros especificos).
- **Clasificador de Gasto**: Catalogo oficial que clasifica EN QUE se gasta. Tiene jerarquia: Generica > Subgenerica > Especifica.
- **Anio Fiscal**: El periodo contable (ej: 2026).

---

## 4. Backend en Detalle

### 4.1 settings.py - Configuracion Central

```python
# Lo mas importante del settings.py:

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',   # Motor MySQL
        'NAME': env('DB_NAME'),                  # Nombre de la BD (desde .env)
        ...
    }
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),   # Token valido 1 hora
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),       # Refresh valido 7 dias
}

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",           # Vite dev server local
    "http://192.168.50.223:5173",      # Vite en red local
]
```

**Concepto**: Django usa un archivo `.env` para variables sensibles (contrasenas, claves secretas). `settings.py` las lee con `environ.Env()`.

### 4.2 urls.py - Enrutamiento de la API

```python
# Todas las URLs empiezan con /api/
urlpatterns = [
    path("api/auth/",         include("apps.authentication.urls")),
    path("api/organizacion/", include("apps.organizacion.urls")),
    path("api/catalogos/",    include("apps.catalogos.urls")),
    path("api/presupuesto/",  include("apps.presupuesto.urls")),
    path("api/importacion/",  include("apps.importacion.urls")),
    path("api/auditoria/",    include("apps.auditoria.urls")),
    path("api/alertas/",      include("apps.alertas.urls")),
    path("api/reportes/",     include("apps.reportes.urls")),
]
```

**Concepto**: Cada app Django tiene su propio `urls.py`. El principal (`config/urls.py`) solo los incluye bajo un prefijo. Asi `/api/presupuesto/metas/` llega al `urls.py` de la app `presupuesto`.

### 4.3 Modelos - La Base de Datos

#### authentication/models.py

```python
class Usuario(AbstractUser):
    # Extiende el usuario de Django con campos adicionales
    dni = CharField(max_length=20)
    telefono = CharField(max_length=20)
    cargo = CharField(max_length=100)
    # ...

class Rol(Model):
    nombre = CharField()       # Ej: "Superadmin", "Analista"
    nivel = IntegerField()     # 0 = mas poder, 5 = menos poder

class Permiso(Model):
    codigo = CharField()       # Ej: "view", "create", "edit", "delete"
    modulo = CharField()       # Ej: "presupuesto", "reportes"

class UsuarioRol(Model):
    # Vincula usuario + rol + opcionalmente una unidad organica
    usuario = ForeignKey(Usuario)
    rol = ForeignKey(Rol)
    unidad_organica = ForeignKey(UnidadOrganica, null=True)
    # Un jefe puede tener rol solo para SU unidad
```

**Concepto**: El sistema usa RBAC (Role-Based Access Control). Un usuario tiene uno o mas roles, cada rol tiene permisos. Los permisos pueden estar limitados a una unidad organica especifica.

#### organizacion/models.py

```python
class UnidadOrganica(Model):
    codigo = CharField(unique=True)    # "001", "001-01", etc.
    nombre = CharField()               # "Gerencia Municipal"
    nivel = IntegerField(choices=[(1,'Organo'), (2,'Unidad'), (3,'Sub Unidad')])
    parent = ForeignKey('self')        # Jerarquia recursiva

    def get_hijos_recursivo(self):
        # Retorna todos los descendientes
```

**Concepto**: Estructura de arbol. Un Organo contiene Unidades, una Unidad contiene Sub Unidades. `parent` apunta al nodo padre.

#### catalogos/models.py

```python
class FuenteFinanciamiento(Model):
    codigo = CharField()     # "1"
    nombre = CharField()     # "Recursos Ordinarios"

class Rubro(Model):
    codigo = CharField()     # "00"
    nombre = CharField()     # "Recursos Ordinarios"
    fuente = ForeignKey(FuenteFinanciamiento)  # Cada rubro pertenece a una fuente

class ClasificadorGasto(Model):
    codigo = CharField()            # "2.3.1.1.1.1"
    generica = CharField()          # "2.3" (nivel mas alto)
    subgenerica = CharField()       # "2.3.1"
    especifica = CharField()        # "2.3.1.1"
    nombre_generica = CharField()   # "BIENES Y SERVICIOS"
    # ... mas niveles de detalle
```

**Concepto**: Son tablas "maestras" o "catalogos" - datos de referencia que no cambian frecuentemente. Son como diccionarios que clasifican la informacion presupuestal.

#### presupuesto/models.py - EL CORE

```python
class Meta(Model):
    # Una meta presupuestal (actividad o proyecto)
    anio_fiscal = ForeignKey(AnioFiscal)
    unidad_organica = ForeignKey(UnidadOrganica)
    codigo = CharField()                    # "0001"
    nombre = CharField()                    # "Gestion administrativa"
    tipo_meta = CharField()                 # "ACTIVIDAD" o "PROYECTO"
    nombre_producto_proyecto = CharField()  # Ej: "Programa articulado nutricional"
    # ... mas campos de clasificacion funcional

class EjecucionPresupuestal(Model):
    # UNA LINEA de ejecucion: Meta + Rubro + Clasificador = montos
    anio_fiscal = ForeignKey(AnioFiscal)
    meta = ForeignKey(Meta)
    rubro = ForeignKey(Rubro)
    clasificador_gasto = ForeignKey(ClasificadorGasto)
    pia = DecimalField()           # Presupuesto inicial
    modificaciones = DecimalField() # Cambios (+/-)
    pim = DecimalField()           # Presupuesto modificado
    certificado = DecimalField()   # Monto certificado
    compromiso_anual = DecimalField()

class EjecucionMensual(Model):
    # Desglose mensual de una ejecucion
    ejecucion = ForeignKey(EjecucionPresupuestal)
    mes = IntegerField()           # 1-12
    compromiso = DecimalField()
    devengado = DecimalField()
    girado = DecimalField()
    pagado = DecimalField()
```

**Concepto clave**: La relacion es:
```
Meta (que se hace)
  └── EjecucionPresupuestal (con que dinero, de que clasificador)
        └── EjecucionMensual (cuanto se ejecuto cada mes)
```

Una misma Meta puede tener MULTIPLES lineas de ejecucion (diferentes rubros y clasificadores). Para saber el total de una meta, hay que SUMAR todas sus ejecuciones.

### 4.4 calculator_service.py - El Cerebro de los Dashboards

Este archivo contiene las funciones que AGREGAN datos para los dashboards. Es el componente mas importante para entender como se calculan los indicadores.

```python
def get_resumen_general(anio_fiscal_id):
    """
    Calcula KPIs generales del anio fiscal.

    1. Suma PIA, PIM, Certificado de TODAS las ejecuciones del anio
    2. Suma Devengado, Girado de TODAS las ejecuciones mensuales
    3. Calcula porcentajes de avance
    4. Cuenta metas activas

    Retorna: { pia, pim, certificado, devengado, girado,
               avance_devengado_pct, avance_certificado_pct, ... }
    """

def get_ejecucion_mensual_acumulada(anio_fiscal_id):
    """
    Para el grafico de tendencia (LineChart).

    Agrupa ejecuciones mensuales por MES y acumula:
    - Mes 1: devengado enero
    - Mes 2: devengado enero + febrero
    - Mes 3: devengado enero + febrero + marzo
    - ... y asi sucesivamente

    Retorna: [{ mes: 1, mes_nombre: "Ene", acum_devengado: X, ... }, ...]
    """

def get_ejecucion_por_unidad(anio_fiscal_id):
    """
    Para el grafico de barras por unidad organica.

    Agrupa por unidad_organica y suma PIM + Certificado.
    Luego para cada unidad, calcula el devengado desde las mensuales.

    Retorna: [{ unidad_nombre, total_pim, total_devengado, avance_pct }, ...]
    """
```

**Concepto**: Django ORM permite hacer consultas complejas:
- `.filter()` = WHERE en SQL
- `.values()` = GROUP BY en SQL
- `.annotate(Sum(...))` = funciones de agregacion
- `F('campo__relacion__campo')` = acceder a campos de tablas relacionadas via JOINs

### 4.5 Filtros Helper

```python
def _apply_ejecucion_filters(qs, filters):
    """Aplica filtros opcionales a un queryset de EjecucionPresupuestal."""
    if filters.get('unidad_codigo'):
        qs = qs.filter(meta__unidad_organica__codigo=filters['unidad_codigo'])
    if filters.get('fuente_codigo'):
        qs = qs.filter(rubro__fuente__codigo=filters['fuente_codigo'])
    # ... mas filtros
    return qs
```

**Concepto**: Se usan "lookups" de Django (`meta__unidad_organica__codigo`) que siguen relaciones FK automaticamente. `meta__unidad_organica__codigo` equivale a hacer JOIN con Meta, luego JOIN con UnidadOrganica, y filtrar por su campo `codigo`.

### 4.6 views.py - Los Endpoints

```python
@api_view(['GET'])                    # Solo acepta GET
@permission_classes([IsAuthenticated]) # Requiere token JWT valido
def dashboard_resumen(request):
    anio_obj = _resolve_anio(request)  # Lee ?anio=2026 del query string
    if not anio_obj:
        return Response({'detail': 'No hay anio fiscal activo.'}, status=400)
    resumen = get_resumen_general(anio_obj.id)
    return Response(resumen)           # Django serializa dict a JSON automaticamente
```

**Concepto**: Cada endpoint de dashboard:
1. Resuelve el anio fiscal (desde query params o el activo)
2. Extrae filtros opcionales
3. Llama a la funcion del calculator_service
4. Retorna JSON

### 4.7 serializers.py - Transformacion de Datos

```python
class EjecucionPresupuestalSerializer(ModelSerializer):
    # Campos calculados que no existen en la BD
    devengado_total = SerializerMethodField()
    avance_pct = SerializerMethodField()

    # Nombres de relaciones (para no enviar solo IDs)
    meta_codigo = CharField(source='meta.codigo', read_only=True)
    rubro_nombre = CharField(source='rubro.nombre', read_only=True)

    def get_devengado_total(self, obj):
        # Suma el devengado de TODAS las ejecuciones mensuales
        return obj.mensuales.aggregate(total=Sum('devengado'))['total'] or 0
```

**Concepto**: Los serializers convierten objetos Python (modelos Django) a JSON y viceversa. Pueden incluir campos calculados (`SerializerMethodField`) que no existen en la base de datos.

### 4.8 filters.py - Filtros para los ViewSets CRUD

```python
class EjecucionFilter(FilterSet):
    pim_min = NumberFilter(field_name='pim', lookup_expr='gte')
    pim_max = NumberFilter(field_name='pim', lookup_expr='lte')

    class Meta:
        model = EjecucionPresupuestal
        fields = ['anio_fiscal', 'meta', 'rubro', 'clasificador_gasto']
```

**Concepto**: `django-filter` genera automaticamente filtros desde query params. `?pim_min=1000&rubro=5` filtra ejecuciones con PIM >= 1000 y rubro_id = 5.

### 4.9 Otras Apps

#### importacion/models.py
Rastrea la carga de archivos Excel con estados (PENDIENTE > PROCESANDO > COMPLETADO/ERROR) y estadisticas (filas procesadas, creadas, actualizadas, errores).

#### alertas/models.py
Sistema de alertas automaticas con tipos (SUBEJECUCION, SOBRECERTIFICACION, META_ATRASADA), severidades (INFO, WARNING, CRITICAL) y notificaciones por usuario.

#### auditoria/models.py
Registro completo de cambios: quien hizo que, cuando, desde donde (IP), con comparacion antes/despues en JSON.

#### reportes/views.py
Generacion de reportes PDF (con ReportLab) y Excel (con openpyxl). Reutiliza las funciones del calculator_service para obtener datos.

---

## 5. Frontend en Detalle

### 5.1 Flujo de Datos (Patron del Proyecto)

```
Usuario interactua
       ↓
   Pagina (pages/)
       ↓ usa
   Hook (hooks/useBudget.js)      ← React Query maneja cache
       ↓ llama
   Servicio (services/presupuesto.service.js)
       ↓ usa
   Cliente HTTP (services/api.js)  ← Axios con interceptor JWT
       ↓
   Backend Django (API REST)
       ↓
   Base de datos MySQL
```

### 5.2 api.js - Cliente HTTP con Autenticacion Automatica

```javascript
// Crea una instancia de Axios con URL base
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,  // http://192.168.50.223:8000/api
});

// INTERCEPTOR DE REQUEST: agrega token a cada peticion
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// INTERCEPTOR DE RESPONSE: si recibe 401, intenta refrescar el token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Intenta obtener un nuevo access token con el refresh token
      const refresh = localStorage.getItem('refresh_token');
      const { data } = await axios.post('.../auth/refresh/', { refresh });
      localStorage.setItem('access_token', data.access);
      // Reintenta la peticion original con el nuevo token
      return api(error.config);
    }
    return Promise.reject(error);
  }
);
```

**Concepto**: Los interceptores de Axios funcionan como "middleware" para las peticiones HTTP. El de request agrega el token JWT automaticamente. El de response maneja la expiracion del token de forma transparente.

### 5.3 authStore.js - Estado Global de Autenticacion (Zustand)

```javascript
const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,

  login: async (credentials) => {
    const response = await authService.login(credentials);
    // Guarda tokens en localStorage
    // Actualiza el estado
    set({ user: response.user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('access_token');
    set({ user: null, isAuthenticated: false });
  },

  loadUser: async () => {
    // Al iniciar la app, verifica si hay sesion activa
    const token = localStorage.getItem('access_token');
    if (token) {
      const user = await authService.getProfile();
      set({ user, isAuthenticated: true });
    }
  },
}));
```

**Concepto**: Zustand es una alternativa ligera a Redux. `create()` define un store con estado y acciones. Los componentes acceden al estado con `useAuthStore((state) => state.user)`. Cuando el estado cambia, los componentes se re-renderizan automaticamente.

### 5.4 presupuesto.service.js - Capa de Servicios

```javascript
const presupuestoService = {
  // Cada metodo corresponde a un endpoint del backend
  getResumen: (anio, filters = {}) =>
    api.get('/presupuesto/dashboard/resumen/', { params: { anio, ...filters } }),

  getTendencia: (anio, filters = {}) =>
    api.get('/presupuesto/dashboard/tendencia/', { params: { anio, ...filters } }),

  // Los filtros se envian como query params: ?anio=2026&unidad_id=XXX
  getPorRubro: (anio, filters = {}) =>
    api.get('/presupuesto/dashboard/por-rubro/', { params: { anio, ...filters } }),
};
```

**Concepto**: Capa de abstraccion entre los componentes y la API. Si la URL de un endpoint cambia, solo se modifica aqui.

### 5.5 useBudget.js - React Query Hooks

```javascript
export const useResumen = (anio, filters = {}) => {
  return useQuery({
    queryKey: ['resumen', anio, filters],  // Clave unica de cache
    queryFn: () => presupuestoService.getResumen(anio, filters).then(r => r.data),
  });
};
// Retorna: { data, isLoading, error, refetch }
```

**Concepto**: React Query maneja:
- **Cache**: Si ya pidio `['resumen', 2026, {}]`, no vuelve a llamar a la API.
- **Loading states**: `isLoading` es true mientras espera la respuesta.
- **Error handling**: `error` contiene el error si fallo.
- **Refetch automatico**: Cuando la ventana recupera el foco, puede re-validar.
- **Invalidacion**: Si los `queryKey` cambian (ej: cambio de anio), hace una nueva peticion.

### 5.6 Componentes de Graficos

#### KPICard.jsx
```
┌─────────────────────┐
│  [Icono]  Titulo    │
│           S/ 1,234  │  ← valor formateado
│           ▲ 5.2%    │  ← subtitulo con tendencia
└─────────────────────┘
```
Recibe: `title`, `value`, `subtitle`, `icon`, `color`, `trend`

#### GaugeChart.jsx
```
        ╭────────╮
       /  75.3%   \     ← Semicirculo coloreado
      |   Optimo   |    ← Etiqueta de estado
       \___________/
      Avance Devengado   ← Titulo
```
Colores segun valor: Verde (>=75%), Naranja (>=50%), Rojo (<25%).
Usa internamente un PieChart de Recharts con `startAngle={180}` y `endAngle={0}`.

#### TrendLineChart.jsx
```
  S/│     ╱────── Devengado acumulado
    │   ╱╱─────── Compromiso acumulado
    │  ╱╱╱──────── Girado acumulado
    │╱╱╱
    └──────────────
    Ene Feb Mar Abr ...
```
Muestra la ejecucion acumulada mes a mes.

#### GenericaBarChart.jsx / UnidadBarChart.jsx
Graficos de barras verticales comparando PIM vs Certificado vs Devengado.

#### RubroBarChart.jsx
Barras HORIZONTALES (mejor para nombres largos de rubros).

#### TipoMetaPieChart.jsx
Donut chart comparando Actividades vs Proyectos.

#### ClasificadorTreemap.jsx
Rectangulos proporcionales al PIM de cada clasificador generico (los mas grandes ocupan mas espacio).

#### ComparativoBarChart.jsx
BarChart generico configurable: acepta layout vertical/horizontal, barras dinamicas, colores personalizados.

### 5.7 SortableTable.jsx - Tabla con Ordenamiento

```javascript
const SortableTable = ({ title, columns, data, defaultSort, paginated }) => {
  const [orderBy, setOrderBy] = useState(defaultSort.key);
  const [order, setOrder] = useState('asc');

  // Al hacer click en una cabecera, ordena los datos
  const handleSort = (columnKey) => {
    const isAsc = orderBy === columnKey && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(columnKey);
  };

  // Ordena datos en memoria (client-side)
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => { ... });
  }, [data, orderBy, order]);
};
```

**Concepto**: Usa `TableSortLabel` de MUI para mostrar flechas de ordenamiento. El ordenamiento es client-side (en el navegador), no requiere nueva peticion al servidor.

Definicion de columnas:
```javascript
const columns = [
  { key: 'meta_codigo', label: 'Codigo', sortable: true },
  { key: 'total_pim', label: 'PIM', align: 'right', format: formatCurrency },
  { key: 'avance_pct', label: 'Avance', render: (val) => <ProgressCell value={val} /> },
];
```

### 5.8 FilterBar.jsx - Barra de Filtros

```javascript
const FilterBar = ({ filters, values, onChange, collapsible }) => {
  // filters = [{ name: 'fuente', label: 'Fuente', options: [...], width: 220 }]
  // values = { fuente: '', unidad: '' }
  // onChange = (name, value) => { ... }
};
```

**Concepto**: Componente generico que renderiza N dropdowns (Select de MUI). Cada dashboard define sus propios filtros pasandolos como props.

### 5.9 Sidebar.jsx - Navegacion con Sub-menu

```
┌──────────────────┐
│    SIDAPRESS      │
│                   │
│ ▼ Dashboards      │  ← Click para expandir/colapsar
│   ○ Ejecutivo     │
│   ● Unidad Org.   │  ← Seleccionado (resaltado)
│   ○ Rubros        │
│   ○ Tipo Proyecto │
│   ○ Clasificadores│
│                   │
│ □ Presupuesto     │
│ □ Reportes        │
│ □ Importacion     │
│ □ Alertas         │
│───────────────────│
│ ADMINISTRACION    │
│ □ Usuarios        │
│ □ Roles           │
│ □ Auditoria       │
└──────────────────┘
```

Usa `Collapse` de MUI para animar el despliegue del sub-menu de dashboards.

### 5.10 AppRoutes.jsx - Definicion de Rutas

```javascript
const PrivateLayout = ({ children }) => (
  <PrivateRoute>           {/* Verifica autenticacion */}
    <Layout>{children}</Layout>  {/* Agrega Navbar + Sidebar */}
  </PrivateRoute>
);

// Cada ruta envuelve la pagina en PrivateLayout
<Route path="/dashboard" element={<PrivateLayout><ExecutiveDashboard /></PrivateLayout>} />
<Route path="/dashboard/unidad-organica" element={<PrivateLayout><UnidadDashboard /></PrivateLayout>} />
```

**Concepto**: `PrivateRoute` verifica si hay token JWT valido. Si no, redirige a `/login`. `Layout` agrega la barra lateral (Sidebar) y la barra superior (Navbar) alrededor del contenido.

### 5.11 theme.js - Tema Visual

```javascript
const theme = createTheme({
  palette: {
    primary: { main: '#1565c0' },      // Azul corporativo
    secondary: { main: '#00897b' },     // Verde teal
    background: { default: '#f5f5f5' }, // Gris claro de fondo
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: { root: { textTransform: 'none', borderRadius: 8 } },
    },
  },
});
```

**Concepto**: MUI permite definir un tema global que afecta TODOS los componentes. Colores, tipografia, bordes, sombras - todo se configura en un solo lugar.

---

## 6. Anatomia de un Dashboard

Tomemos como ejemplo el **Dashboard por Unidad Organica** para entender como se conecta todo:

### Paso 1: Usuario navega a `/dashboard/unidad-organica`

`AppRoutes.jsx` renderiza `UnidadDashboard` dentro de `PrivateLayout`.

### Paso 2: El componente carga datos

```javascript
// UnidadDashboard.jsx
const [anio, setAnio] = useState(2026);
const [unidadId, setUnidadId] = useState('');

// Hook que llama al API cuando unidadId tiene valor
const { data: resumen } = useUnidadDetalle(anio, unidadId, filters);
// Internamente: GET /api/presupuesto/dashboard/unidad-detalle/?anio=2026&unidad_id=XXX
```

### Paso 3: El backend procesa la peticion

```
views.py: dashboard_unidad_detalle(request)
  → _resolve_anio(request)              # anio_fiscal_id = 1
  → _extract_filters(request)           # { unidad_codigo: 'S_84d1c908d7f2' }
  → get_resumen_filtrado(1, filters)    # Llama al calculator service
```

### Paso 4: El calculator service agrega datos

```python
# calculator_service.py
ejecuciones = EjecucionPresupuestal.objects.filter(anio_fiscal_id=1)
ejecuciones = ejecuciones.filter(meta__unidad_organica__codigo='S_84d1c908d7f2')

totales = ejecuciones.aggregate(
    total_pia=Sum('pia'),
    total_pim=Sum('pim'),
    ...
)
# SQL generado:
# SELECT SUM(pia), SUM(pim), ...
# FROM ejecucion_presupuestal
# JOIN meta ON ...
# JOIN unidad_organica ON ...
# WHERE anio_fiscal_id = 1 AND unidad_organica.codigo = 'S_84d1c908d7f2'
```

### Paso 5: El frontend renderiza

```jsx
<KPICard title="PIM" value={formatCurrency(resumen?.pim)} />
// Muestra: "PIM" y "S/ 1,234,567.89"

<GaugeChart title="Avance Devengado" value={resumen?.avance_devengado_pct} />
// Muestra: semicirculo al 65.3% en color naranja

<SortableTable columns={metasColumns} data={metas} />
// Tabla con columnas ordenables
```

---

## 7. Mapa de Endpoints de la API

### Autenticacion
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| POST | `/api/auth/login/` | Login, retorna tokens JWT |
| POST | `/api/auth/refresh/` | Renueva access token |
| POST | `/api/auth/logout/` | Cierra sesion |
| GET | `/api/auth/profile/` | Datos del usuario autenticado |

### Dashboards
| Metodo | Endpoint | Parametros | Descripcion |
|--------|----------|------------|-------------|
| GET | `/api/presupuesto/dashboard/resumen/` | `?anio=2026` | KPIs generales |
| GET | `/api/presupuesto/dashboard/tendencia/` | `?anio=2026` | Tendencia mensual acumulada |
| GET | `/api/presupuesto/dashboard/por-fuente/` | `?anio=2026` | Agrupado por fuente financiamiento |
| GET | `/api/presupuesto/dashboard/por-generica/` | `?anio=2026` | Agrupado por generica de gasto |
| GET | `/api/presupuesto/dashboard/por-unidad/` | `?anio=2026` | Agrupado por unidad organica |
| GET | `/api/presupuesto/dashboard/top-metas/` | `?anio=2026&limit=10&order=mayor_pim` | Top N metas |
| GET | `/api/presupuesto/dashboard/unidad-detalle/` | `?anio=2026&unidad_id=XXX` | Resumen de una unidad |
| GET | `/api/presupuesto/dashboard/unidad-metas/` | `?anio=2026&unidad_id=XXX` | Metas de una unidad |
| GET | `/api/presupuesto/dashboard/unidad-clasificadores/` | `?anio=2026&unidad_id=XXX` | Clasificadores de una unidad |
| GET | `/api/presupuesto/dashboard/por-rubro/` | `?anio=2026` | Agrupado por rubro |
| GET | `/api/presupuesto/dashboard/por-tipo-meta/` | `?anio=2026` | Actividades vs Proyectos |
| GET | `/api/presupuesto/dashboard/por-producto-proyecto/` | `?anio=2026` | Por producto/proyecto |
| GET | `/api/presupuesto/dashboard/clasificador-detalle/` | `?anio=2026` | Generica + subgenerica |
| GET | `/api/presupuesto/dashboard/tendencia-filtrada/` | `?anio=2026&unidad_id=X` | Tendencia con filtros |

### CRUD
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET/POST | `/api/presupuesto/metas/` | Listar/crear metas |
| GET/PUT/DELETE | `/api/presupuesto/metas/{id}/` | Detalle/editar/eliminar meta |
| GET/POST | `/api/presupuesto/ejecuciones/` | Listar/crear ejecuciones |

---

## 8. Como Ejecutar el Proyecto

### Backend
```bash
cd sidapress-backend
python -m venv venv
venv\Scripts\activate            # Windows
pip install -r requirements.txt
# Configurar .env con credenciales de MySQL
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

### Frontend
```bash
cd sidapress-frontend
npm install
# Configurar .env con VITE_API_URL=http://localhost:8000/api
npm run dev
```

---

## 9. Glosario Rapido

| Termino | Significado |
|---------|-------------|
| **PIA** | Presupuesto Institucional de Apertura (inicial) |
| **PIM** | Presupuesto Institucional Modificado (actual) |
| **Certificado** | Dinero reservado/garantizado |
| **Devengado** | Obligacion reconocida (bien/servicio recibido) |
| **Girado** | Pago emitido |
| **Meta** | Actividad o proyecto con presupuesto |
| **Rubro** | Linea de financiamiento |
| **Clasificador** | Categoria de gasto (en que se gasta) |
| **Fuente** | Origen del dinero |
| **Unidad Organica** | Departamento de la municipalidad |
| **JWT** | JSON Web Token (autenticacion) |
| **DRF** | Django REST Framework |
| **MUI** | Material-UI (libreria de componentes React) |
| **ORM** | Object-Relational Mapping (Django traduce Python a SQL) |
| **RBAC** | Role-Based Access Control (permisos por rol) |
