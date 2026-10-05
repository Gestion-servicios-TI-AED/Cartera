// Detalle de un inmueble de Oliv (objeto Unidades de HubSpot). Mismo rediseño
// que Baía Kristal (inventario/InventarioDetalleContenido.jsx): banner, cifras
// clave y la lista completa de "Todas las variables" (`propiedades`) con buscador.
import { useEffect, useMemo, useState } from 'react';
import { EstadoInventarioBadge } from '../../components/ui/EstadoInventarioBadge.jsx';
import { getInmuebleOliv } from '../../api/oliv.js';
import { formatCOP } from '../../utils/format.js';
import { PROPIEDADES_OCULTAS, esUrl, etiquetaPropiedad, formatearPropiedad } from './inmuebleEtiquetas.js';
import styles from '../inventario/InventarioDetallePage.module.css';
import { DetalleHero, HeroBadges, HeroBoton } from '../../components/layout/DetalleHero.jsx';
import { Warehouse } from 'lucide-react';

export function OlivInventarioDetalleContenido({ id }) {
  const [item, setItem] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    setCargando(true);
    setError(null);
    getInmuebleOliv(id)
      .then((res) => setItem(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, [id]);

  const entries = useMemo(
    () => Object.entries(item?.propiedades || {}).filter(([k, v]) => !PROPIEDADES_OCULTAS.has(k) && formatearPropiedad(k, v) !== null),
    [item]
  );
  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(([k, v]) => `${etiquetaPropiedad(k)} ${esUrl(v) ? '' : formatearPropiedad(k, v)}`.toLowerCase().includes(q));
  }, [entries, busqueda]);

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

  const kpis = [
    ['Valor comercial', item.valorComercial != null ? formatCOP(item.valorComercial) : null],
    ['Torre', item.torre ? `Torre ${item.torre}` : null],
    ['Piso', item.piso != null ? `Piso ${item.piso}` : null],
    ['Categoría', item.categoria],
  ].filter(([, valor]) => valor != null && valor !== '');

  return (
    <div className={styles.detalle}>
      <DetalleHero
        icon={Warehouse}
        titulo={item.codigoUnidad || '—'}
        subtitulo={[item.proyecto, item.torre && `Torre ${item.torre}`, item.piso != null && `Piso ${item.piso}`].filter(Boolean).join(' · ') || 'Unidad'}
      >
        <HeroBadges>
          <EstadoInventarioBadge estado={item.estado} />
          {item.planoLink && <HeroBoton onClick={() => window.open(item.planoLink, '_blank', 'noreferrer')}>Ver plano</HeroBoton>}
        </HeroBadges>
      </DetalleHero>

      {kpis.length > 0 && (
        <div className={styles.kpiGrid}>
          {kpis.map(([label, valor]) => (
            <div key={label} className={styles.kpiCard}>
              <p className={styles.kpiLabel}>{label}</p>
              <p className={styles.kpiValor}>{valor}</p>
            </div>
          ))}
        </div>
      )}

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitulo}>Todas las variables</span>
          <span className={styles.contador}>{visibles.length === entries.length ? entries.length : `${visibles.length} / ${entries.length}`}</span>
          <input
            type="search"
            className={styles.buscador}
            placeholder="Buscar una variable…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            aria-label="Buscar una variable"
          />
        </div>
        {visibles.length === 0 ? (
          <p className={styles.sinResultados}>Ninguna variable coincide con la búsqueda.</p>
        ) : (
          <div className={styles.columnas}>
            {visibles.map(([k, v]) => (
              <div key={k} className={styles.fila}>
                <span className={styles.miniLabel}>{etiquetaPropiedad(k)}</span>
                <span className={styles.valor}>
                  {esUrl(v) ? <a href={v} target="_blank" rel="noreferrer">Ver documento</a> : formatearPropiedad(k, v)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
