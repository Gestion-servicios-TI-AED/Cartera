// Portado de estadoInventarioClass() en zoho-payment-tracker/frontend/src/pages/Inventario.jsx.
// Vocabulario de venta propio de Inventario (Disponible/Reservado/Separado/
// Vendido/VIP…), distinto del vocabulario de estados de Negocios -- por eso
// es un badge aparte y no reutiliza estadoToken()/Badge (que ya tienen su
// propio mapeo semántico para ese otro vocabulario).
const TONOS = [
  { test: (e) => e.includes('dispon'), bg: '#ecfdf5', text: '#047857' }, // emerald
  { test: (e) => e.includes('vendid'), bg: '#f0f9ff', text: '#0369a1' }, // sky
  { test: (e) => e.includes('vip'), bg: '#faf5ff', text: '#7c3aed' }, // violet
  { test: (e) => e.includes('reserv') || e.includes('separad') || e.includes('pend') || e.includes('stand'), bg: '#fffbeb', text: '#b45309' }, // amber
];
const DEFAULT_TONO = { bg: 'var(--color-surface-sunken)', text: 'var(--color-ink-secondary)' };

export function EstadoInventarioBadge({ estado }) {
  if (!estado) return null;
  const e = estado.toLowerCase();
  const tono = TONOS.find((t) => t.test(e)) ?? DEFAULT_TONO;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 10px',
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--text-label-size)',
        fontWeight: 700,
        background: tono.bg,
        color: tono.text,
        whiteSpace: 'nowrap',
      }}
    >
      {estado}
    </span>
  );
}
