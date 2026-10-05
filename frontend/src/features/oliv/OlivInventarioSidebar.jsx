// Panel izquierdo del maestro-detalle de Inmuebles de Oliv -- calcado de
// inventario/InventarioSidebar.jsx (Baía Kristal/Zoho), pero SIN la
// jerarquía Etapa→Frente→Torre: el objeto "Unidades" de HubSpot ya trae
// `torre` como propiedad plana (no una expresión JSONB compuesta como
// `Proyecto_Torre` en Zoho), así que los filtros son directos -- Torre,
// Categoría, Estado, más búsqueda. Pedido explícito del usuario
// (2026-09-11): "el módulo Inmuebles como en Baía Kristal, pero acá como es
// en HubSpot y los filtros acomodados a como es HubSpot".
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, RefreshCw, Building, Download } from 'lucide-react';
import { EstadoInventarioBadge } from '../../components/ui/EstadoInventarioBadge.jsx';
import { Field, TextInput, Select } from '../../components/ui/Field.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { usePersistentState } from '../../hooks/usePersistentState.js';
import { listInmueblesOliv, iniciarSyncInmueblesOliv, getSyncStatusInmueblesOliv } from '../../api/oliv.js';
import { formatCOP } from '../../utils/format.js';
import { exportarInmueblesOliv } from './exportarInmueblesOliv.js';
import styles from '../inventario/InventarioSidebar.module.css';

function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function InmuebleItem({ item, seleccionado }) {
  return (
    <Link to={`/oliv/inmuebles/${item.id}`} className={`${styles.item} ${seleccionado ? styles.itemSeleccionado : ''}`}>
      {seleccionado && <span className={styles.itemBarra} aria-hidden="true" />}
      <div className={styles.itemRow}>
        <div className={styles.itemInfo}>
          <p className={styles.itemTitulo}>{item.codigoUnidad || '(sin código)'}</p>
          <p className={styles.itemSub}>{[item.torre && `Torre ${item.torre}`, item.valorComercial != null && formatCOP(item.valorComercial)].filter(Boolean).join(' · ')}</p>
        </div>
        <EstadoInventarioBadge estado={item.estado} />
      </div>
    </Link>
  );
}

export function OlivInventarioSidebar({ selectedId, onDatosCargados }) {
  const [filtros, setFiltros] = usePersistentState('oliv-inventario-list:filtros', { search: '', torre: '', categoria: '', estado: '' });
  const [pagina, setPagina] = usePersistentState('oliv-inventario-list:pagina', 1);
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [exportando, setExportando] = useState(false);
  const [searchInput, setSearchInput] = useState(filtros.search);
  const debouncedSearch = useDebounce(searchInput);
  const pollRef = useRef(null);

  const [opciones, setOpciones] = useState({ torres: [], categorias: [], estados: [] });

  useEffect(() => {
    if (debouncedSearch === filtros.search) return;
    setFiltros((prev) => ({ ...prev, search: debouncedSearch }));
    setPagina(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  async function cargar() {
    setCargando(true);
    try {
      const res = await listInmueblesOliv({ ...filtros, page: pagina, limit: 50 });
      setResultado(res.data);
      setOpciones((prev) => ({
        torres: res.data.torres ?? prev.torres,
        categorias: res.data.categorias ?? prev.categorias,
        estados: res.data.estados ?? prev.estados,
      }));
      const sinFiltros = !filtros.search && !filtros.torre && !filtros.categoria && !filtros.estado;
      onDatosCargados?.({ isEmpty: res.data.pagination.total === 0 && sinFiltros });
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros.search, filtros.torre, filtros.categoria, filtros.estado, pagina]);

  useEffect(() => () => clearInterval(pollRef.current), []);

  function actualizarFiltro(campo, valor) {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
    setPagina(1);
  }

  function handleSync() {
    setSincronizando(true);
    setSyncError(null);
    iniciarSyncInmueblesOliv().catch(() => {});
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      try {
        const res = await getSyncStatusInmueblesOliv();
        if (!res.data.running) {
          clearInterval(pollRef.current);
          setSincronizando(false);
          if (res.data.result?.ok) {
            cargar();
          } else {
            setSyncError(res.data.result?.error || 'La sincronización no terminó correctamente. Intenta de nuevo.');
          }
        }
      } catch {
        // seguir intentando
      }
      if (attempts > 120) {
        clearInterval(pollRef.current);
        setSincronizando(false);
        setSyncError('La sincronización tardó demasiado y se canceló. Intenta de nuevo.');
      }
    }, 2000);
  }

  async function handleExportar() {
    setExportando(true);
    try {
      await exportarInmueblesOliv(filtros);
    } catch (err) {
      window.alert(`No se pudo exportar: ${err.message}`);
    } finally {
      setExportando(false);
    }
  }

  function clearFilters() {
    setSearchInput('');
    setFiltros({ search: '', torre: '', categoria: '', estado: '' });
    setPagina(1);
  }

  const meta = resultado ?? {};
  const hasFilters = filtros.search || filtros.torre || filtros.categoria || filtros.estado;
  const isEmpty = !cargando && meta.pagination?.total === 0 && !hasFilters;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.titulo}>Inmuebles</h1>
          {meta.pagination && !isEmpty && <span className={styles.contador}>{meta.pagination.total}</span>}
          <button type="button" className={styles.iconButton} title={hasFilters ? 'Exportar a Excel (con los filtros aplicados)' : 'Exportar todos los inmuebles a Excel'} onClick={handleExportar} disabled={exportando}>
            <Download size={13} />
          </button>
          <button type="button" className={styles.iconButton} title="Sincronizar inmuebles desde HubSpot" onClick={handleSync} disabled={sincronizando}>
            <RefreshCw size={13} className={sincronizando ? styles.spin : ''} />
          </button>
        </div>

        {syncError && <p className={styles.syncError}>{syncError}</p>}

        <Field
          label={
            <span className={styles.labelConIcono}>
              <Search size={13} />
              Buscar
            </span>
          }
        >
          {(p) => <TextInput {...p} value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Código de unidad o torre…" />}
        </Field>

        <div className={styles.filtrosGrid}>
          {opciones.torres.length > 0 && (
            <Field
              label={
                <span className={styles.labelConIcono}>
                  <Building size={13} />
                  Torre
                </span>
              }
            >
              {(p) => (
                <Select {...p} value={filtros.torre} onChange={(e) => actualizarFiltro('torre', e.target.value)}>
                  <option value="">Todas las torres</option>
                  {opciones.torres.map((t) => <option key={t} value={t}>Torre {t}</option>)}
                </Select>
              )}
            </Field>
          )}
          {opciones.categorias.length > 0 && (
            <Field label="Categoría">
              {(p) => (
                <Select {...p} value={filtros.categoria} onChange={(e) => actualizarFiltro('categoria', e.target.value)}>
                  <option value="">Todas las categorías</option>
                  {opciones.categorias.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              )}
            </Field>
          )}
          {opciones.estados.length > 0 && (
            <Field label="Estado">
              {(p) => (
                <Select {...p} value={filtros.estado} onChange={(e) => actualizarFiltro('estado', e.target.value)}>
                  <option value="">Todos los estados</option>
                  {opciones.estados.map((e) => <option key={e} value={e}>{e}</option>)}
                </Select>
              )}
            </Field>
          )}
        </div>

        {hasFilters && (
          <button type="button" className={styles.limpiar} onClick={clearFilters}>Limpiar filtros</button>
        )}
      </div>

      <div className={styles.lista} data-lenis-prevent>
        {cargando && <p className={styles.mensajeLista}>Cargando…</p>}
        {!cargando && (meta.data ?? []).length === 0 && (
          <p className={styles.mensajeLista}>{isEmpty ? 'Sin inmuebles cargados.' : 'Sin resultados para los filtros aplicados.'}</p>
        )}
        {!cargando && (meta.data ?? []).map((item) => <InmuebleItem key={item.id} item={item} seleccionado={selectedId === item.id} />)}
      </div>

      {meta.pagination && meta.pagination.totalPages > 1 && (
        <div className={styles.paginacion}>
          <Button variant="ghost" disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)}>← Ant.</Button>
          <span className={styles.paginacionTexto}>{pagina}/{meta.pagination.totalPages}</span>
          <Button variant="ghost" disabled={pagina >= meta.pagination.totalPages} onClick={() => setPagina((p) => p + 1)}>Sig. →</Button>
        </div>
      )}
    </aside>
  );
}
