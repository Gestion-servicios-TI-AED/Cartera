// Sección colapsable con encabezado clicable (icono + título + badge de
// conteo opcional + chevron) -- usada por el detalle de Negocios para las 6
// secciones (Comprador, Info del apartamento, Estructura financiera,
// Conciliación, Historial de movimientos, Forma y propuesta de pago), mismo
// patrón visual que zoho-payment-tracker/frontend/src/pages/Negocios.jsx
// (Accordion), adaptado a CSS Modules + tokens de Cartera.
import { useState } from 'react';
import styles from './Accordion.module.css';

export function Accordion({ icon: Icon, title, badge, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={styles.card}>
      <button type="button" className={styles.header} onClick={() => setOpen((o) => !o)}>
        {Icon && (
          <span className={styles.icon}>
            <Icon size={15} strokeWidth={2} />
          </span>
        )}
        <span className={styles.title}>{title}</span>
        {badge != null && badge !== 0 && <span className={styles.badge}>{badge}</span>}
        <svg
          className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && <div className={styles.body}>{children}</div>}
    </div>
  );
}
