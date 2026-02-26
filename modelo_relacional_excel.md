# Modelo Relacional - Archivos Excel MEF (SIDAPRESS)

## Archivos de Origen

| # | Archivo | Formato | Hojas | Filas (SheetGasto) | Columnas | Uso |
|---|---------|---------|-------|--------------------|----------|-----|
| 1 | `ReporteGasto_30.01.26.xlsx` | .xlsx | 9 hojas | 1,222 | 107 | Carga inicial (una vez) |
| 2 | `ReporteGasto (9).xls` | .xls | 1 hoja | 1,404 | 86 | Importacion diaria |

---

## EXCEL 1: `ReporteGasto_30.01.26.xlsx` (9 hojas, 107 columnas)

### Hoja 1: RB (Rubros / Fuentes de Financiamiento)

**Filas:** 9 | **Columnas:** 5

| # Col | Nombre Columna | Tipo | Ejemplo | Descripcion |
|-------|---------------|------|---------|-------------|
| 0 | `ANIO` | texto | `"2026"` | Ano fiscal |
| 1 | `FUENTE` | texto | `"1. RECURSOS ORDINARIOS"` | Codigo + nombre de fuente de financiamiento (formato: `numero. NOMBRE`) |
| 2 | `RUBRO` | texto | `"00.RECURSOS ORDINARIOS"` | Codigo + nombre del rubro (formato: `codigo.NOMBRE`) |
| 3 | `DES_RUBRO` | texto | `"CORRESPONDEN A LOS INGRESOS..."` | Descripcion detallada del rubro |
| 4 | *(sin nombre)* | texto | `"00. RO"` | Codigo corto del rubro (abreviatura) |

**Datos completos (9 filas):**

| Fuente | Rubro | Abreviatura |
|--------|-------|-------------|
| 1. RECURSOS ORDINARIOS | 00.RECURSOS ORDINARIOS | 00. RO |
| 2. RECURSOS DIRECTAMENTE RECAUDADOS | 09.RECURSOS DIRECTAMENTE RECAUDADOS | 09. RDR |
| 3. RECURSOS POR OPERACIONES OFICIALES DE CREDITO | 19.RECURSOS POR OPERACIONES OFICIALES DE CREDITO | 19. ROOC |
| 4. DONACIONES Y TRANSFERENCIAS | 13.DONACIONES Y TRANSFERENCIAS | 13. DT |
| 5. RECURSOS DETERMINADOS | 07.FONDO DE COMPENSACION MUNICIPAL | 07. FCM |
| 5. RECURSOS DETERMINADOS | 15.FONDO DE COMPENSACION REGIONAL - FONCOR | 15. FONCOR |
| 5. RECURSOS DETERMINADOS | 04.CONTRIBUCIONES A FONDOS | 04. CF |
| 5. RECURSOS DETERMINADOS | 18.CANON Y SOBRECANON, REGALIAS... | 18. CSC |
| 5. RECURSOS DETERMINADOS | 08.IMPUESTOS MUNICIPALES | 08. IM |

> **Nota:** Una misma fuente (ej: "5. RECURSOS DETERMINADOS") puede tener multiples rubros.

---

### Hoja 2: CG (Clasificadores de Gasto)

**Filas:** 923 | **Columnas:** 5

| # Col | Nombre Columna | Tipo | Ejemplo | Descripcion |
|-------|---------------|------|---------|-------------|
| 0 | `ANIO` | texto | `"2026"` | Ano fiscal |
| 1 | `CLASIFICADOR` | texto | `"2.3.1.99.1.99"` | Codigo jerarquico del clasificador |
| 2 | `DESCRIPCION` | texto | `"OTROS BIENES"` | Nombre del clasificador |
| 3 | `DESCRIPCION_DETALLADA` | texto | `"GASTOS POR LA ADQUISICION..."` | Descripcion larga del gasto |
| 4 | *(sin nombre)* | texto | `"RESTRINGIDO"` o `None` | Indicador de restriccion (solo algunos) |

**Estructura jerarquica del clasificador (6 niveles):**

```
Nivel 1: 2.X              → Tipo de transaccion    (ej: "2.3" = BIENES Y SERVICIOS)
Nivel 2: 2.X.X            → Generica               (ej: "2.3.1" = COMPRA DE BIENES)
Nivel 3: 2.X.X.X          → Subgenerica            (ej: "2.3.1.99" = COMPRA DE OTROS BIENES)
Nivel 4: 2.X.X.X.X        → Subgenerica detalle    (ej: "2.3.1.99.1" = COMPRA DE OTROS BIENES)
Nivel 5: 2.X.X.X.X.X      → Especifica detalle     (ej: "2.3.1.99.1.99" = OTROS BIENES)
```

> **Nota:** Solo se importan los de nivel 6 (mas detallados) ya que contienen la informacion completa. Los niveles superiores se extraen del mismo codigo.

---

### Hoja 3: SF (Secuencia Funcional)

**Filas:** 197 (header en fila 2) | **Columnas:** 15

| # Col | Nombre Columna | Tipo | Ejemplo | Descripcion |
|-------|---------------|------|---------|-------------|
| 0 | *(vacio)* | - | - | Sin uso |
| 1 | `SECUENCIA FUNCIONAL` | entero | `1` | ID unico que identifica cada combinacion funcional-programatica |
| 2 | `NRO. PP` | texto | `"0002"` | Codigo del programa presupuestal |
| 3 | `PROGRAMA PRESUPUESTAL` | texto | `"SALUD MATERNO NEONATAL"` | Nombre del programa presupuestal |
| 4 | `TIPO` | texto | `"PRODUCTO"` | Tipo: PRODUCTO, PROYECTO, ACTIVIDAD |
| 5 | `PRODUCTO - PROYECTO` | texto | `"3033412.FAMILIAS SALUDABLES..."` | Codigo.Nombre del producto o proyecto |
| 6 | `ACTIVIDAD` | texto | `"5005986.ACCIONES DE MUNICIPIOS..."` | Codigo.Nombre de la actividad, obra o accion de inversion |
| 7 | `FUNCION` | texto | `"20.SALUD"` | Codigo.Nombre de la funcion |
| 8 | `DIVISION FUNCIONAL` | texto | `"043.SALUD COLECTIVA"` | Codigo.Nombre de la division funcional |
| 9 | `GRUPO FUNCIONAL` | texto | `"0095.CONTROL DE RIESGOS..."` | Codigo.Nombre del grupo funcional |
| 10 | `FINALIDAD` | texto | `"0215062.ACCIONES DE MUNICIPIOS..."` | Codigo.Nombre de la finalidad |
| 11 | `ORGANO` | texto | `"GERENCIA DE DESARROLLO SOCIAL"` | Nombre del organo (nivel 1) |
| 12 | `UNIDAD ORGANICA` | texto | `"GERENCIA DE DESARROLLO SOCIAL"` | Nombre de la unidad organica (nivel 2) |
| 13 | `SUB UNIDAD ORGANICA` | texto | `"GERENCIA DE DESARROLLO SOCIAL"` | Nombre de la sub unidad organica (nivel 3) |
| 14 | `NOMBRE CORTO` | texto | `"GDS"` | Abreviatura de la unidad |

> **Nota:** Las columnas 11-14 mapean cada sec_func a la jerarquia organizacional. Muchas filas despues de la 116 tienen valores `#REF!` por formulas rotas en el Excel.

> **Relacion clave:** `sec_func` (col 1) conecta con la columna `sec_func` (col 20) de SheetGasto, proporcionando la unidad organica que NO viene en SheetGasto directamente.

---

### Hoja 4: SheetGasto (Datos de Ejecucion Presupuestal) - HOJA PRINCIPAL

**Filas:** 1,222 | **Columnas:** 107

#### Grupo A: Identificacion Institucional (cols 0-4)

| # Col | Nombre Columna | Tipo | Ejemplo | Descripcion |
|-------|---------------|------|---------|-------------|
| 0 | `ano_eje` | entero | `2026` | Ano de ejercicio fiscal |
| 1 | `departamento` | texto | `"08. CUSCO"` | Codigo.Nombre del departamento |
| 2 | `provincia` | texto | `"01. CUSCO"` | Codigo.Nombre de la provincia |
| 3 | `pliego` | texto | `"04. SAN JERONIMO"` | Codigo.Nombre del pliego (municipalidad) |
| 4 | `sec_ejec` | entero | `300687` | Codigo de la seccion de ejecucion |

#### Grupo B: Cadena Funcional Programatica (cols 5-16) - FORMATO `CODIGO.DESCRIPCION`

| # Col | Nombre Columna | Formato | Ejemplo | Se parsea a |
|-------|---------------|---------|---------|-------------|
| 5 | `programa_pptal` | `cod.nombre` | `"0002.SALUD MATERNO NEONATAL"` | codigo: `0002`, nombre: `SALUD MATERNO NEONATAL` |
| 6 | `tipo_prod_proy` | `cod.nombre` | `"3.PRODUCTO"` | codigo: `3`, nombre: `PRODUCTO` |
| 7 | `producto_proyecto` | `cod.nombre` | `"3033412.FAMILIAS SALUDABLES..."` | codigo: `3033412`, nombre: `FAMILIAS SALUDABLES...` |
| 8 | `tipo_act_obra_ac` | `cod.nombre` | `"5.ACTIVIDAD"` | codigo: `5`, nombre: `ACTIVIDAD` |
| 9 | `activ_obra_accinv` | `cod.nombre` | `"5005986.ACCIONES DE MUNICIPIOS..."` | codigo: `5005986`, nombre: `ACCIONES DE MUNICIPIOS...` |
| 10 | `funcion` | `cod.nombre` | `"20.SALUD"` | codigo: `20`, nombre: `SALUD` |
| 11 | `division_fn` | `cod.nombre` | `"043.SALUD COLECTIVA"` | codigo: `043`, nombre: `SALUD COLECTIVA` |
| 12 | `grupo_fn` | `cod.nombre` | `"0095.CONTROL DE RIESGOS..."` | codigo: `0095`, nombre: `CONTROL DE RIESGOS...` |
| 13 | `meta` | entero | `1` | Numero de meta presupuestal (clave) |
| 14 | `finalidad` | `cod.nombre` | `"0215062.ACCIONES DE MUNICIPIOS..."` | codigo: `0215062`, nombre: `ACCIONES DE MUNICIPIOS...` |
| 15 | `unidad_medida` | `cod.nombre` | `"056.FAMILIA"` | codigo: `056`, nombre: `FAMILIA` |
| 16 | `cant_meta_anual` | entero | `812` | Cantidad meta fisica anual |

#### Grupo C: Avance Fisico y Ubicacion (cols 17-23)

| # Col | Nombre Columna | Tipo | Ejemplo | Descripcion |
|-------|---------------|------|---------|-------------|
| 17 | `cant_meta_sem` | entero | `0` | Cantidad meta semestral |
| 18 | `avan_fisico_anual` | entero | `0` | Avance fisico anual |
| 19 | `avan_fisico_sem` | entero | `0` | Avance fisico semestral |
| 20 | `sec_func` | entero | `1` | **Secuencia funcional** (FK a hoja SF) |
| 21 | `departamento_meta` | texto | `"08.CUSCO"` | Departamento de la meta |
| 22 | `provincia_meta` | texto | `"01.CUSCO"` | Provincia de la meta |
| 23 | `distrito_meta` | texto | `"04.SAN JERONIMO"` | Distrito de la meta |

#### Grupo D: Fuente y Clasificador de Gasto (cols 24-38) - FORMATO ESPECIAL .xlsx

> **IMPORTANTE:** En el .xlsx las columnas del clasificador vienen **separadas** en codigo numerico + nombre en columnas alternas ("Columna1"-"Columna6").

| # Col | Nombre Columna | Tipo | Ejemplo | Descripcion |
|-------|---------------|------|---------|-------------|
| 24 | `fuente_financ` | `cod.nombre` | `"2.RECURSOS DIRECTAMENTE RECAUDADOS"` | Fuente de financiamiento |
| 25 | `rubro` | `cod.nombre` | `"09.RECURSOS DIRECTAMENTE RECAUDADOS"` | Rubro |
| 26 | `categoria_gasto` | `cod.nombre` | `"5.GASTOS CORRIENTES"` | Categoria del gasto |
| 27 | `tipo_transaccion` | **entero** | `2` | Codigo tipo transaccion (solo numero) |
| 28 | `Columna1` | texto | `"GASTOS PRESUPUESTARIOS"` | Nombre del tipo transaccion |
| 29 | `generica` | **entero** | `3` | Codigo generica (solo numero) |
| 30 | `Columna2` | texto | `"BIENES Y SERVICIOS"` | Nombre de la generica |
| 31 | `subgenerica` | **entero** | `1` | Codigo subgenerica |
| 32 | `Columna3` | texto | `"COMPRA DE BIENES"` | Nombre de la subgenerica |
| 33 | `subgenerica_det` | **entero** | `99` | Codigo subgenerica detalle |
| 34 | `Columna4` | texto | `"COMPRA DE OTROS BIENES"` | Nombre subgenerica detalle |
| 35 | `especifica` | **entero** | `1` | Codigo especifica |
| 36 | `Columna5` | texto | `"COMPRA DE OTROS BIENES"` | Nombre de la especifica |
| 37 | `especifica_det` | **entero** | `99` | Codigo especifica detalle |
| 38 | `Columna6` | texto | `"OTROS BIENES"` | Nombre de la especifica detalle |

> El clasificador se construye uniendo: `2.{tipo_transaccion}.{generica}.{subgenerica}.{subgenerica_det}.{especifica}.{especifica_det}` → `"2.3.1.99.1.99"`

#### Grupo E: Montos Presupuestales (cols 39-43)

| # Col | Nombre Columna | Tipo | Ejemplo | Descripcion |
|-------|---------------|------|---------|-------------|
| 39 | `mto_pia` | numerico | `5000` | Presupuesto Institucional de Apertura |
| 40 | `mto_modificaciones` | numerico | `0` | Monto de modificaciones presupuestales |
| 41 | `mto_pim` | numerico | `5000` | Presupuesto Institucional Modificado (PIA + Modificaciones) |
| 42 | `mto_certificado` | numerico | `0` | Monto certificado |
| 43 | `mto_compro_anual` | numerico | `0` | Compromiso anual |

#### Grupo F: Ejecucion Mensual (cols 44-91) - 4 tipos x 12 meses

| Tipo | Columnas | Descripcion |
|------|----------|-------------|
| **Compromiso mensual** | 44-55 (`mto_at_comp_01` a `mto_at_comp_12`) | Montos comprometidos por mes |
| **Devengado mensual** | 56-67 (`mto_devenga_01` a `mto_devenga_12`) | Montos devengados por mes |
| **Girado mensual** | 68-79 (`mto_girado_01` a `mto_girado_12`) | Montos girados por mes |
| **Pagado mensual** | 80-91 (`mto_pagado_01` a `mto_pagado_12`) | Montos pagados por mes |

> Cada tipo tiene 12 columnas (enero a diciembre). Total: 48 columnas de ejecucion mensual.

#### Grupo G: Filtros y Organizacion (cols 92-106) - NO SE IMPORTAN

| # Col | Nombre Columna | Ejemplo | Descripcion |
|-------|---------------|---------|-------------|
| 92 | `filtro_generica` | `"2.3 - GASTOS PRESUPUESTARIOS"` | Filtro auxiliar por generica |
| 93 | `filtro_especifica` | `"2.3.1.99.1.99 - OTROS BIENES"` | Filtro auxiliar por especifica |
| 94 | `filtro_certificacion` | `0` | Filtro de certificacion |
| 95 | `filtro_compromisoanual` | `0` | Filtro de compromiso anual |
| 96 | `filtro_compromisomensual` | `0` | Filtro de compromiso mensual |
| 97 | `filtro_devengado` | `0` | Filtro de devengado |
| 98 | `filtro_girado` | `0` | Filtro de girado |
| 99 | `filtro_pagado` | `0` | Filtro de pagado |
| 100 | `filtro_saldocert` | `5000` | Saldo de certificacion |
| 101 | `filtro_restringido` | `0` | Indicador de restriccion |
| 102 | `filtro_rubro` | `"09. RDR"` | Filtro por rubro (abreviatura) |
| 103 | `organo` | `NULL` | Organo (SIEMPRE VACIO en este archivo) |
| 104 | `unidad organica` | `NULL` | Unidad organica (SIEMPRE VACIO) |
| 105 | `sub unidad organica` | `NULL` | Sub unidad organica (SIEMPRE VACIO) |
| 106 | `nombre corto` | `NULL` | Nombre corto (SIEMPRE VACIO) |

> **Las columnas 103-106 estan siempre vacias.** La informacion organizacional se obtiene cruzando `sec_func` (col 20) con la hoja SF.

---

### Hoja 5: Matriz_modificacion (Auxiliar)

**Filas:** 799 | **Columnas:** 5

Hoja auxiliar para el formato de modificaciones presupuestales. Contiene datos de referencia para la hoja `F_Modificacion`. **No se importa directamente.**

### Hoja 6: F_Modificacion (Formato de Solicitud)

**Filas:** 36 | **Columnas:** 10

Plantilla/formato de solicitud de modificacion presupuestal. Es una hoja de trabajo interno, no datos transaccionales. **No se importa.**

### Hoja 7: REP_1_META (Reporte por Meta)

**Filas:** 22 | **Columnas:** 9

Reporte resumen por meta presupuestal. Es un reporte derivado de SheetGasto. **No se importa** (se genera desde los datos importados).

### Hoja 8: REP_2_CFP (Reporte Cadena Funcional Programatica)

**Filas:** 560 | **Columnas:** 15

Reporte detallado de la cadena funcional programatica. Es un reporte derivado. **No se importa.**

### Hoja 9: REP_3_BusquedaCG (Busqueda de Saldos por Clasificador)

**Filas:** 26 | **Columnas:** 9

Herramienta de busqueda de saldos por clasificador de gasto. Es una hoja de consulta. **No se importa.**

---

## EXCEL 2: `ReporteGasto (9).xls` (1 hoja, 86 columnas)

### Hoja unica: SheetGasto (Datos de Ejecucion Presupuestal)

**Filas:** 1,404 | **Columnas:** 86

#### Diferencias clave con Excel 1

| Aspecto | Excel 1 (.xlsx) | Excel 2 (.xls) |
|---------|-----------------|-----------------|
| Columnas totales | 107 | 86 |
| Clasificador de gasto | Codigo y nombre **separados** (cols 27-38) | Formato `codigo.nombre` **unido** (cols 27-32) |
| Columnas "ColumnaX" | Si (6 columnas intermedias) | No existen |
| Columnas filtro (92-102) | Si (11 columnas) | No existen |
| Columnas org (103-106) | Si (vacias) | No existen |
| Hojas adicionales | RB, CG, SF + 5 reportes | Ninguna |

#### Mapeo completo de columnas (.xls)

##### Grupo A: Identificacion (cols 0-4) - IGUAL que .xlsx

| # Col | Nombre | Ejemplo |
|-------|--------|---------|
| 0 | `ano_eje` | `2026` |
| 1 | `departamento` | `"08. CUSCO"` |
| 2 | `provincia` | `"01. CUSCO"` |
| 3 | `pliego` | `"04. SAN JERONIMO"` |
| 4 | `sec_ejec` | `300687` |

##### Grupo B: Cadena Funcional (cols 5-16) - IGUAL que .xlsx

| # Col | Nombre | Formato | Ejemplo |
|-------|--------|---------|---------|
| 5 | `programa_pptal` | `cod.nombre` | `"0002.SALUD MATERNO NEONATAL"` |
| 6 | `tipo_prod_proy` | `cod.nombre` | `"3.PRODUCTO"` |
| 7 | `producto_proyecto` | `cod.nombre` | `"3033412.FAMILIAS SALUDABLES..."` |
| 8 | `tipo_act_obra_ac` | `cod.nombre` | `"5.ACTIVIDAD"` |
| 9 | `activ_obra_accinv` | `cod.nombre` | `"5005986.ACCIONES DE MUNICIPIOS..."` |
| 10 | `funcion` | `cod.nombre` | `"20.SALUD"` |
| 11 | `division_fn` | `cod.nombre` | `"043.SALUD COLECTIVA"` |
| 12 | `grupo_fn` | `cod.nombre` | `"0095.CONTROL DE RIESGOS..."` |
| 13 | `meta` | entero | `1` |
| 14 | `finalidad` | `cod.nombre` | `"0215062.ACCIONES DE MUNICIPIOS..."` |
| 15 | `unidad_medida` | `cod.nombre` | `"056.FAMILIA"` |
| 16 | `cant_meta_anual` | entero | `812` |

##### Grupo C: Avance y Ubicacion (cols 17-23) - IGUAL que .xlsx

| # Col | Nombre | Ejemplo |
|-------|--------|---------|
| 17 | `cant_meta_sem` | `0` |
| 18 | `avan_fisico_anual` | `0` |
| 19 | `avan_fisico_sem` | `0` |
| 20 | `sec_func` | `1` |
| 21 | `departamento_meta` | `"08.CUSCO"` |
| 22 | `provincia_meta` | `"01.CUSCO"` |
| 23 | `distrito_meta` | `"04.SAN JERONIMO"` |

##### Grupo D: Fuente y Clasificador (cols 24-32) - DIFERENTE al .xlsx

> **En el .xls TODOS los campos del clasificador usan formato `codigo.nombre` unido.**

| # Col | Nombre | Formato | Ejemplo |
|-------|--------|---------|---------|
| 24 | `fuente_financ` | `cod.nombre` | `"2.RECURSOS DIRECTAMENTE RECAUDADOS"` |
| 25 | `rubro` | `cod.nombre` | `"09.RECURSOS DIRECTAMENTE RECAUDADOS"` |
| 26 | `categoria_gasto` | `cod.nombre` | `"5.GASTOS CORRIENTES"` |
| 27 | `tipo_transaccion` | `cod.nombre` | `"2.GASTOS PRESUPUESTARIOS"` |
| 28 | `generica` | `cod.nombre` | `"3.BIENES Y SERVICIOS"` |
| 29 | `subgenerica` | `cod.nombre` | `"2.CONTRATACION DE SERVICIOS"` |
| 30 | `subgenerica_det` | `cod.nombre` | `"7.SERVICIOS PROFESIONALES Y TECNICOS"` |
| 31 | `especifica` | `cod.nombre` | `"5.PRACTICANTES, SECIGRISTAS..."` |
| 32 | `especifica_det` | `cod.nombre` | `"9.ASIGNACION DE PROPINAS..."` |

##### Grupo E: Montos Presupuestales (cols 33-37)

| # Col | Nombre | Ejemplo |
|-------|--------|---------|
| 33 | `mto_pia` | `10000` |
| 34 | `mto_modificaciones` | `0` |
| 35 | `mto_pim` | `10000` |
| 36 | `mto_certificado` | `0.0` |
| 37 | `mto_compro_anual` | `0.0` |

##### Grupo F: Ejecucion Mensual (cols 38-85) - 4 tipos x 12 meses

| Tipo | Columnas | Rango |
|------|----------|-------|
| Compromiso mensual | `mto_at_comp_01` a `mto_at_comp_12` | cols 38-49 |
| Devengado mensual | `mto_devenga_01` a `mto_devenga_12` | cols 50-61 |
| Girado mensual | `mto_girado_01` a `mto_girado_12` | cols 62-73 |
| Pagado mensual | `mto_pagado_01` a `mto_pagado_12` | cols 74-85 |

---

## Entidades del Modelo de Datos (Base de Datos)

### Diagrama de Relaciones

```
                    ┌──────────────┐
                    │  AnioFiscal  │
                    │──────────────│
                    │ PK id        │
                    │ anio (2026)  │
                    └──────┬───────┘
                           │ 1
                           │
              ┌────────────┼─────────────────┐
              │            │                 │
              ▼ N          ▼ N               ▼ N
   ┌──────────────┐  ┌───────────┐  ┌────────────────────┐
   │ Importacion  │  │   Meta    │  │EjecucionPresupuestal│
   │  Archivo     │  │───────────│  │────────────────────│
   │──────────────│  │ PK id     │  │ PK id              │
   │ PK id        │  │ FK anio   │  │ FK anio_fiscal     │
   │ nombre_arch  │  │ FK unidad │  │ FK meta ───────────┤─── N:1 ──► Meta
   │ hash_archivo │  │ codigo    │  │ FK fuente ─────────┤─── N:1 ──► FuenteFinanciamiento
   │ estado       │  │ nombre    │  │ FK clasificador ───┤─── N:1 ──► ClasificadorGasto
   │ filas_*      │  │ sec_func  │  │ pia, pim, certif   │
   │ FK anio      │  │ cod_prog  │  │ FK archivo_origen  │
   └──────────────┘  │ cod_func  │  └────────┬───────────┘
                     │ cod_prod  │           │ 1
                     │ ...       │           │
                     └─────┬─────┘           ▼ N
                           │        ┌────────────────────┐
                           │        │  EjecucionMensual  │
                           │        │────────────────────│
                           │        │ PK id              │
                           │        │ FK ejecucion       │
                           │        │ mes (1-12)         │
                           │        │ compromiso         │
                           │        │ devengado          │
                           │        │ girado             │
                           │        │ pagado             │
                           │        └────────────────────┘
                           │
                           ▼ N
                  ┌────────────────────┐
                  │   AvanceFisico     │
                  │────────────────────│
                  │ PK id              │
                  │ FK meta            │
                  │ mes (1-12)         │
                  │ cantidad_ejecutada │
                  │ porcentaje_avance  │
                  └────────────────────┘


   ┌──────────────────────┐     ┌──────────────────────┐
   │ FuenteFinanciamiento │     │  ClasificadorGasto   │
   │──────────────────────│     │──────────────────────│
   │ PK id                │     │ PK id                │
   │ codigo (unique)      │     │ codigo (unique)      │
   │ nombre               │     │ nombre               │
   │ codigo_rubro         │     │ tipo_transaccion     │
   │ nombre_rubro         │     │ generica             │
   │ descripcion          │     │ subgenerica          │
   └──────────────────────┘     │ especifica           │
                                │ nombre_generica      │
                                │ nombre_especifica_det│
                                │ descripcion_detallada│
                                └──────────────────────┘


   ┌──────────────────────┐
   │   UnidadOrganica     │
   │──────────────────────│
   │ PK id                │
   │ codigo (unique)      │
   │ nombre               │
   │ nombre_corto         │
   │ nivel (1,2,3)        │     Nivel 1: Organo
   │ FK parent ───────────┤──►  Nivel 2: Unidad Organica (parent=Organo)
   │ FK responsable       │     Nivel 3: Sub Unidad Organica (parent=UO)
   │ is_active            │
   └──────────────────────┘
```

---

## Mapeo: Excel → Entidades de Base de Datos

### Hoja RB → `FuenteFinanciamiento`

| Columna Excel | Campo BD | Transformacion |
|--------------|----------|----------------|
| `FUENTE` | `codigo`, `nombre` | Parsear `"1. RECURSOS ORDINARIOS"` → codigo=`1`, nombre=`RECURSOS ORDINARIOS` |
| `RUBRO` | `codigo_rubro`, `nombre_rubro` | Parsear `"00.RECURSOS ORDINARIOS"` → codigo_rubro=`00`, nombre_rubro=`RECURSOS ORDINARIOS` |
| `DES_RUBRO` | `descripcion` | Texto completo |
| Col 4 (sin nombre) | `nombre_corto` | `"00. RO"` → `RO` |

### Hoja CG → `ClasificadorGasto`

| Columna Excel | Campo BD | Transformacion |
|--------------|----------|----------------|
| `CLASIFICADOR` | `codigo` | Directo: `"2.3.1.99.1.99"` |
| `DESCRIPCION` | `nombre` | Directo: `"OTROS BIENES"` |
| `CLASIFICADOR` | `tipo_transaccion`, `generica`, `subgenerica`, `especifica` | Descomponer codigo en partes |
| `DESCRIPCION_DETALLADA` | `descripcion_detallada` | Texto completo |

### Hoja SF → `UnidadOrganica` + mapeo `sec_func`

| Columna Excel | Entidad | Transformacion |
|--------------|---------|----------------|
| `ORGANO` (col 11) | UnidadOrganica nivel=1 | Crear organo, agrupar por nombre |
| `UNIDAD ORGANICA` (col 12) | UnidadOrganica nivel=2 | Crear UO, parent=organo |
| `SUB UNIDAD ORGANICA` (col 13) | UnidadOrganica nivel=3 | Crear sub-UO, parent=UO |
| `NOMBRE CORTO` (col 14) | `.nombre_corto` | Abreviatura |
| `SECUENCIA FUNCIONAL` (col 1) | Meta.sec_func | Mapeo: sec_func → unidad_organica mas baja |

### SheetGasto → `Meta` + `EjecucionPresupuestal` + `EjecucionMensual`

#### → Meta (agrupada por `meta` + `anio_fiscal`)

| Columna Excel | Campo BD | Transformacion |
|--------------|----------|----------------|
| `meta` (col 13) | `codigo` | Numero de meta como string |
| `activ_obra_accinv` (col 9) | `nombre` | Nombre parseado (sin codigo) |
| `finalidad` (col 14) | `finalidad` | Nombre parseado |
| `tipo_act_obra_ac` (col 8) | `tipo_meta` | Parsear nombre: ACTIVIDAD, PROYECTO |
| `cant_meta_anual` (col 16) | `cantidad_meta_anual` | Directo |
| `sec_func` (col 20) | `sec_func` | Directo (entero) |
| `sec_func` → SF | `unidad_organica` | FK via mapeo SF |
| `programa_pptal` (col 5) | `codigo_programa_pptal`, `nombre_programa_pptal` | Parsear `"0002.SALUD..."` |
| `producto_proyecto` (col 7) | `codigo_producto_proyecto`, `nombre_producto_proyecto` | Parsear |
| `activ_obra_accinv` (col 9) | `codigo_actividad`, `nombre_actividad` | Parsear |
| `funcion` (col 10) | `codigo_funcion` | Solo codigo |
| `division_fn` (col 11) | `codigo_division_fn` | Solo codigo |
| `grupo_fn` (col 12) | `codigo_grupo_fn` | Solo codigo |
| `finalidad` (col 14) | `codigo_finalidad` | Solo codigo |
| `tipo_prod_proy` (col 6) | `tipo_producto_proyecto` | Nombre parseado |
| `tipo_act_obra_ac` (col 8) | `tipo_actividad` | Nombre parseado |
| `unidad_medida` (col 15) | `codigo_unidad_medida`, `nombre_unidad_medida` | Parsear |
| `categoria_gasto` (col 26) | `codigo_categoria_gasto`, `nombre_categoria_gasto` | Parsear |

#### → EjecucionPresupuestal (una por combinacion meta+fuente+clasificador)

| Columna Excel | Campo BD | Transformacion |
|--------------|----------|----------------|
| `ano_eje` (col 0) | `anio_fiscal` | FK a AnioFiscal |
| `meta` (col 13) | `meta` | FK a Meta |
| `fuente_financ` (col 24) | `fuente_financiamiento` | FK a FuenteFinanciamiento (buscar por codigo) |
| Cols clasificador | `clasificador_gasto` | FK a ClasificadorGasto (construir codigo) |
| `mto_pia` | `pia` | Directo |
| `mto_modificaciones` | `modificaciones` | Directo |
| `mto_pim` | `pim` | Directo |
| `mto_certificado` | `certificado` | Directo |
| `mto_compro_anual` | `compromiso_anual` | Directo |

#### → EjecucionMensual (12 registros por cada EjecucionPresupuestal)

| Columnas Excel | Campo BD | Mes |
|---------------|----------|-----|
| `mto_at_comp_XX` | `compromiso` | XX = 01-12 |
| `mto_devenga_XX` | `devengado` | XX = 01-12 |
| `mto_girado_XX` | `girado` | XX = 01-12 |
| `mto_pagado_XX` | `pagado` | XX = 01-12 |

> Solo se crean registros mensuales donde al menos un monto es > 0.

---

## Patron de Datos `CODIGO.DESCRIPCION`

La mayoria de campos textuales del MEF usan el formato `"CODIGO.DESCRIPCION"`, donde:
- El **punto** (`.`) separa el codigo numerico del nombre descriptivo
- El **codigo** es importante para cruzar con otros reportes externos
- La **descripcion** es el nombre legible

### Funcion de parseo: `parse_codigo_nombre(value)`

```
Entrada: "0002.SALUD MATERNO NEONATAL"
Salida:  ("0002", "SALUD MATERNO NEONATAL")

Entrada: "20.SALUD"
Salida:  ("20", "SALUD")

Entrada: "" o None
Salida:  ("", "")
```

### Campos que usan este patron

| Campo | Ejemplo codigo | Ejemplo nombre |
|-------|---------------|----------------|
| `programa_pptal` | `0002` | `SALUD MATERNO NEONATAL` |
| `tipo_prod_proy` | `3` | `PRODUCTO` |
| `producto_proyecto` | `3033412` | `FAMILIAS SALUDABLES...` |
| `tipo_act_obra_ac` | `5` | `ACTIVIDAD` |
| `activ_obra_accinv` | `5005986` | `ACCIONES DE MUNICIPIOS...` |
| `funcion` | `20` | `SALUD` |
| `division_fn` | `043` | `SALUD COLECTIVA` |
| `grupo_fn` | `0095` | `CONTROL DE RIESGOS...` |
| `finalidad` | `0215062` | `ACCIONES DE MUNICIPIOS...` |
| `unidad_medida` | `056` | `FAMILIA` |
| `fuente_financ` | `2` | `RECURSOS DIRECTAMENTE RECAUDADOS` |
| `rubro` | `09` | `RECURSOS DIRECTAMENTE RECAUDADOS` |
| `categoria_gasto` | `5` | `GASTOS CORRIENTES` |
| `tipo_transaccion`* | `2` | `GASTOS PRESUPUESTARIOS` |
| `generica`* | `3` | `BIENES Y SERVICIOS` |
| `subgenerica`* | `2` | `CONTRATACION DE SERVICIOS` |
| `subgenerica_det`* | `7` | `SERVICIOS PROFESIONALES Y TECNICOS` |
| `especifica`* | `5` | `PRACTICANTES, SECIGRISTAS...` |
| `especifica_det`* | `9` | `ASIGNACION DE PROPINAS...` |

> (*) En el .xlsx estos campos del clasificador vienen separados en 2 columnas (numero + "ColumnaX"). En el .xls vienen unidas con formato `codigo.nombre`.

---

## Comparacion de formatos: Offset de columnas

| Grupo | Columnas .xlsx | Columnas .xls | Diferencia |
|-------|---------------|---------------|------------|
| Identificacion (A) | 0-4 | 0-4 | Igual |
| Cadena funcional (B) | 5-16 | 5-16 | Igual |
| Avance/Ubicacion (C) | 17-23 | 17-23 | Igual |
| Fuente/Clasificador (D) | 24-38 (15 cols) | 24-32 (9 cols) | .xlsx tiene 6 "ColumnaX" extra |
| Montos (E) | 39-43 | 33-37 | Offset -6 |
| Compromiso mensual | 44-55 | 38-49 | Offset -6 |
| Devengado mensual | 56-67 | 50-61 | Offset -6 |
| Girado mensual | 68-79 | 62-73 | Offset -6 |
| Pagado mensual | 80-91 | 74-85 | Offset -6 |
| Filtros | 92-102 | N/A | Solo .xlsx |
| Organizacion | 103-106 | N/A | Solo .xlsx (vacios) |

> **Total:** .xlsx = 107 cols, .xls = 86 cols. La diferencia de 21 cols son: 6 "ColumnaX" + 11 filtros + 4 organizacion.

---

## Flujo de Importacion

### Carga Inicial (.xlsx - una sola vez)

```
ReporteGasto_30.01.26.xlsx
    │
    ├── Fase 1: RB → FuenteFinanciamiento (9 registros)
    │
    ├── Fase 2: CG → ClasificadorGasto (923 registros, solo nivel 6)
    │
    ├── Fase 3: SF → UnidadOrganica (jerarquia 3 niveles)
    │                + mapeo {sec_func → unidad_organica}
    │
    └── Fase 4: SheetGasto → Meta + EjecucionPresupuestal + EjecucionMensual
                              (usa mapeo SF para asignar unidad_organica)
```

### Importacion Diaria (.xls - incremental)

```
ReporteGasto (9).xls
    │
    └── SheetGasto → Comparacion incremental:
                     ├── Si meta+fuente+clasificador NO existe → CREAR
                     ├── Si existe y montos cambiaron → ACTUALIZAR
                     └── Si existe y montos iguales → SALTAR (sin_cambios)
```
