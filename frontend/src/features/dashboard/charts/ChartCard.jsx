import { InfoTooltip } from '../../../components/ui/InfoTooltip.jsx';
import styles from '../Dashboard.module.css';

// Envoltorio comun: titulo + hint + el grafico + estado vacio.
//
// El resumen en texto plano va en un <p> visualmente oculto (.srOnly), NO
// como aria-label en un div con role="img" envolviendo el grafico: role="img"
// le dice al lector de pantalla "esto es una imagen estatica" y saca todo lo
// de adentro del arbol de accesibilidad -- incluido el tooltip interactivo de
// ApexCharts, que deja de ser alcanzable. El grafico real queda sin role
// especial (interactivo, tabulable); el resumen es un texto hermano.
// `fill`: el card (y el bloque que envuelve `children`) pasan a `flex:1;
// min-height:0` en vez de altura intrínseca -- lo usa la tendencia de
// Resumen en modo Pantalla completa, para que el propio contenedor fijo
// (position:fixed;inset:0) empuje al grafico a ocupar el alto real
// disponible en vez de quedarse en su tamaño de tarjeta normal.
export function ChartCard({ title, hint, description, ariaLabel, empty, wide, fill, children }) {
  return (
    <div className={`${styles.chartCard} ${wide ? styles.chartCardWide : ''}`} style={fill ? { flex: 1, minHeight: 0 } : undefined}>
      {title && (
        <div className={styles.chartHeader}>
          <div className={styles.chartTitleRow}>
            <h3 className={styles.chartTitle}>{title}</h3>
            {description && <InfoTooltip text={description} />}
          </div>
          {hint && <p className={styles.chartHint}>{hint}</p>}
        </div>
      )}
      {empty ? (
        <p className={styles.emptyHint}>Sin datos todavía.</p>
      ) : (
        <>
          <p className={styles.srOnly}>{ariaLabel}</p>
          <div style={fill ? { flex: 1, minHeight: 0 } : undefined}>{children}</div>
        </>
      )}
    </div>
  );
}
