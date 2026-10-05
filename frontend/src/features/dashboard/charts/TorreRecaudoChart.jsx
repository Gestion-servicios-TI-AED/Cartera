import Chart from 'react-apexcharts';
import { ChartCard } from './ChartCard.jsx';
import { CHART_AXIS_TEXT, CHART_GRID, DATA_INK } from './palette.js';
import { usePrefersReducedMotion } from './usePrefersReducedMotion.js';

function fmtMoneyCorto(v) {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
}

// Recaudo por Torre -- equivalente Oliv de EtapaRecaudoChart.jsx (Baía
// Kristal), separado en su propio archivo (no reusado tal cual) porque ese
// componente tiene el título/hint y el orden ("Etapa constructiva 1, 2, 3…",
// `compararEtapas()`) hardcodeados para el concepto de Etapa de Baía
// Kristal -- Oliv no tiene esa jerarquía, solo Torres (LIVA/SEIVA), orden
// alfabético simple. Mismos 2 roles de color fijos (Proyectado/Recaudado)
// que el resto de gráficos de este dashboard, mismo criterio de barras
// agrupadas.
export function TorreRecaudoChart({ totalesPorTorre = {} }) {
  const torres = Object.keys(totalesPorTorre).sort();
  const reducedMotion = usePrefersReducedMotion();

  const rows = torres.map((t) => ({
    torre: t,
    esperado: totalesPorTorre[t]?.esperado ?? 0,
    recaudado: totalesPorTorre[t]?.recaudado ?? 0,
  }));
  const resumen = rows.map((r) => `${r.torre}: esperado ${fmtMoneyCorto(r.esperado)}, recaudado ${fmtMoneyCorto(r.recaudado)}`).join('; ');

  const options = {
    chart: { type: 'bar', toolbar: { show: false }, animations: { enabled: !reducedMotion }, fontFamily: 'inherit' },
    colors: ['var(--color-ink-muted)', DATA_INK],
    plotOptions: { bar: { borderRadius: 4, columnWidth: '60%' } },
    dataLabels: { enabled: false },
    xaxis: {
      categories: rows.map((r) => r.torre),
      labels: { style: { colors: CHART_AXIS_TEXT, fontSize: '12px' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { labels: { style: { colors: CHART_AXIS_TEXT, fontSize: '12px' }, formatter: fmtMoneyCorto } },
    grid: { borderColor: CHART_GRID, xaxis: { lines: { show: false } } },
    tooltip: { theme: 'light', y: { formatter: fmtMoneyCorto } },
    legend: { position: 'top', horizontalAlign: 'right', fontSize: '13px', labels: { colors: 'var(--color-ink-secondary)' } },
  };
  const series = [
    { name: 'Proyectado', data: rows.map((r) => Math.round(r.esperado)) },
    { name: 'Recaudado', data: rows.map((r) => Math.round(r.recaudado)) },
  ];

  return (
    <ChartCard
      title="Recaudo por Torre"
      description="Esperado vs. recaudado del plan de pagos, agrupado por Torre."
      ariaLabel={`Recaudo por torre: ${resumen}`}
      empty={rows.length === 0}
      wide
    >
      <Chart options={options} series={series} type="bar" height={280} />
    </ChartCard>
  );
}
