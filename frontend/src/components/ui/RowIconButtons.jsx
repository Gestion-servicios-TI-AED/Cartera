import styles from './RowIconButtons.module.css';

export function EditIconButton({ label, onClick, disabled, title }) {
  return (
    <button
      type="button"
      className={`${styles.iconButton} ${styles.iconButtonPrimary}`}
      aria-label={label}
      title={title}
      disabled={disabled}
      onClick={onClick}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M11.5 2.5L13.5 4.5L5 13H3V11L11.5 2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

// `activo` decide tanto el icono (circulo+linea = inactivar, circulo+cruz =
// activar) como el color en hover (rojo solo cuando la accion es
// destructiva -- inactivar algo que hoy esta activo, verde cuando es
// "activar" -- puerto de HRMS, 2026-09-18, pedido explicito del usuario).
export function ToggleActivoIconButton({ activo, labelActivar, labelInactivar, onClick, disabled, title }) {
  return (
    <button
      type="button"
      className={`${styles.iconButton} ${activo ? styles.iconButtonDanger : styles.iconButtonSuccess}`}
      aria-label={activo ? labelInactivar : labelActivar}
      title={title}
      disabled={disabled}
      onClick={onClick}
    >
      {activo ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
          <path d="M5.5 8H10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
          <path d="M8 5.5V10.5M5.5 8H10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}
