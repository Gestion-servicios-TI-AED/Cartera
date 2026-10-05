// Portado tal cual de zoho-payment-tracker/frontend/src/components/StageBadge.jsx.
// Cada etapa del pipeline de Zoho tiene un hue propio (ninguna se repite) --
// deliberadamente por fuera del sistema de 5 variantes semánticas de Badge
// (success/warning/danger/info/neutral), que no alcanza para diferenciar 8
// etapas sin repetir significado. Mismos hex exactos que el legado.
const STAGE_MAP = {
  Qualification: { bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
  'Value Proposition': { bg: '#f0f9ff', text: '#0369a1', border: '#bae6fd' },
  'Id. Decision Makers': { bg: '#faf5ff', text: '#7c3aed', border: '#ddd6fe' },
  'Perception Analysis': { bg: '#eef2ff', text: '#4f46e5', border: '#c7d2fe' },
  'Proposal/Price Quote': { bg: '#f0fdfa', text: '#0e7581', border: '#99f6e4' },
  'Negotiation/Review': { bg: '#fff1f2', text: '#e11d48', border: '#fecdd3' },
  'Closed Won': { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' },
  'Closed Lost': { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' },
};
const DEFAULT_STAGE = { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' };

export function StageBadge({ stage }) {
  if (!stage) return <span style={{ color: 'var(--color-border-strong)' }}>—</span>;
  const s = STAGE_MAP[stage] || DEFAULT_STAGE;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '2px 10px',
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--text-label-size)',
        fontWeight: 600,
        border: `1px solid ${s.border}`,
        background: s.bg,
        color: s.text,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
      {stage}
    </span>
  );
}
