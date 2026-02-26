import io
from decimal import Decimal
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image,
    PageBreak,
)
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from django.utils import timezone


def format_money(value):
    if value is None:
        return 'S/ 0.00'
    return f'S/ {float(value):,.2f}'


def format_pct(value):
    if value is None:
        return '0.00%'
    return f'{float(value):.2f}%'


def generar_reporte_resumen_pdf(resumen, anio, titulo='Reporte de Ejecución Presupuestal'):
    """Genera un PDF con el resumen general de ejecución presupuestal."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=landscape(A4),
        topMargin=1.5 * cm, bottomMargin=1.5 * cm,
        leftMargin=1.5 * cm, rightMargin=1.5 * cm,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle', parent=styles['Title'],
        fontSize=16, spaceAfter=6 * mm, alignment=TA_CENTER,
    )
    subtitle_style = ParagraphStyle(
        'CustomSubtitle', parent=styles['Normal'],
        fontSize=10, alignment=TA_CENTER, textColor=colors.gray,
        spaceAfter=8 * mm,
    )
    header_style = ParagraphStyle(
        'SectionHeader', parent=styles['Heading2'],
        fontSize=12, spaceBefore=6 * mm, spaceAfter=4 * mm,
    )

    elements = []

    # Encabezado
    elements.append(Paragraph('MUNICIPALIDAD DISTRITAL DE SAN JERÓNIMO', title_style))
    elements.append(Paragraph(f'{titulo} - Año Fiscal {anio}', subtitle_style))
    elements.append(Paragraph(
        f'Fecha de generación: {timezone.now().strftime("%d/%m/%Y %H:%M")}',
        ParagraphStyle('DateStyle', parent=styles['Normal'], fontSize=8, alignment=TA_RIGHT)
    ))
    elements.append(Spacer(1, 4 * mm))

    # Tabla resumen general
    elements.append(Paragraph('1. Resumen General', header_style))

    data = [
        ['Concepto', 'Monto (S/)'],
        ['Presupuesto Institucional de Apertura (PIA)', format_money(resumen.get('pia'))],
        ['Presupuesto Institucional Modificado (PIM)', format_money(resumen.get('pim'))],
        ['Certificado', format_money(resumen.get('certificado'))],
        ['Compromiso Anual', format_money(resumen.get('compromiso_anual'))],
        ['Devengado', format_money(resumen.get('devengado'))],
        ['Girado', format_money(resumen.get('girado'))],
        ['Pagado', format_money(resumen.get('pagado'))],
        ['Saldo PIM', format_money(resumen.get('saldo_pim'))],
    ]

    table = Table(data, colWidths=[12 * cm, 6 * cm])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1565c0')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f5f5f5')]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 6 * mm))

    # Indicadores
    elements.append(Paragraph('2. Indicadores de Avance', header_style))

    ind_data = [
        ['Indicador', 'Porcentaje'],
        ['Avance de Ejecución (Devengado/PIM)', format_pct(resumen.get('avance_devengado_pct'))],
        ['Avance de Certificación (Certificado/PIM)', format_pct(resumen.get('avance_certificado_pct'))],
        ['Total de Metas Activas', str(resumen.get('total_metas', 0))],
        ['Total de Registros de Ejecución', str(resumen.get('total_ejecuciones', 0))],
    ]

    ind_table = Table(ind_data, colWidths=[12 * cm, 6 * cm])
    ind_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#00897b')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f5f5f5')]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(ind_table)

    doc.build(elements)
    buffer.seek(0)
    return buffer


def generar_reporte_por_unidad_pdf(datos_unidades, anio):
    """Genera PDF con ejecución por unidad orgánica."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=landscape(A4),
        topMargin=1.5 * cm, bottomMargin=1.5 * cm,
        leftMargin=1.5 * cm, rightMargin=1.5 * cm,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle', parent=styles['Title'], fontSize=14, spaceAfter=4 * mm, alignment=TA_CENTER,
    )
    subtitle_style = ParagraphStyle(
        'Sub', parent=styles['Normal'], fontSize=9, alignment=TA_CENTER,
        textColor=colors.gray, spaceAfter=6 * mm,
    )

    elements = []
    elements.append(Paragraph('MUNICIPALIDAD DISTRITAL DE SAN JERÓNIMO', title_style))
    elements.append(Paragraph(f'Ejecución por Unidad Orgánica - Año Fiscal {anio}', subtitle_style))
    elements.append(Spacer(1, 4 * mm))

    data = [['Unidad Orgánica', 'PIM (S/)', 'Certificado (S/)', 'Devengado (S/)', 'Avance %']]

    for u in datos_unidades:
        data.append([
            u.get('unidad_nombre', '-'),
            format_money(u.get('total_pim')),
            format_money(u.get('total_certificado')),
            format_money(u.get('total_devengado')),
            format_pct(u.get('avance_pct')),
        ])

    col_widths = [9 * cm, 4.5 * cm, 4.5 * cm, 4.5 * cm, 3 * cm]
    table = Table(data, colWidths=col_widths)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1565c0')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f5f5f5')]),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    elements.append(table)

    doc.build(elements)
    buffer.seek(0)
    return buffer


def generar_reporte_top_metas_pdf(datos_metas, anio):
    """Genera PDF con top metas."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=landscape(A4),
        topMargin=1.5 * cm, bottomMargin=1.5 * cm,
        leftMargin=1.5 * cm, rightMargin=1.5 * cm,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle', parent=styles['Title'], fontSize=14, spaceAfter=4 * mm, alignment=TA_CENTER,
    )
    subtitle_style = ParagraphStyle(
        'Sub', parent=styles['Normal'], fontSize=9, alignment=TA_CENTER,
        textColor=colors.gray, spaceAfter=6 * mm,
    )

    elements = []
    elements.append(Paragraph('MUNICIPALIDAD DISTRITAL DE SAN JERÓNIMO', title_style))
    elements.append(Paragraph(f'Reporte de Metas Presupuestales - Año Fiscal {anio}', subtitle_style))
    elements.append(Spacer(1, 4 * mm))

    data = [['Código', 'Meta', 'Unidad', 'PIM (S/)', 'Devengado (S/)', 'Avance %']]

    for m in datos_metas:
        nombre = m.get('meta_nombre', '-')
        if len(nombre) > 60:
            nombre = nombre[:57] + '...'
        data.append([
            m.get('meta_codigo', '-'),
            nombre,
            m.get('unidad_nombre', '-'),
            format_money(m.get('total_pim')),
            format_money(m.get('total_devengado')),
            format_pct(m.get('avance_pct')),
        ])

    col_widths = [2 * cm, 8 * cm, 5 * cm, 4 * cm, 4 * cm, 2.5 * cm]
    table = Table(data, colWidths=col_widths)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1565c0')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 7),
        ('ALIGN', (3, 0), (-1, -1), 'RIGHT'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f5f5f5')]),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    elements.append(table)

    doc.build(elements)
    buffer.seek(0)
    return buffer
