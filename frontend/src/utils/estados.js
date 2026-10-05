// Portado de zoho-payment-tracker/frontend/src/utils/estados.js -- mismo
// mapeo estado→categoría semántica ("un color = un significado"), adaptado
// para devolver directamente el `variant` del componente Badge de Cartera
// (success/danger/warning/info/neutral) en vez de clases Tailwind.
export function estadoToken(estado) {
  if (!estado) return 'neutral';
  const e = String(estado).toLowerCase();
  if (/(mora|vencid|cancel|rescili|rescind|anulad)/.test(e)) return 'danger';
  if (/(escritur|activo|vigente|prometid|al d[ií]a|aplicad)/.test(e)) return 'success';
  if (/(pendiente|revers|por revisar)/.test(e)) return 'warning';
  if (/(promes|proceso|tr[aá]mite|libre|gesti[oó]n)/.test(e)) return 'info';
  return 'neutral';
}

// Alias con el mismo nombre que usaba el legado (Badge variant, no clase CSS).
export const estadoBadgeVariant = estadoToken;
