import { InfoTooltip } from '../../components/ui/InfoTooltip.jsx';
import styles from './Dashboard.module.css';

// KPI del dashboard, mismo diseño que el StatTile del HRMS (2026-10-05): icono
// en una pastilla tintada según `tone` (primary | success | warning | neutral),
// tooltip arriba a la derecha, cifra grande y etiqueta. `warning` tiñe la cifra
// cuando es algo que requiere atención.
export function StatTile({ label, value, sub, description, icon: Icon, warning, tone = 'primary' }) {
  return (
    <div className={styles.statTile}>
      <div className={styles.statTop}>
        {Icon && (
          <span className={`${styles.iconChip} ${styles[`tone_${tone}`]}`}>
            <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
          </span>
        )}
        {description && <InfoTooltip text={description} />}
      </div>
      <span className={`${styles.statValue} ${warning ? styles.statValueWarning : ''}`}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
      {sub && <span className={styles.statSub}>{sub}</span>}
    </div>
  );
}
