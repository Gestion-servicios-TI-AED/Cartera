// Contenido del panel derecho del maestro-detalle de Inmuebles de Oliv --
// calcado de inventario/InventarioDetalleContenido.jsx (Baía Kristal/Zoho):
// header con código/torre·piso/estado/categoría, y la lista completa de
// "Todas las variables" del objeto Unidades de HubSpot (`propiedades`).
import { useEffect, useState } from 'react';
import { EstadoInventarioBadge } from '../../components/ui/EstadoInventarioBadge.jsx';
import { getInmuebleOliv } from '../../api/oliv.js';
import { formatCOP } from '../../utils/format.js';
import { PROPIEDADES_OCULTAS, esUrl, etiquetaPropiedad, formatearPropiedad } from './inmuebleEtiquetas.js';
import styles from '../inventario/InventarioDetallePage.module.css';

export function OlivInventarioDetalleContenido({ id }) {
  const [item, setItem] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setCargando(true);
    setError(null);
    getInmuebleOliv(id)
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

  const entries = Object.entries(item.propiedades || {}).filter(([k, v]) => !PROPIEDADES_OCULTAS.has(k) && formatearPropiedad(k, v) !== null);

  return (
    <div className={styles.detalle}>
      <div className={styles.headerCard}>
        <div className={styles.headerRow}>
          <div className={styles.headerInfo}>
            <p className={styles.eyebrow}>Unidad</p>
            <h1 className={styles.titulo}>{item.codigoUnidad || '—'}</h1>
            <p className={styles.subtitulo2}>{[item.proyecto, item.torre && `Torre ${item.torre}`, item.piso != null && `Piso ${item.piso}`].filter(Boolean).join(' · ')}</p>
          </div>
          <div className={styles.headerBadges}>
            <EstadoInventarioBadge estado={item.estado} />
            {item.categoria && <span className={styles.categoriaBadge}>{item.categoria}</span>}
          </div>
        </div>
        {item.valorComercial != null && <p className={styles.refRecaudo}>Valor comercial: {formatCOP(item.valorComercial)}</p>}
        {item.planoLink && (
          <p className={styles.refRecaudo}>
            <a href={item.planoLink} target="_blank" rel="noreferrer">Ver plano</a>
          </p>
        )}
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitulo}>Todas las variables</span>
          <span className={styles.contador}>{entries.length}</span>
        </div>
        <div className={styles.columnas}>
          {entries.map(([k, v]) => (
            <div key={k} className={styles.fila}>
              <span className={styles.miniLabel}>{etiquetaPropiedad(k)}</span>
              <span className={styles.valor}>
                {esUrl(v) ? <a href={v} target="_blank" rel="noreferrer">Ver documento</a> : formatearPropiedad(k, v)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
