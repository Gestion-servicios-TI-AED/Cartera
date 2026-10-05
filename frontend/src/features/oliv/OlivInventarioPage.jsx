// Layout maestro-detalle de Inmuebles de Oliv -- calcado de
// inventario/InventarioPage.jsx (Baía Kristal/Zoho): sidebar con filtros +
// lista a la izquierda, detalle completo del seleccionado a la derecha.
// Selección en la URL (`/oliv/inmuebles/:id`), igual criterio que
// InventarioPage.jsx.
import { useCallback, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Warehouse } from 'lucide-react';
import { iniciarSyncInmueblesOliv, getSyncStatusInmueblesOliv } from '../../api/oliv.js';
import { useAlturaDisponible } from '../../hooks/useAlturaDisponible.js';
import { OlivInventarioSidebar } from './OlivInventarioSidebar.jsx';
import { OlivInventarioDetalleContenido } from './OlivInventarioDetalleContenido.jsx';
import styles from '../inventario/InventarioPage.module.css';

function SinInventarioPanel({ onSync, syncing, error }) {
  return (
    <div className={styles.centrado}>
      <div className={styles.emptyIcono}><Warehouse size={24} /></div>
      <p className={styles.emptyTitulo}>Sin inmuebles cargados</p>
      <p className={styles.emptyTexto}>Haz clic en Sincronizar para traer todas las unidades desde HubSpot.</p>
      <button type="button" className={styles.botonSync} onClick={onSync} disabled={syncing}>
        {syncing ? 'Sincronizando…' : 'Sincronizar inmuebles'}
      </button>
      {error && <p className={styles.emptyError}>{error}</p>}
    </div>
  );
}

export function OlivInventarioPage() {
  const { id } = useParams();
  const [isEmpty, setIsEmpty] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const layoutRef = useRef(null);
  const altura = useAlturaDisponible(layoutRef);

  const handleSidebarData = useCallback(({ isEmpty: vacio }) => {
    setIsEmpty(vacio);
  }, []);

  function handleSync() {
    setSyncing(true);
    setSyncError(null);
    iniciarSyncInmueblesOliv().catch(() => {});
    const interval = setInterval(async () => {
      const res = await getSyncStatusInmueblesOliv();
      if (!res.data.running) {
        clearInterval(interval);
        setSyncing(false);
        if (res.data.result?.ok) {
          window.location.reload();
        } else {
          setSyncError(res.data.result?.error || 'La sincronización no terminó correctamente. Intenta de nuevo.');
        }
      }
    }, 2000);
  }

  return (
    <div className={styles.layout} ref={layoutRef} style={altura ? { height: `${altura}px` } : undefined}>
      <OlivInventarioSidebar selectedId={id ?? null} onDatosCargados={handleSidebarData} />
      <div className={styles.panel} data-lenis-prevent>
        {id ? (
          <OlivInventarioDetalleContenido key={id} id={id} />
        ) : isEmpty ? (
          <SinInventarioPanel onSync={handleSync} syncing={syncing} error={syncError} />
        ) : (
          <div className={styles.centrado}>
            <p className={styles.placeholder}>Selecciona un ítem de la lista para ver todas sus variables.</p>
          </div>
        )}
      </div>
    </div>
  );
}
