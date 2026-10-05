// Quinto módulo de negocio migrado -- el corazón financiero del sistema.
// Layout maestro-detalle: sidebar a la izquierda con todos los
// negocios/inmuebles (filtros + lista + paginación, ver
// NegociosSidebar.jsx), panel derecho con el detalle completo del
// seleccionado (ver NegocioDetalleContenido.jsx) -- o, sin selección, el
// panel de estadísticas (KPIs + desglose por estado/etapa/frente). Mismo
// layout que zoho-payment-tracker/frontend/src/pages/Negocios.jsx, con una
// diferencia deliberada: la selección vive en la URL (`/negocios/:id`, con
// `/negocios` sin selección) en vez de un query param -- así Dashboard y
// Cartera en Gestión pueden seguir enlazando directo a un negocio
// (`/negocios/${id}`) sin tener que conocer este componente.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getStats } from '../../api/dashboard.js';
import { iniciarBackfillNegocios, getBackfillStatusNegocios } from '../../api/negocios.js';
import { etiquetaEtapa } from '../../utils/etapas.js';
import { useAlturaDisponible } from '../../hooks/useAlturaDisponible.js';
import { NegociosSidebar } from './NegociosSidebar.jsx';
import { NegocioDetalleContenido } from './NegocioDetalleContenido.jsx';
import styles from './NegociosPage.module.css';

function formatMoney(v) {
  if (v == null || v === 0) return '—';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);
}

function EstadisticasPanel({ stats }) {
  if (!stats) {
    return (
      <div className={styles.centrado}>
        <p className={styles.cargando}>Cargando…</p>
      </div>
    );
  }

  return (
    <div className={styles.stats}>
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Total inmuebles</p>
          <p className={styles.kpiValor}>{stats.totalInmuebles}</p>
        </div>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Con negocio</p>
          <p className={styles.kpiValor}>{stats.totalNegocios}</p>
        </div>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Con abonos</p>
          <p className={`${styles.kpiValor} ${styles.exito}`}>{stats.conSaldo}</p>
        </div>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Total abonado</p>
          <p className={`${styles.kpiValorSm} ${styles.exito}`}>{stats.saldoTotal > 0 ? formatMoney(stats.saldoTotal) : '—'}</p>
        </div>
      </div>

      <div className={styles.desgloseGrid}>
        <div className={styles.desgloseCard}>
          <p className={styles.desgloseTitulo}>Por estado</p>
          <div className={styles.desgloseLista}>
            {stats.porEstado.map((e) => (
              <div key={e.estado} className={styles.desgloseFila}>
                <span className={styles.desgloseEtiqueta}>{e.estado}</span>
                <span className={styles.desgloseValores}>
                  <span className={styles.desgloseCount}>{e.count}</span>
                  {e.saldo > 0 && <span className={styles.desgloseSaldo}>{formatMoney(e.saldo)}</span>}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.desgloseCard}>
          <p className={styles.desgloseTitulo}>Por etapa</p>
          <div className={styles.desgloseLista}>
            {stats.porEtapa.map((e) => (
              <div key={e.etapa} className={styles.desgloseFila}>
                <span className={styles.desgloseEtiqueta}>{etiquetaEtapa(e.etapa)}</span>
                <span className={styles.desgloseValores}>
                  <span className={styles.desgloseCount}>{e.count}</span>
                  {e.saldo > 0 && <span className={styles.desgloseSaldo}>{formatMoney(e.saldo)}</span>}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.desgloseCard}>
          <p className={styles.desgloseTitulo}>Por frente</p>
          <div className={styles.desgloseLista}>
            {stats.porFrente.map((f) => (
              <div key={f.frente} className={styles.desgloseFila}>
                <span className={styles.desgloseEtiqueta}>{f.frente}</span>
                <span className={styles.desgloseValores}>
                  <span className={styles.desgloseCount}>{f.count}</span>
                  {f.saldo > 0 && <span className={styles.desgloseSaldo}>{formatMoney(f.saldo)}</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className={styles.hint}>Selecciona un negocio de la lista para ver el detalle completo.</p>
    </div>
  );
}

function SinNegociosPanel({ onSync, syncing }) {
  return (
    <div className={styles.centrado}>
      <p className={styles.emptyTitulo}>Sin negocios cargados</p>
      <p className={styles.emptyTexto}>Los datos se extraen automáticamente de los archivos Excel subidos a Encargos. Haz clic en Sincronizar para cargarlos.</p>
      <button type="button" className={styles.botonSync} onClick={onSync} disabled={syncing}>
        {syncing ? 'Sincronizando…' : 'Sincronizar negocios'}
      </button>
    </div>
  );
}

export function NegociosPage() {
  const { id } = useParams();
  const [stats, setStats] = useState(null);
  const [isEmpty, setIsEmpty] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const layoutRef = useRef(null);
  const altura = useAlturaDisponible(layoutRef);

  const cargarStats = useCallback(() => {
    getStats().then((res) => setStats(res.data)).catch(() => {});
  }, []);
  useEffect(() => { cargarStats(); }, [cargarStats]);

  const handleSidebarData = useCallback(({ isEmpty: vacio }) => {
    setIsEmpty(vacio);
  }, []);

  async function handleSync() {
    setSyncing(true);
    await iniciarBackfillNegocios();
    const interval = setInterval(async () => {
      const res = await getBackfillStatusNegocios();
      if (!res.data.running) {
        clearInterval(interval);
        setSyncing(false);
        cargarStats();
        window.location.reload();
      }
    }, 2000);
  }

  return (
    <div className={styles.layout} ref={layoutRef} style={altura ? { height: `${altura}px` } : undefined}>
      <NegociosSidebar selectedId={id ?? null} onDatosCargados={handleSidebarData} />
      {/* data-lenis-prevent: este panel scrollea de forma independiente del
          scrollArea general del AppShell (envuelto en Lenis) -- sin este
          atributo, Lenis intercepta la rueda del mouse y el panel nunca
          scrollea de forma nativa. Ver el mismo atributo en la lista del
          sidebar (NegociosSidebar.module.css / .lista). */}
      <div className={styles.panel} data-lenis-prevent>
        {id ? (
          <NegocioDetalleContenido key={id} id={id} />
        ) : isEmpty ? (
          <SinNegociosPanel onSync={handleSync} syncing={syncing} />
        ) : (
          <EstadisticasPanel stats={stats} />
        )}
      </div>
    </div>
  );
}
