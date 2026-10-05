// Contenido del panel derecho del maestro-detalle de Inventario (ver
// InventarioPage.jsx) -- adaptado de InventarioDetalle en
// zoho-payment-tracker/frontend/src/pages/Inventario.jsx: header con
// referencia/proyecto·torre·piso/estado/categoría/ref. recaudo, y la lista
// completa de "Todas las variables" del Product de Zoho (`datos`), cada
// valor formateado según su tipo (booleano, arreglo, objeto lookup).
import { useEffect, useState } from 'react';
import { EstadoInventarioBadge } from '../../components/ui/EstadoInventarioBadge.jsx';
import { getInventarioItem } from '../../api/inventario.js';
import styles from './InventarioDetallePage.module.css';

// Convierte un valor crudo de Zoho a texto mostrable, sin reformatear lo que
// ya viene limpio. Objetos lookup (Owner, Proyecto…) muestran su nombre;
// arreglos se listan separados por coma; booleanos como Sí/No.
function formatValor(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'boolean') return v ? 'Sí' : 'No';
  if (Array.isArray(v)) return v.length ? v.map((x) => (typeof x === 'object' ? x.name || JSON.stringify(x) : String(x))).join(', ') : null;
  if (typeof v === 'object') return v.name || v.display_label || JSON.stringify(v);
  return String(v);
}

function toLabel(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function InventarioDetalleContenido({ id }) {
  const [item, setItem] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setCargando(true);
    setError(null);
    getInventarioItem(id)
      .then((res) => setItem(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, [id]);

  if (cargando) {
    return (
      <div className={styles.centrado}>
        <p className={styles.cargando}>Cargando…</p>
      </div>
    );
  }
  if (error || !item) {
    return (
      <div className={styles.centrado}>
        <p className={styles.error}>{error || 'No encontrado'}</p>
      </div>
    );
  }

  const entries = Object.entries(item.datos || {}).filter(([, v]) => formatValor(v) !== null);

  return (
    <div className={styles.detalle}>
      <div className={styles.headerCard}>
        <div className={styles.headerRow}>
          <div className={styles.headerInfo}>
            <p className={styles.eyebrow}>Referencia</p>
            <h1 className={styles.titulo}>{item.nombre || '—'}</h1>
            <p className={styles.subtitulo2}>{[item.proyecto, item.torre, item.piso].filter(Boolean).join(' · ')}</p>
          </div>
          <div className={styles.headerBadges}>
            <EstadoInventarioBadge estado={item.estado} />
            {item.categoria && <span className={styles.categoriaBadge}>{item.categoria}</span>}
          </div>
        </div>
        {item.referenciaRecaudo && <p className={styles.refRecaudo}>Ref. recaudo: {item.referenciaRecaudo}</p>}
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitulo}>Todas las variables</span>
          <span className={styles.contador}>{entries.length}</span>
        </div>
        <div className={styles.columnas}>
          {entries.map(([k, v]) => (
            <div key={k} className={styles.fila}>
              <span className={styles.miniLabel}>{toLabel(k)}</span>
              <span className={styles.valor}>{formatValor(v)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
