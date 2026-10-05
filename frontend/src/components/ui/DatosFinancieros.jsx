// Adaptado de zoho-payment-tracker/frontend/src/components/DatosFinancieros.jsx
// (ListaInfo / ListaFinanciera) a CSS Modules + ConceptoHint sobre InfoTooltip.
// Mismos criterios de agrupación de campos financieros por mes (ver
// utils/ordenColumnas.js) y de renombrado de "Saldo" a "Abonado" (ver
// utils/etiquetas.js).
import { ConceptoHint } from './ConceptoHint.jsx';
import { separarFinanciero } from '../../utils/ordenColumnas.js';
import { etiquetaColumna } from '../../utils/etiquetas.js';
import styles from './DatosFinancieros.module.css';

function Fila({ etiqueta, valor, hoja = 'resumen' }) {
  return (
    <div className={styles.fila}>
      <span className={styles.etiqueta}>
        {etiquetaColumna(etiqueta)}
        <ConceptoHint columna={etiqueta} hoja={hoja} />
      </span>
      <span className={styles.valor}>{valor != null && valor !== '' ? valor : <span className={styles.vacio}>—</span>}</span>
    </div>
  );
}

// Lista simple de pares etiqueta/valor en texto plano (Info del apartamento).
export function ListaInfo({ entries, hoja = 'resumen', format }) {
  if (!entries || entries.length === 0) {
    return <p className={styles.sinDatos}>Sin datos</p>;
  }
  return (
    <div className={styles.columnas}>
      {entries.map(([k, v]) => (
        <Fila key={k} etiqueta={k} valor={format(k, v)} hoja={hoja} />
      ))}
    </div>
  );
}

// Lista financiera: campos fijos como filas y cada mes consolidado en una sola línea.
export function ListaFinanciera({ entries, format }) {
  if (!entries || entries.length === 0) {
    return <p className={styles.sinDatos}>Sin datos financieros</p>;
  }
  const { antes, meses, despues, otras } = separarFinanciero(entries);
  const dinero = (v) => (v != null && v !== '' ? format('saldo', v) ?? String(v) : '—');

  return (
    <div className={styles.columnas}>
      {antes.map(([k, v]) => (
        <Fila key={k} etiqueta={k} valor={format(k, v)} hoja="resumen" />
      ))}

      {meses.map((m) => (
        <div key={m.etiqueta} className={styles.filaMes}>
          <span className={styles.etiqueta}>{m.etiqueta}</span>
          <span className={styles.valorMes}>
            <span className={styles.muted}>Ingreso</span> <b>{dinero(m.ingreso)}</b>
            <span className={styles.sep}>·</span>
            <span className={styles.muted}>Salida</span> <b>{dinero(m.salida)}</b>
            <span className={styles.sep}>·</span>
            <span className={styles.muted}>Abonado</span> <b>{dinero(m.saldo)}</b>
          </span>
        </div>
      ))}

      {despues.map(([k, v]) => (
        <Fila key={k} etiqueta={k} valor={format(k, v)} hoja="resumen" />
      ))}

      {otras.map(([k, v]) => (
        <Fila key={k} etiqueta={k} valor={format(k, v)} hoja="resumen" />
      ))}
    </div>
  );
}
