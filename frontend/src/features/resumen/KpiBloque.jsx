// Bloque de KPIs desglosable del Resumen (Total 100% / Cuota inicial 30% /
// Saldo 70%): cerrado por defecto para no ocupar la pantalla; al cerrarse
// deja una línea con las cifras principales. Recuerda abierto/cerrado por
// bloque (usePersistentState). La raíz es un <div> hijo directo de
// `.kpiSecciones`, así hereda el estilo de tarjeta de sección.
import { ChevronDown } from 'lucide-react';
import { usePersistentState } from '../../hooks/usePersistentState.js';
import styles from './ResumenPage.module.css';

export function KpiBloque({ storageKey, titulo, resumen, children }) {
  const [abierto, setAbierto] = usePersistentState(storageKey, false);
  return (
    <div>
      <button type="button" className={styles.kpiBloqueHeader} onClick={() => setAbierto((v) => !v)} aria-expanded={abierto}>
        <h3 className={styles.kpiSeccionTitulo}>{titulo}</h3>
        {!abierto && resumen && <span className={styles.kpiBloqueResumen}>{resumen}</span>}
        <ChevronDown size={18} className={`${styles.kpiBloqueChevron} ${abierto ? styles.kpiBloqueChevronAbierto : ''}`} aria-hidden="true" />
      </button>
      {abierto && children}
    </div>
  );
}
