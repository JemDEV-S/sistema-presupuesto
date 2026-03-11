from decimal import Decimal
from django.db.models import Sum, F, Q, Count
from django.utils import timezone
from apps.presupuesto.models import EjecucionPresupuestal, EjecucionMensual, Meta


def get_resumen_general(anio_fiscal_id, allowed_unidad_ids=None):
    """Calcula el resumen general de ejecución presupuestal para un año fiscal."""
    ejecuciones = EjecucionPresupuestal.objects.filter(anio_fiscal_id=anio_fiscal_id)
    if allowed_unidad_ids is not None:
        ejecuciones = ejecuciones.filter(meta__unidad_organica_id__in=allowed_unidad_ids)

    totales = ejecuciones.aggregate(
        total_pia=Sum('pia'),
        total_pim=Sum('pim'),
        total_certificado=Sum('certificado'),
        total_compromiso=Sum('compromiso_anual'),
    )

    mensuales_qs = EjecucionMensual.objects.filter(
        ejecucion__anio_fiscal_id=anio_fiscal_id
    )
    if allowed_unidad_ids is not None:
        mensuales_qs = mensuales_qs.filter(ejecucion__meta__unidad_organica_id__in=allowed_unidad_ids)
    mensuales = mensuales_qs.aggregate(
        total_devengado=Sum('devengado'),
        total_girado=Sum('girado'),
        total_pagado=Sum('pagado'),
        total_compromiso_mensual=Sum('compromiso'),
    )

    pim = totales['total_pim'] or Decimal('0')
    devengado = mensuales['total_devengado'] or Decimal('0')
    certificado = totales['total_certificado'] or Decimal('0')

    avance_devengado = float(devengado / pim * 100) if pim > 0 else 0
    avance_certificado = float(certificado / pim * 100) if pim > 0 else 0

    metas_qs = Meta.objects.filter(anio_fiscal_id=anio_fiscal_id, is_active=True)
    if allowed_unidad_ids is not None:
        metas_qs = metas_qs.filter(unidad_organica_id__in=allowed_unidad_ids)

    return {
        'pia': totales['total_pia'] or 0,
        'pim': pim,
        'certificado': certificado,
        'compromiso_anual': totales['total_compromiso'] or 0,
        'devengado': devengado,
        'girado': mensuales['total_girado'] or 0,
        'pagado': mensuales['total_pagado'] or 0,
        'saldo_pim': pim - certificado,
        'saldo_certificado': certificado - devengado,
        'avance_devengado_pct': round(avance_devengado, 2),
        'avance_certificado_pct': round(avance_certificado, 2),
        'total_ejecuciones': ejecuciones.count(),
        'total_metas': metas_qs.count(),
    }


def get_ejecucion_mensual_acumulada(anio_fiscal_id, allowed_unidad_ids=None):
    """Retorna la ejecución mensual acumulada para gráfico de tendencia."""
    mensuales_qs = EjecucionMensual.objects.filter(
        ejecucion__anio_fiscal_id=anio_fiscal_id
    )
    if allowed_unidad_ids is not None:
        mensuales_qs = mensuales_qs.filter(ejecucion__meta__unidad_organica_id__in=allowed_unidad_ids)
    mensuales = mensuales_qs.values('mes').annotate(
        compromiso=Sum('compromiso'),
        devengado=Sum('devengado'),
        girado=Sum('girado'),
        pagado=Sum('pagado'),
    ).order_by('mes')

    resultado = []
    acum_devengado = Decimal('0')
    acum_girado = Decimal('0')
    acum_compromiso = Decimal('0')

    meses_nombres = [
        '', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
        'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ]

    mensuales_dict = {m['mes']: m for m in mensuales}

    for mes_num in range(1, 13):
        data = mensuales_dict.get(mes_num, {})
        acum_compromiso += data.get('compromiso', Decimal('0'))
        acum_devengado += data.get('devengado', Decimal('0'))
        acum_girado += data.get('girado', Decimal('0'))

        resultado.append({
            'mes': mes_num,
            'mes_nombre': meses_nombres[mes_num],
            'compromiso': float(data.get('compromiso', 0)),
            'devengado': float(data.get('devengado', 0)),
            'girado': float(data.get('girado', 0)),
            'acum_compromiso': float(acum_compromiso),
            'acum_devengado': float(acum_devengado),
            'acum_girado': float(acum_girado),
        })

    return resultado


def get_ejecucion_por_fuente(anio_fiscal_id, allowed_unidad_ids=None):
    """Ejecución agrupada por fuente de financiamiento (vía rubro)."""
    qs = EjecucionPresupuestal.objects.filter(
        anio_fiscal_id=anio_fiscal_id
    )
    if allowed_unidad_ids is not None:
        qs = qs.filter(meta__unidad_organica_id__in=allowed_unidad_ids)
    return list(
        qs.values(
            fuente_nombre=F('rubro__fuente__nombre'),
            fuente_codigo=F('rubro__fuente__codigo'),
        ).annotate(
            total_pim=Sum('pim'),
            total_certificado=Sum('certificado'),
        ).order_by('-total_pim')
    )


def get_ejecucion_por_generica(anio_fiscal_id, allowed_unidad_ids=None):
    """Ejecución agrupada por genérica de gasto."""
    qs = EjecucionPresupuestal.objects.filter(
        anio_fiscal_id=anio_fiscal_id
    )
    if allowed_unidad_ids is not None:
        qs = qs.filter(meta__unidad_organica_id__in=allowed_unidad_ids)
    ejecuciones = qs.values(
        generica=F('clasificador_gasto__generica'),
        generica_nombre=F('clasificador_gasto__nombre_generica'),
    ).annotate(
        total_pim=Sum('pim'),
        total_certificado=Sum('certificado'),
    ).order_by('-total_pim')

    resultado = []
    for ej in ejecuciones:
        pim = ej['total_pim'] or Decimal('0')
        # Obtener devengado y girado de mensuales
        mensual_qs = EjecucionMensual.objects.filter(
            ejecucion__anio_fiscal_id=anio_fiscal_id,
            ejecucion__clasificador_gasto__generica=ej['generica'],
        )
        if allowed_unidad_ids is not None:
            mensual_qs = mensual_qs.filter(ejecucion__meta__unidad_organica_id__in=allowed_unidad_ids)
        mensuales = mensual_qs.aggregate(
            total_devengado=Sum('devengado'),
            total_girado=Sum('girado'),
        )
        devengado = mensuales['total_devengado'] or Decimal('0')
        girado = mensuales['total_girado'] or Decimal('0')

        resultado.append({
            'generica': ej['generica'],
            'generica_nombre': ej['generica_nombre'] or ej['generica'],
            'total_pim': float(pim),
            'total_certificado': float(ej['total_certificado'] or 0),
            'total_devengado': float(devengado),
            'total_girado': float(girado),
        })

    return resultado


def get_ejecucion_por_unidad(anio_fiscal_id, allowed_unidad_ids=None):
    """Ejecución agrupada por unidad orgánica."""
    qs = EjecucionPresupuestal.objects.filter(
        anio_fiscal_id=anio_fiscal_id
    )
    if allowed_unidad_ids is not None:
        qs = qs.filter(meta__unidad_organica_id__in=allowed_unidad_ids)
    ejecuciones = qs.values(
        unidad_nombre=F('meta__unidad_organica__nombre'),
        unidad_codigo=F('meta__unidad_organica__codigo'),
    ).annotate(
        total_pim=Sum('pim'),
        total_certificado=Sum('certificado'),
    ).order_by('-total_pim')

    resultado = []
    for ej in ejecuciones:
        pim = ej['total_pim'] or Decimal('0')
        # Obtener devengado de mensuales
        mensual_qs = EjecucionMensual.objects.filter(
            ejecucion__anio_fiscal_id=anio_fiscal_id,
            ejecucion__meta__unidad_organica__codigo=ej['unidad_codigo'],
        )
        if allowed_unidad_ids is not None:
            mensual_qs = mensual_qs.filter(ejecucion__meta__unidad_organica_id__in=allowed_unidad_ids)
        mensuales = mensual_qs.aggregate(
            total_devengado=Sum('devengado'),
            total_girado=Sum('girado'),
        )
        devengado = mensuales['total_devengado'] or Decimal('0')
        girado = mensuales['total_girado'] or Decimal('0')

        avance = float(devengado / pim * 100) if pim > 0 else 0
        resultado.append({
            'unidad_nombre': ej['unidad_nombre'],
            'unidad_codigo': ej['unidad_codigo'],
            'total_pim': float(pim),
            'total_certificado': float(ej['total_certificado'] or 0),
            'total_devengado': float(devengado),
            'total_girado': float(girado),
            'avance_pct': round(avance, 2),
        })

    return resultado


def get_top_metas(anio_fiscal_id, limit=10, order='mayor_pim', allowed_unidad_ids=None, filters=None):
    """Top metas por PIM o por avance. Acepta filtros opcionales."""
    filters = filters or {}
    if allowed_unidad_ids is not None:
        filters['allowed_unidad_ids'] = allowed_unidad_ids
    qs = EjecucionPresupuestal.objects.filter(
        anio_fiscal_id=anio_fiscal_id
    )
    qs = _apply_ejecucion_filters(qs, filters)
    ejecuciones = qs.values(
        'meta_id',
        meta_codigo=F('meta__codigo'),
        meta_nombre=F('meta__nombre'),
        unidad_nombre=F('meta__unidad_organica__nombre'),
        tipo_meta=F('meta__tipo_meta'),
        finalidad=F('meta__finalidad'),
        nombre_programa_pptal=F('meta__nombre_programa_pptal'),
        nombre_producto_proyecto=F('meta__nombre_producto_proyecto'),
        nombre_actividad=F('meta__nombre_actividad'),
        tipo_actividad=F('meta__tipo_actividad'),
        sec_func=F('meta__sec_func'),
        codigo_funcion=F('meta__codigo_funcion'),
        codigo_division_fn=F('meta__codigo_division_fn'),
        codigo_grupo_fn=F('meta__codigo_grupo_fn'),
    ).annotate(
        total_pim=Sum('pim'),
        total_pia=Sum('pia'),
        total_certificado=Sum('certificado'),
    )

    resultado = []
    for ej in ejecuciones:
        pim = ej['total_pim'] or Decimal('0')
        pia = ej['total_pia'] or Decimal('0')
        certificado = ej['total_certificado'] or Decimal('0')
        mensual_qs = EjecucionMensual.objects.filter(
            ejecucion__meta_id=ej['meta_id'],
            ejecucion__anio_fiscal_id=anio_fiscal_id,
        )
        mensual_qs = _apply_mensual_filters(mensual_qs, filters)
        mensual_totales = mensual_qs.aggregate(
            devengado=Sum('devengado'),
            girado=Sum('girado'),
        )
        devengado = mensual_totales['devengado'] or Decimal('0')
        girado = mensual_totales['girado'] or Decimal('0')

        # Build cadena funcional: función.división.grupo
        func_parts = [
            ej['codigo_funcion'] or '',
            ej['codigo_division_fn'] or '',
            ej['codigo_grupo_fn'] or '',
        ]
        cadena_funcional = '.'.join(p for p in func_parts if p)

        avance = float(devengado / pim * 100) if pim > 0 else 0
        resultado.append({
            'meta_codigo': ej['meta_codigo'],
            'meta_nombre': ej['meta_nombre'],
            'unidad_nombre': ej['unidad_nombre'],
            'tipo_meta': ej['tipo_meta'],
            'finalidad': ej['finalidad'] or '',
            'nombre_programa_pptal': ej['nombre_programa_pptal'] or '',
            'nombre_producto_proyecto': ej['nombre_producto_proyecto'] or '',
            'nombre_actividad': ej['nombre_actividad'] or '',
            'tipo_actividad': ej['tipo_actividad'] or '',
            'sec_func': ej['sec_func'],
            'cadena_funcional': cadena_funcional,
            'total_pia': float(pia),
            'total_pim': float(pim),
            'total_certificado': float(certificado),
            'total_devengado': float(devengado),
            'total_girado': float(girado),
            'avance_pct': round(avance, 2),
        })

    if order == 'mayor_pim':
        resultado.sort(key=lambda x: x['total_pim'], reverse=True)
    elif order == 'menor_avance':
        resultado.sort(key=lambda x: x['avance_pct'])
    elif order == 'mayor_avance':
        resultado.sort(key=lambda x: x['avance_pct'], reverse=True)

    return resultado[:limit] if limit > 0 else resultado


def _apply_ejecucion_filters(qs, filters):
    """Aplica filtros comunes a un queryset de EjecucionPresupuestal.
    Usa 'codigo' (string) para unidad y fuente, ya que el frontend envía códigos."""
    if filters.get('allowed_unidad_ids') is not None:
        qs = qs.filter(meta__unidad_organica_id__in=filters['allowed_unidad_ids'])
    if filters.get('unidad_codigos'):
        qs = qs.filter(meta__unidad_organica__codigo__in=filters['unidad_codigos'])
    elif filters.get('unidad_codigo'):
        qs = qs.filter(meta__unidad_organica__codigo=filters['unidad_codigo'])
    if filters.get('fuente_codigo'):
        qs = qs.filter(rubro__fuente__codigo=filters['fuente_codigo'])
    if filters.get('rubro_id'):
        qs = qs.filter(rubro_id=filters['rubro_id'])
    if filters.get('tipo_meta'):
        qs = qs.filter(meta__tipo_meta=filters['tipo_meta'])
    if filters.get('tipo_actividad'):
        qs = qs.filter(meta__tipo_actividad=filters['tipo_actividad'])
    if filters.get('generica'):
        qs = qs.filter(clasificador_gasto__generica=filters['generica'])
    return qs


def _apply_mensual_filters(qs, filters):
    """Aplica filtros comunes a un queryset de EjecucionMensual.
    Usa 'codigo' (string) para unidad y fuente, ya que el frontend envía códigos."""
    if filters.get('allowed_unidad_ids') is not None:
        qs = qs.filter(ejecucion__meta__unidad_organica_id__in=filters['allowed_unidad_ids'])
    if filters.get('unidad_codigos'):
        qs = qs.filter(ejecucion__meta__unidad_organica__codigo__in=filters['unidad_codigos'])
    elif filters.get('unidad_codigo'):
        qs = qs.filter(ejecucion__meta__unidad_organica__codigo=filters['unidad_codigo'])
    if filters.get('fuente_codigo'):
        qs = qs.filter(ejecucion__rubro__fuente__codigo=filters['fuente_codigo'])
    if filters.get('rubro_id'):
        qs = qs.filter(ejecucion__rubro_id=filters['rubro_id'])
    if filters.get('tipo_meta'):
        qs = qs.filter(ejecucion__meta__tipo_meta=filters['tipo_meta'])
    if filters.get('tipo_actividad'):
        qs = qs.filter(ejecucion__meta__tipo_actividad=filters['tipo_actividad'])
    if filters.get('generica'):
        qs = qs.filter(ejecucion__clasificador_gasto__generica=filters['generica'])
    return qs


def get_resumen_filtrado(anio_fiscal_id, filters=None):
    """Resumen general con filtros opcionales (unidad, fuente, rubro, tipo_meta)."""
    filters = filters or {}
    ejecuciones = EjecucionPresupuestal.objects.filter(anio_fiscal_id=anio_fiscal_id)
    ejecuciones = _apply_ejecucion_filters(ejecuciones, filters)

    totales = ejecuciones.aggregate(
        total_pia=Sum('pia'),
        total_pim=Sum('pim'),
        total_certificado=Sum('certificado'),
        total_compromiso=Sum('compromiso_anual'),
    )

    mensuales_qs = EjecucionMensual.objects.filter(ejecucion__anio_fiscal_id=anio_fiscal_id)
    mensuales_qs = _apply_mensual_filters(mensuales_qs, filters)
    mensuales = mensuales_qs.aggregate(
        total_devengado=Sum('devengado'),
        total_girado=Sum('girado'),
        total_pagado=Sum('pagado'),
    )

    pim = totales['total_pim'] or Decimal('0')
    devengado = mensuales['total_devengado'] or Decimal('0')
    certificado = totales['total_certificado'] or Decimal('0')

    avance_devengado = float(devengado / pim * 100) if pim > 0 else 0
    avance_certificado = float(certificado / pim * 100) if pim > 0 else 0

    # Count metas
    metas_qs = Meta.objects.filter(anio_fiscal_id=anio_fiscal_id, is_active=True)
    if filters.get('allowed_unidad_ids') is not None:
        metas_qs = metas_qs.filter(unidad_organica_id__in=filters['allowed_unidad_ids'])
    if filters.get('unidad_codigos'):
        metas_qs = metas_qs.filter(unidad_organica__codigo__in=filters['unidad_codigos'])
    elif filters.get('unidad_codigo'):
        metas_qs = metas_qs.filter(unidad_organica__codigo=filters['unidad_codigo'])
    if filters.get('tipo_meta'):
        metas_qs = metas_qs.filter(tipo_meta=filters['tipo_meta'])

    return {
        'pia': totales['total_pia'] or 0,
        'pim': pim,
        'certificado': certificado,
        'compromiso_anual': totales['total_compromiso'] or 0,
        'devengado': devengado,
        'girado': mensuales['total_girado'] or 0,
        'pagado': mensuales['total_pagado'] or 0,
        'saldo_pim': pim - certificado,
        'saldo_certificado': certificado - devengado,
        'avance_devengado_pct': round(avance_devengado, 2),
        'avance_certificado_pct': round(avance_certificado, 2),
        'total_ejecuciones': ejecuciones.count(),
        'total_metas': metas_qs.count(),
    }


def get_metas_por_unidad(anio_fiscal_id, unidad_codigos):
    """Lista de metas de una o varias unidades orgánicas con detalle de ejecución.
    unidad_codigos puede ser un string (un código) o una lista de códigos."""
    if isinstance(unidad_codigos, str):
        unidad_codigos = [unidad_codigos]
    ejecuciones = EjecucionPresupuestal.objects.filter(
        anio_fiscal_id=anio_fiscal_id,
        meta__unidad_organica__codigo__in=unidad_codigos,
    ).values(
        'meta_id',
        meta_codigo=F('meta__codigo'),
        meta_nombre=F('meta__nombre'),
        tipo_meta=F('meta__tipo_meta'),
        finalidad=F('meta__finalidad'),
        nombre_programa_pptal=F('meta__nombre_programa_pptal'),
        nombre_producto_proyecto=F('meta__nombre_producto_proyecto'),
        sec_func=F('meta__sec_func'),
        codigo_funcion=F('meta__codigo_funcion'),
        codigo_division_fn=F('meta__codigo_division_fn'),
        codigo_grupo_fn=F('meta__codigo_grupo_fn'),
        unidad_codigo=F('meta__unidad_organica__codigo'),
        unidad_nombre=F('meta__unidad_organica__nombre'),
    ).annotate(
        total_pia=Sum('pia'),
        total_pim=Sum('pim'),
        total_certificado=Sum('certificado'),
    )

    resultado = []
    for ej in ejecuciones:
        pim = ej['total_pim'] or Decimal('0')
        devengado = EjecucionMensual.objects.filter(
            ejecucion__meta_id=ej['meta_id'],
            ejecucion__anio_fiscal_id=anio_fiscal_id,
        ).aggregate(
            total_devengado=Sum('devengado'),
            total_girado=Sum('girado'),
        )

        # Build cadena funcional: función.división.grupo
        func_parts = [
            ej['codigo_funcion'] or '',
            ej['codigo_division_fn'] or '',
            ej['codigo_grupo_fn'] or '',
        ]
        cadena_funcional = '.'.join(p for p in func_parts if p)

        dev = devengado['total_devengado'] or Decimal('0')
        avance = float(dev / pim * 100) if pim > 0 else 0
        resultado.append({
            'meta_id': ej['meta_id'],
            'meta_codigo': ej['meta_codigo'],
            'meta_nombre': ej['meta_nombre'],
            'tipo_meta': ej['tipo_meta'],
            'finalidad': ej['finalidad'] or '',
            'nombre_programa_pptal': ej['nombre_programa_pptal'] or '',
            'nombre_producto_proyecto': ej['nombre_producto_proyecto'] or '',
            'sec_func': ej['sec_func'],
            'cadena_funcional': cadena_funcional,
            'unidad_codigo': ej['unidad_codigo'],
            'unidad_nombre': ej['unidad_nombre'] or '',
            'total_pia': float(ej['total_pia'] or 0),
            'total_pim': float(pim),
            'total_certificado': float(ej['total_certificado'] or 0),
            'total_devengado': float(dev),
            'total_girado': float(devengado['total_girado'] or 0),
            'avance_pct': round(avance, 2),
        })

    resultado.sort(key=lambda x: x['total_pim'], reverse=True)
    return resultado


def get_clasificadores_por_unidad(anio_fiscal_id, unidad_codigos):
    """Clasificadores de gasto para una o varias unidades orgánicas.
    unidad_codigos puede ser un string (un código) o una lista de códigos."""
    if isinstance(unidad_codigos, str):
        unidad_codigos = [unidad_codigos]
    ejecuciones = EjecucionPresupuestal.objects.filter(
        anio_fiscal_id=anio_fiscal_id,
        meta__unidad_organica__codigo__in=unidad_codigos,
    ).values(
        generica=F('clasificador_gasto__generica'),
        nombre_generica=F('clasificador_gasto__nombre_generica'),
    ).annotate(
        total_pim=Sum('pim'),
        total_certificado=Sum('certificado'),
    ).order_by('-total_pim')

    resultado = []
    for ej in ejecuciones:
        pim = ej['total_pim'] or Decimal('0')
        devengado = EjecucionMensual.objects.filter(
            ejecucion__anio_fiscal_id=anio_fiscal_id,
            ejecucion__meta__unidad_organica__codigo__in=unidad_codigos,
            ejecucion__clasificador_gasto__generica=ej['generica'],
        ).aggregate(total=Sum('devengado'))['total'] or Decimal('0')

        avance = float(devengado / pim * 100) if pim > 0 else 0
        resultado.append({
            'generica': ej['generica'],
            'nombre_generica': ej['nombre_generica'] or ej['generica'],
            'total_pim': float(pim),
            'total_certificado': float(ej['total_certificado'] or 0),
            'total_devengado': float(devengado),
            'avance_pct': round(avance, 2),
        })

    return resultado


def get_ejecucion_por_rubro(anio_fiscal_id, filters=None):
    """Ejecución agrupada por rubro con detalle."""
    filters = filters or {}
    ejecuciones = EjecucionPresupuestal.objects.filter(anio_fiscal_id=anio_fiscal_id)
    ejecuciones = _apply_ejecucion_filters(ejecuciones, filters)

    rubros = ejecuciones.values(
        'rubro_id',
        rubro_codigo=F('rubro__codigo'),
        rubro_nombre=F('rubro__nombre'),
        rubro_nombre_corto=F('rubro__nombre_corto'),
        fuente_codigo=F('rubro__fuente__codigo'),
        fuente_nombre=F('rubro__fuente__nombre'),
    ).annotate(
        total_pia=Sum('pia'),
        total_pim=Sum('pim'),
        total_certificado=Sum('certificado'),
    ).order_by('-total_pim')

    resultado = []
    for r in rubros:
        pim = r['total_pim'] or Decimal('0')
        mensual_qs = EjecucionMensual.objects.filter(
            ejecucion__anio_fiscal_id=anio_fiscal_id,
            ejecucion__rubro_id=r['rubro_id'],
        )
        mensual_qs = _apply_mensual_filters(mensual_qs, filters)
        agg = mensual_qs.aggregate(
            total_devengado=Sum('devengado'),
            total_girado=Sum('girado'),
        )

        dev = agg['total_devengado'] or Decimal('0')
        avance = float(dev / pim * 100) if pim > 0 else 0
        resultado.append({
            'rubro_id': r['rubro_id'],
            'rubro_codigo': r['rubro_codigo'],
            'rubro_nombre': r['rubro_nombre'],
            'rubro_nombre_corto': r['rubro_nombre_corto'] or r['rubro_nombre'],
            'fuente_codigo': r['fuente_codigo'],
            'fuente_nombre': r['fuente_nombre'],
            'total_pia': float(r['total_pia'] or 0),
            'total_pim': float(pim),
            'total_certificado': float(r['total_certificado'] or 0),
            'total_devengado': float(dev),
            'total_girado': float(agg['total_girado'] or 0),
            'avance_pct': round(avance, 2),
        })

    return resultado


def get_ejecucion_por_tipo_meta(anio_fiscal_id, filters=None):
    """Ejecución agrupada por tipo de meta (PRODUCTO vs PROYECTO)."""
    filters = filters or {}
    ejecuciones = EjecucionPresupuestal.objects.filter(anio_fiscal_id=anio_fiscal_id)
    ejecuciones = _apply_ejecucion_filters(ejecuciones, filters)

    tipos = ejecuciones.values(
        tipo_meta=F('meta__tipo_meta'),
    ).annotate(
        total_pia=Sum('pia'),
        total_pim=Sum('pim'),
        total_certificado=Sum('certificado'),
        total_metas=Count('meta_id', distinct=True),
    ).order_by('-total_pim')

    resultado = []
    for t in tipos:
        pim = t['total_pim'] or Decimal('0')
        mensual_qs = EjecucionMensual.objects.filter(
            ejecucion__anio_fiscal_id=anio_fiscal_id,
            ejecucion__meta__tipo_meta=t['tipo_meta'],
        )
        if filters.get('allowed_unidad_ids') is not None:
            mensual_qs = mensual_qs.filter(ejecucion__meta__unidad_organica_id__in=filters['allowed_unidad_ids'])
        if filters.get('unidad_codigo'):
            mensual_qs = mensual_qs.filter(ejecucion__meta__unidad_organica__codigo=filters['unidad_codigo'])
        if filters.get('fuente_codigo'):
            mensual_qs = mensual_qs.filter(ejecucion__rubro__fuente__codigo=filters['fuente_codigo'])

        dev = mensual_qs.aggregate(total=Sum('devengado'))['total'] or Decimal('0')
        avance = float(dev / pim * 100) if pim > 0 else 0
        resultado.append({
            'tipo_meta': t['tipo_meta'],
            'total_metas': t['total_metas'],
            'total_pia': float(t['total_pia'] or 0),
            'total_pim': float(pim),
            'total_certificado': float(t['total_certificado'] or 0),
            'total_devengado': float(dev),
            'avance_pct': round(avance, 2),
        })

    return resultado


def get_ejecucion_por_producto_proyecto(anio_fiscal_id, filters=None):
    """Ejecución agrupada por producto/proyecto."""
    filters = filters or {}
    ejecuciones = EjecucionPresupuestal.objects.filter(anio_fiscal_id=anio_fiscal_id)
    ejecuciones = _apply_ejecucion_filters(ejecuciones, filters)

    productos = ejecuciones.values(
        tipo_producto_proyecto=F('meta__tipo_producto_proyecto'),
        codigo_producto_proyecto=F('meta__codigo_producto_proyecto'),
        nombre_producto_proyecto=F('meta__nombre_producto_proyecto'),
        tipo_meta=F('meta__tipo_meta'),
    ).annotate(
        total_pim=Sum('pim'),
        total_certificado=Sum('certificado'),
        total_metas=Count('meta_id', distinct=True),
    ).order_by('-total_pim')

    resultado = []
    for p in productos:
        pim = p['total_pim'] or Decimal('0')
        mensual_qs = EjecucionMensual.objects.filter(
            ejecucion__anio_fiscal_id=anio_fiscal_id,
            ejecucion__meta__codigo_producto_proyecto=p['codigo_producto_proyecto'],
        )
        if filters.get('allowed_unidad_ids') is not None:
            mensual_qs = mensual_qs.filter(ejecucion__meta__unidad_organica_id__in=filters['allowed_unidad_ids'])
        dev = mensual_qs.aggregate(total=Sum('devengado'))['total'] or Decimal('0')
        avance = float(dev / pim * 100) if pim > 0 else 0
        resultado.append({
            'tipo_producto_proyecto': p['tipo_producto_proyecto'],
            'codigo_producto_proyecto': p['codigo_producto_proyecto'],
            'nombre_producto_proyecto': p['nombre_producto_proyecto'] or 'Sin asignar',
            'tipo_meta': p['tipo_meta'],
            'total_metas': p['total_metas'],
            'total_pim': float(pim),
            'total_certificado': float(p['total_certificado'] or 0),
            'total_devengado': float(dev),
            'avance_pct': round(avance, 2),
        })

    return resultado


def get_tendencia_filtrada(anio_fiscal_id, filters=None):
    """Tendencia mensual acumulada con filtros opcionales."""
    filters = filters or {}
    mensuales_qs = EjecucionMensual.objects.filter(
        ejecucion__anio_fiscal_id=anio_fiscal_id
    )
    mensuales_qs = _apply_mensual_filters(mensuales_qs, filters)

    mensuales = mensuales_qs.values('mes').annotate(
        compromiso=Sum('compromiso'),
        devengado=Sum('devengado'),
        girado=Sum('girado'),
        pagado=Sum('pagado'),
    ).order_by('mes')

    resultado = []
    acum_devengado = Decimal('0')
    acum_girado = Decimal('0')
    acum_compromiso = Decimal('0')

    meses_nombres = [
        '', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
        'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ]

    mensuales_dict = {m['mes']: m for m in mensuales}

    for mes_num in range(1, 13):
        data = mensuales_dict.get(mes_num, {})
        acum_compromiso += data.get('compromiso', Decimal('0'))
        acum_devengado += data.get('devengado', Decimal('0'))
        acum_girado += data.get('girado', Decimal('0'))

        resultado.append({
            'mes': mes_num,
            'mes_nombre': meses_nombres[mes_num],
            'compromiso': float(data.get('compromiso', 0)),
            'devengado': float(data.get('devengado', 0)),
            'girado': float(data.get('girado', 0)),
            'acum_compromiso': float(acum_compromiso),
            'acum_devengado': float(acum_devengado),
            'acum_girado': float(acum_girado),
        })

    return resultado


def get_ejecucion_por_clasificador_detalle(anio_fiscal_id, filters=None):
    """Ejecución detallada por clasificador de gasto (genérica + subgenérica)."""
    filters = filters or {}
    ejecuciones = EjecucionPresupuestal.objects.filter(anio_fiscal_id=anio_fiscal_id)
    ejecuciones = _apply_ejecucion_filters(ejecuciones, filters)

    clasificadores = ejecuciones.values(
        generica=F('clasificador_gasto__generica'),
        nombre_generica=F('clasificador_gasto__nombre_generica'),
        subgenerica=F('clasificador_gasto__subgenerica'),
        nombre_subgenerica=F('clasificador_gasto__nombre_subgenerica'),
    ).annotate(
        total_pim=Sum('pim'),
        total_certificado=Sum('certificado'),
        total_pia=Sum('pia'),
    ).order_by('generica', 'subgenerica')

    resultado = []
    for c in clasificadores:
        pim = c['total_pim'] or Decimal('0')
        mensual_qs = EjecucionMensual.objects.filter(
            ejecucion__anio_fiscal_id=anio_fiscal_id,
            ejecucion__clasificador_gasto__generica=c['generica'],
            ejecucion__clasificador_gasto__subgenerica=c['subgenerica'],
        )
        mensual_qs = _apply_mensual_filters(mensual_qs, filters)
        dev = mensual_qs.aggregate(total=Sum('devengado'))['total'] or Decimal('0')
        avance = float(dev / pim * 100) if pim > 0 else 0
        resultado.append({
            'generica': c['generica'],
            'nombre_generica': c['nombre_generica'] or c['generica'],
            'subgenerica': c['subgenerica'],
            'nombre_subgenerica': c['nombre_subgenerica'] or c['subgenerica'],
            'total_pia': float(c['total_pia'] or 0),
            'total_pim': float(pim),
            'total_certificado': float(c['total_certificado'] or 0),
            'total_devengado': float(dev),
            'avance_pct': round(avance, 2),
        })

    return resultado
