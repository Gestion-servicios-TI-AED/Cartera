import { InfoTooltip } from '../../components/ui/InfoTooltip.jsx';
import styles from './Dashboard.module.css';

export function StatTile({ label, value, description }) {
  return (
    <div className={styles.statTile}>
      <span className={styles.statValue}>{value}</span>
      <div className={styles.statLabelRow}>
        <span className={styles.statLabel}>{label}</span>
        {description && <InfoTooltip text={description} />}
      </div>
    </div>
  );
}
