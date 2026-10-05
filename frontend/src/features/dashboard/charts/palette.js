// Paleta de graficos derivada del propio tonal ramp de "primary" de la marca
// aed (ver tokens.css / .impeccable/design.json) -- mismos valores exactos
// que ya usa `Human-Resource-Management-System-AED/frontend/src/features/dashboard/charts/palette.js`
// porque es la MISMA marca aed y el MISMO --color-primary (#232BED): no hace
// falta re-derivar ni re-validar, el ramp ya paso la skill de dataviz
// (node scripts/validate_palette.js ... --ordinal --surface "#FFFFFF" -> ALL CHECKS PASS)
// en ese proyecto hermano.
//
// DATA_INK no es el Azul Vibrante literal (#232BED) a proposito: si las
// graficas de este dashboard usaran el token vibrante como relleno solido,
// se comerian el presupuesto de la Rationed Brand Rule de DESIGN.md (<=10%
// de pantalla). Es un escalon mas oscuro del mismo ramp. El vibrante real
// (DATA_INK_ACTIVE) se usa para la serie "actual"/mas importante de una
// comparacion de 2 series (ver EsperadoRecaudadoChart.jsx).
export const DATA_INK = '#1B21A6';
export const DATA_INK_ACTIVE = '#232BED';

// Ramp ordinal de 4 pasos.
export const ORDINAL_RAMP = ['#7B80F5', '#232BED', '#1B21A6', '#12175E'];

// Ramp ordinal de 5 pasos para Cartera en Gestion (RANGOS_MORA del backend
// son 5 buckets: 1-5, 6-30, 31-60, 61-90, 90+ dias). Recorrer ORDINAL_RAMP
// (4 tonos) con modulo para 5 buckets hace que el bucket mas grave (90+)
// repita el tono MAS CLARO (indice 4 % 4 = 0) -- rompe la promesa visual
// "claro = leve, oscuro = grave" justo en el bucket que mas importa
// distinguir. Este ramp agrega un quinto tono mas claro al frente de la
// misma familia de azul en vez de reciclar con modulo.
export const MORA_RAMP = ['#A6AAF7', '#7B80F5', '#232BED', '#1B21A6', '#12175E'];

// Ramp categorico -- no usado hoy (ningun grafico de este dashboard compara
// mas de 2 series a la vez), se deja disponible para un futuro donut/torta
// por etapa o frente.
export const CATEGORICAL_RAMP = ['#232BED', '#7B80F5', '#12175E', '#1B21A6'];

// "Sin especificar"/"Sin asignar" -- gris neutro, nunca cuenta como parte
// del presupuesto de la Rationed Brand Rule.
export const NEUTRAL_SLICE = 'var(--color-border-strong)';

export function esSinDato(label) {
  return label === 'Sin especificar' || label === 'Sin asignar';
}

export const CHART_GRID = 'var(--color-border)';
export const CHART_AXIS_TEXT = 'var(--color-ink-muted)';
