import Chart from 'react-apexcharts';
import { ChartCard } from './ChartCard.jsx';
import { CHART_AXIS_TEXT, CHART_GRID } from './palette.js';
import { usePrefersReducedMotion } from './usePrefersReducedMotion.js';

// Barra vertical con ramp ordinal (el orden de los buckets SI importa, claro
// = extremo bajo, oscuro = extremo alto) -- ver color-formula.md de la skill
// dataviz. `distributed: true` es lo que hace que ApexCharts pinte cada barra
// con un color distinto de `colors` (equivalente al <Cell> por-barra de
// Recharts). `onBarClick` es opcional -- Cartera en Gestion lo usa para
// filtrar la tabla por el rango de mora clickeado.
export function OrdinalBarChart({ title, hint, description, data, ramp, onBarClick }) {
  const resumen = data.map((row) => `${row.label}: ${row.total}`).join(', ');
  const reducedMotion = usePrefersReducedMotion();

  const options = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      animations: { enabled: !reducedMotion },
      fontFamily: 'inherit',
      events: onBarClick ? { dataPointSelection: (_event, _chartContext, config) => onBarClick(data[config.dataPointIndex]) } : undefined,
    },
    plotOptions: { bar: { distributed: true, borderRadius: 4, columnWidth: '55%' } },
    colors: data.map((_, index) => ramp[index % ramp.length]),
    states: { hover: { filter: { type: 'darken', value: 0.12 } }, active: { filter: { type: 'none' } } },
    dataLabels: {
      enabled: true,
      style: { colors: ['var(--color-ink)'], fontSize: '12px', fontWeight: 400 },
      offsetY: -18,
      background: { enabled: false },
    },
    xaxis: {
      categories: data.map((row) => row.label),
      labels: { style: { colors: CHART_AXIS_TEXT, fontSize: '12px' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { show: false },
    grid: { borderColor: CHART_GRID, xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
    tooltip: { theme: 'light', y: { title: { formatter: () => '' } } },
    legend: { show: false },
  };
  const series = [{ name: title, data: data.map((row) => row.total) }];

  return (
    <ChartCard title={title} hint={hint} description={description} ariaLabel={`${title}: ${resumen}`} empty={data.length === 0}>
      <Chart options={options} series={series} type="bar" height={220} />
    </ChartCard>
  );
}
