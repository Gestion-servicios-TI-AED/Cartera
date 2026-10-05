// Detalle de un inmueble de Baía Kristal (Products de Zoho). Rediseño
// 2026-10-05: banner, cifras clave y la lista completa de "Todas las variables"
// del Product (`datos`) con un buscador, cada valor formateado según su tipo
// (booleano, arreglo, objeto lookup).
import { useEffect, useMemo, useState } from 'react';
import { EstadoInventarioBadge } from '../../components/ui/EstadoInventarioBadge.jsx';
import { getInventarioItem } from '../../api/inventario.js';
import styles from './InventarioDetallePage.module.css';
import { DetalleHero, HeroBadges } from '../../components/layout/DetalleHero.jsx';
import { Warehouse } from 'lucide-react';

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
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    setCargando(true);
    setError(null);
    getInventarioItem(id)
      .then((res) => setItem(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, [id]);

  const entries = useMemo(() => Object.entries(item?.datos || {}).filter(([, v]) => formatValor(v) !== null), [item]);
  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(([k, v]) => `${toLabel(k)} ${formatValor(v)}`.toLowerCase().includes(q));
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
    ['Proyecto', item.proyecto],
    ['Torre', item.torre],
    ['Piso', item.piso],
    ['Categoría', item.categoria],
  ].filter(([, valor]) => valor != null && valor !== '');

  return (
    <div className={styles.detalle}>
      <DetalleHero
        icon={Warehouse}
        titulo={item.nombre || '—'}
        subtitulo={[item.torre && item.proyecto && item.torre.startsWith(item.proyecto) ? item.torre : [item.proyecto, item.torre].filter(Boolean).join(' · '), item.piso].filter(Boolean).join(' · ') || 'Inmueble'}
        meta={item.referenciaRecaudo ? `Ref. recaudo: ${item.referenciaRecaudo}` : undefined}
      >
        <HeroBadges>
          <EstadoInventarioBadge estado={item.estado} />
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
                <span className={styles.miniLabel}>{toLabel(k)}</span>
                <span className={styles.valor}>{formatValor(v)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
