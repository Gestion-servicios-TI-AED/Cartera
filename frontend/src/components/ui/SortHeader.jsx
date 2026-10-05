// PLANTILLA -- copiado tal cual del HRMS aed. Va en
// frontend/src/components/ui/SortHeader.jsx del proyecto nuevo, junto con
// hooks/useSortableTable.js (componentes/hooks/) -- se usan siempre juntos.
// Ver "Sortable columns" en ARQUITECTURA-FRONTEND.md.
import styles from './SortHeader.module.css';

// Se coloca DENTRO de un <th> ya existente (no reemplaza al <th> en si) para
// heredar el padding/tipografia que cada tabla ya define en su propio CSS
// Module -- este componente solo agrega el boton clicable + la flecha de
// orden, sin pelearse por especificidad de CSS con la tabla que lo usa.
export function SortHeader({ label, sortKey, sort, onSort, align = 'left' }) {
  const direction = sort.key === sortKey ? sort.direction : null;
  const icono = direction === 'asc' ? '▲' : direction === 'desc' ? '▼' : '⇅';
  return (
    <button type="button" className={styles.sortHeader} data-align={align} onClick={() => onSort(sortKey)}>
      {/* Copia invisible del icono, solo en align="center": sin esto el
          grupo texto+icono se centra COMO GRUPO, y el icono (visible solo
          de un lado) corre el texto hacia la izquierda del centro real de
          la columna -- notorio comparado contra los datos de abajo, que sí
          quedan perfectamente centrados al no tener icono. Este espaciador
          fantasma balancea el ancho del icono real para que el texto caiga
          en el centro verdadero. */}
      {align === 'center' && <span className={styles.arrow} aria-hidden="true" style={{ visibility: 'hidden' }}>{icono}</span>}
      <span>{label}</span>
      <span className={styles.arrow} data-active={direction != null || undefined}>
        {icono}
      </span>
    </button>
  );
}
