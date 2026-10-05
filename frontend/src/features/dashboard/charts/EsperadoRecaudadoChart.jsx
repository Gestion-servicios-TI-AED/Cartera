import Chart from 'react-apexcharts';
import { ChartCard } from './ChartCard.jsx';
import { CHART_AXIS_TEXT, CHART_GRID, DATA_INK } from './palette.js';
import { usePrefersReducedMotion } from './usePrefersReducedMotion.js';

const MESES_ABREV = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
function fmtMes(mes) {
  const [anio, mesNum] = mes.split('-');
  return `${MESES_ABREV[Number(mesNum) - 1]} ${anio.slice(2)}`;
}

// "YYYY-MM-DD" -> "3 ene" -- para la granularidad diaria/quincenal de
// ResumenPage.jsx (ver `formatLabel`).
function fmtDia(dia) {
  const [, mesNum, diaNum] = dia.split('-');
  return `${Number(diaNum)} ${MESES_ABREV[Number(mesNum) - 1]}`;
}

function fmtMoneyCorto(v) {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
}

// Tendencia en el tiempo, hasta 5 series -- puerto de PlanVsRecaudoLineChart.jsx
// (legado): 3 series "Mensual" en el eje izquierdo (Proyectado/Recaudado/Por
// recaudar, el mismo desglose que ya trae `totales[mes]` del backend) y 2
// series "Acumulado" (suma corrida mes a mes) en un eje derecho aparte --
// las dos escalas son demasiado distintas para compartir eje sin aplastar
// las líneas mensuales. `vista` (Ambos/Mensual/Acumulado) decide qué grupo
// se dibuja -- a diferencia del legado, el estado vive en la página
// (ResumenPage.jsx, junto al resto de filtros de la tendencia) y no acá,
// para poder mostrar el toggle junto al de Cuota inicial/Contraentrega en
// vez de encima del propio grafico.
//
// A diferencia del legado (Recharts, alineación manual del $0 entre los dos
// ejes vía un algoritmo de "paso lindo" hecho a mano): acá cada eje recibe un
// `min`/`max` explícito derivado de sus propios datos y se deja que
// ApexCharts calcule sus propios ticks "lindos" dentro de ese rango --
// simplificación deliberada, sin la alineación exacta del cero entre ejes.
//
// Color: mismos 2 roles fijos que ya usaba este gráfico con 2 series
// (Proyectado = tinta neutra/muted, Recaudado = DATA_INK) extendidos a las 5:
// "Por recaudar" usa el tono de advertencia (mismo criterio que la columna
// "Por recaudar" del Consolidado de Cartera, siempre ámbar en esta página);
// las variantes "acumulado" reusan el MISMO tono que su par mensual (misma
// métrica, otra agregación) pero más delgado y sin marcadores, en vez de
// introducir una paleta categórica nueva (Rationed Brand Rule).
//
// Sin título/hint propios (a diferencia del resto de graficos de este
// dashboard): ResumenPage.jsx ya tiene su propio encabezado de sección
// ("Plan de pagos vs. Recaudo — tendencia") justo encima -- repetirlo acá
// adentro era un título duplicado. `fill`: ver el comentario en
// ChartCard.jsx -- lo usa el modo Pantalla completa de ResumenPage para que
// el grafico realmente ocupe el alto disponible en vez de quedarse en un
// `altura` fijo pequeño dentro de un contenedor gigante.
export function EsperadoRecaudadoChart({ meses, totales, formatLabel = fmtMes, unidadPeriodo = 'mes', altura = 260, vista = 'ambos', fill = false }) {
  const mostrarMensual = vista !== 'acumulado';
  const mostrarAcumulado = vista !== 'mensual';
  const reducedMotion = usePrefersReducedMotion();

  let esperadoAcumulado = 0;
  let recaudadoAcumulado = 0;
  const rows = meses.map((mes) => {
    const t = totales[mes] ?? {};
    const esperado = t.esperado ?? 0;
    const recaudado = t.recaudado ?? 0;
    const porRecaudar = t.porRecaudar ?? 0;
    esperadoAcumulado += esperado;
    recaudadoAcumulado += recaudado;
    return { mes, mesLabel: formatLabel(mes), esperado, recaudado, porRecaudar, esperadoAcumulado, recaudadoAcumulado };
  });

  const resumen = rows.map((r) => `${r.mesLabel}: esperado ${fmtMoneyCorto(r.esperado)}, recaudado ${fmtMoneyCorto(r.recaudado)}, por recaudar ${fmtMoneyCorto(r.porRecaudar)}`).join('; ');

  const valoresIzq = mostrarMensual ? rows.flatMap((r) => [r.esperado, r.recaudado, r.porRecaudar]) : [];
  const izqMin = Math.min(0, ...valoresIzq, 0);
  const izqMax = Math.max(0, ...valoresIzq, 1) * 1.1;
  const valoresDer = mostrarAcumulado ? rows.flatMap((r) => [r.esperadoAcumulado, r.recaudadoAcumulado]) : [];
  const derMin = Math.min(0, ...valoresDer, 0);
  const derMax = Math.max(0, ...valoresDer, 1) * 1.1;

  const ejeIzq = {
    min: izqMin, max: izqMax, seriesName: 'Proyectado (plan)',
    title: { text: 'Mensual', style: { color: CHART_AXIS_TEXT, fontSize: '11px', fontWeight: 400 } },
    labels: { style: { colors: CHART_AXIS_TEXT, fontSize: '12px' }, formatter: fmtMoneyCorto },
    axisBorder: { show: false }, axisTicks: { show: false },
  };
  const ejeDer = {
    min: derMin, max: derMax, seriesName: 'Proyectado acumulado', opposite: true,
    title: { text: 'Acumulado', style: { color: CHART_AXIS_TEXT, fontSize: '11px', fontWeight: 400 } },
    labels: { style: { colors: CHART_AXIS_TEXT, fontSize: '12px' }, formatter: fmtMoneyCorto },
    axisBorder: { show: false }, axisTicks: { show: false },
  };

  const series = [];
  const yaxis = [];
  const colors = [];
  const dashArray = [];
  const strokeWidth = [];
  const markerSizes = [];

  if (mostrarMensual) {
    series.push({ name: 'Proyectado (plan)', data: rows.map((r) => Math.round(r.esperado)) });
    yaxis.push({ ...ejeIzq, show: true });
    colors.push('var(--color-ink-muted)'); dashArray.push(5); strokeWidth.push(2); markerSizes.push(3);

    series.push({ name: 'Recaudado', data: rows.map((r) => Math.round(r.recaudado)) });
    yaxis.push({ ...ejeIzq, show: false });
    colors.push(DATA_INK); dashArray.push(0); strokeWidth.push(2.5); markerSizes.push(3);

    series.push({ name: 'Por recaudar', data: rows.map((r) => Math.round(r.porRecaudar)) });
    yaxis.push({ ...ejeIzq, show: false });
    colors.push('var(--color-warning-ink)'); dashArray.push(0); strokeWidth.push(2); markerSizes.push(3);
  }
  if (mostrarAcumulado) {
    series.push({ name: 'Proyectado acumulado', data: rows.map((r) => Math.round(r.esperadoAcumulado)) });
    yaxis.push({ ...ejeDer, show: true });
    colors.push('var(--color-ink-muted)'); dashArray.push(3); strokeWidth.push(1.5); markerSizes.push(0);

    series.push({ name: 'Recaudado acumulado', data: rows.map((r) => Math.round(r.recaudadoAcumulado)) });
    yaxis.push({ ...ejeDer, show: false });
    colors.push(DATA_INK); dashArray.push(0); strokeWidth.push(1.5); markerSizes.push(0);
  }

  const options = {
    chart: { type: 'line', toolbar: { show: false }, animations: { enabled: !reducedMotion }, fontFamily: 'inherit' },
    colors,
    stroke: { curve: 'smooth', width: strokeWidth, dashArray },
    markers: { size: markerSizes, strokeWidth: 0, hover: { size: markerSizes.map((s) => (s > 0 ? s + 2 : 0)) } },
    xaxis: {
      categories: rows.map((r) => r.mesLabel),
      labels: { style: { colors: CHART_AXIS_TEXT, fontSize: '12px' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis,
    grid: { borderColor: CHART_GRID, xaxis: { lines: { show: false } } },
    tooltip: { theme: 'light', y: { formatter: fmtMoneyCorto } },
    legend: { position: 'top', horizontalAlign: 'right', fontSize: '13px', labels: { colors: 'var(--color-ink-secondary)' } },
  };

  return (
    <ChartCard
      ariaLabel={`Plan vs. Recaudo por ${unidadPeriodo}: ${resumen}`}
      empty={rows.length === 0}
      wide
      fill={fill}
    >
      <Chart options={options} series={series} type="line" height={fill ? '100%' : altura} />
    </ChartCard>
  );
}

export { fmtDia, fmtMes };
