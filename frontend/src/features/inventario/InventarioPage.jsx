// Segundo módulo de negocio migrado. Layout maestro-detalle: sidebar a la
// izquierda con todos los inmuebles (filtros + lista + paginación, ver
// InventarioSidebar.jsx), panel derecho con el detalle completo del
// seleccionado (ver InventarioDetalleContenido.jsx) -- o, sin selección, un
// placeholder simple (a diferencia de Negocios, el legado no muestra
// estadísticas acá). Mismo layout que
// zoho-payment-tracker/frontend/src/pages/Inventario.jsx, con la misma
// diferencia deliberada que Negocios: la selección vive en la URL
// (`/inventario/:id`, con `/inventario` sin selección) en vez de un query
// param, para que otras pantallas puedan enlazar directo sin conocer este
// componente.
import { useCallback, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Warehouse } from 'lucide-react';
import { iniciarSyncInventario, getSyncStatusInventario } from '../../api/inventario.js';
import { useAlturaDisponible } from '../../hooks/useAlturaDisponible.js';
import { InventarioSidebar } from './InventarioSidebar.jsx';
import { InventarioDetalleContenido } from './InventarioDetalleContenido.jsx';
import styles from './InventarioPage.module.css';

function SinInventarioPanel({ onSync, syncing, error }) {
  return (
    <div className={styles.centrado}>
      <div className={styles.emptyIcono}><Warehouse size={24} /></div>
      <p className={styles.emptyTitulo}>Sin inmuebles cargados</p>
      <p className={styles.emptyTexto}>Haz clic en Sincronizar para traer todos los inmuebles desde el módulo Products de Zoho.</p>
      <button type="button" className={styles.botonSync} onClick={onSync} disabled={syncing}>
        {syncing ? 'Sincronizando…' : 'Sincronizar inmuebles'}
      </button>
      {error && <p className={styles.emptyError}>{error}</p>}
    </div>
  );
}

export function InventarioPage() {
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
    iniciarSyncInventario().catch(() => {});
    const interval = setInterval(async () => {
      const res = await getSyncStatusInventario();
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
      <InventarioSidebar selectedId={id ?? null} onDatosCargados={handleSidebarData} />
      {/* data-lenis-prevent: ver el mismo comentario en NegociosPage.jsx --
          este panel scrollea independiente del .scrollArea del AppShell. */}
      <div className={styles.panel} data-lenis-prevent>
        {id ? (
          <InventarioDetalleContenido key={id} id={id} />
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
