import Chart from 'react-apexcharts';
import { ChartCard } from './ChartCard.jsx';
import { CHART_AXIS_TEXT, CHART_GRID, DATA_INK } from './palette.js';
import { usePrefersReducedMotion } from './usePrefersReducedMotion.js';
import { etiquetaEtapa, compararEtapas } from '../../../utils/etapas.js';

function fmtMoneyCorto(v) {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
}

// Recaudo por Etapa constructiva (1, 2, 3…) -- no confundir con la Etapa/
// Stage de Zoho de Oportunidades. Barras agrupadas (Proyectado/Recaudado)
// por etapa -- mismos 2 roles fijos que EsperadoRecaudadoChart (Proyectado
// en tinta neutra, Recaudado en DATA_INK), no una paleta categórica, porque
// siguen siendo la misma comparación plan-vs-real, ahora por categoría en
// vez de por tiempo.
export function EtapaRecaudoChart({ totalesPorEtapa = {} }) {
  const etapas = Object.keys(totalesPorEtapa).sort(compararEtapas);
  const reducedMotion = usePrefersReducedMotion();

  const rows = etapas.map((et) => ({
    etapa: et,
    label: etiquetaEtapa(et),
    esperado: totalesPorEtapa[et]?.esperado ?? 0,
    recaudado: totalesPorEtapa[et]?.recaudado ?? 0,
  }));
  const resumen = rows.map((r) => `${r.label}: esperado ${fmtMoneyCorto(r.esperado)}, recaudado ${fmtMoneyCorto(r.recaudado)}`).join('; ');

  const options = {
    chart: { type: 'bar', toolbar: { show: false }, animations: { enabled: !reducedMotion }, fontFamily: 'inherit' },
    colors: ['var(--color-ink-muted)', DATA_INK],
    plotOptions: { bar: { borderRadius: 4, columnWidth: '60%' } },
    dataLabels: { enabled: false },
    xaxis: {
      categories: rows.map((r) => r.label),
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
      title="Recaudo por Etapa del proyecto"
      description="Esperado vs. recaudado del plan de pagos, agrupado por Etapa constructiva (1, 2, 3…) -- no confundir con la Etapa/Stage de Zoho."
      ariaLabel={`Recaudo por etapa: ${resumen}`}
      empty={rows.length === 0}
      wide
    >
      <Chart options={options} series={series} type="bar" height={280} />
    </ChartCard>
  );
}
