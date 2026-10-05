// Panel izquierdo del maestro-detalle de Inventario (ver InventarioPage.jsx)
// -- filtros (búsqueda, Etapa→Frente→Torre en cascada, Categoría, Estado) y
// la lista de inmuebles, cada uno enlazando a `/inventario/:id`. Mismo
// contenido y comportamiento que el panel izquierdo de
// zoho-payment-tracker/frontend/src/pages/Inventario.jsx.
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, RefreshCw, Layers, MapPin, Building } from 'lucide-react';
import { EstadoInventarioBadge } from '../../components/ui/EstadoInventarioBadge.jsx';
import { Field, TextInput, Select } from '../../components/ui/Field.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { usePersistentState } from '../../hooks/usePersistentState.js';
import { listInventario, iniciarSyncInventario, getSyncStatusInventario } from '../../api/inventario.js';
import { etiquetaEtapa } from '../../utils/etapas.js';
import styles from './InventarioSidebar.module.css';

function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function InventarioItem({ item, seleccionado }) {
  return (
    <Link to={`/inventario/${item.id}`} className={`${styles.item} ${seleccionado ? styles.itemSeleccionado : ''}`}>
      {seleccionado && <span className={styles.itemBarra} aria-hidden="true" />}
      <div className={styles.itemRow}>
        <div className={styles.itemInfo}>
          <p className={styles.itemTitulo}>{item.nombre || '(sin nombre)'}</p>
          <p className={styles.itemSub}>{[item.proyecto, item.torre].filter(Boolean).join(' · ')}</p>
        </div>
        <EstadoInventarioBadge estado={item.estado} />
      </div>
    </Link>
  );
}

export function InventarioSidebar({ selectedId, onDatosCargados }) {
  const [filtros, setFiltros] = usePersistentState('inventario-list:filtros', {
    search: '', categoria: '', estado: '', etapa: '', frente: '', torre: '',
  });
  const [pagina, setPagina] = usePersistentState('inventario-list:pagina', 1);
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [searchInput, setSearchInput] = useState(filtros.search);
  const debouncedSearch = useDebounce(searchInput);
  const pollRef = useRef(null);

  const [opciones, setOpciones] = useState({
    categorias: [], estados: [], etapasDisponibles: [], frentesDisponibles: [], frentesPorEtapa: {}, torresPorFrente: {}, torresPorEtapaFrente: {},
  });

  useEffect(() => {
    if (debouncedSearch === filtros.search) return;
    setFiltros((prev) => ({ ...prev, search: debouncedSearch }));
    setPagina(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  async function cargar() {
    setCargando(true);
    try {
      const res = await listInventario({ ...filtros, page: pagina, limit: 50 });
      setResultado(res.data);
      setOpciones((prev) => ({
        categorias: res.data.categorias ?? prev.categorias,
        estados: res.data.estados ?? prev.estados,
        etapasDisponibles: res.data.etapasDisponibles ?? prev.etapasDisponibles,
        frentesDisponibles: res.data.frentesDisponibles ?? prev.frentesDisponibles,
        frentesPorEtapa: res.data.frentesPorEtapa ?? prev.frentesPorEtapa,
        torresPorFrente: res.data.torresPorFrente ?? prev.torresPorFrente,
        torresPorEtapaFrente: res.data.torresPorEtapaFrente ?? prev.torresPorEtapaFrente,
      }));
      const sinFiltros = !filtros.search && !filtros.categoria && !filtros.estado && !filtros.etapa && !filtros.frente && !filtros.torre;
      onDatosCargados?.({ isEmpty: res.data.pagination.total === 0 && sinFiltros });
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros.search, filtros.categoria, filtros.estado, filtros.etapa, filtros.frente, filtros.torre, pagina]);

  useEffect(() => () => clearInterval(pollRef.current), []);

  function actualizarFiltro(campo, valor) {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
    setPagina(1);
  }

  function handleEtapaChange(value) {
    setFiltros((prev) => {
      const { frentesPorEtapa, torresPorEtapaFrente } = opciones;
      let { frente, torre } = prev;
      if (value && frente && !(frentesPorEtapa[value] || []).includes(frente)) {
        frente = ''; torre = '';
      } else if (value && frente && torre && !(torresPorEtapaFrente[`${value}||${frente}`] || []).includes(torre)) {
        torre = '';
      }
      return { ...prev, etapa: value, frente, torre };
    });
    setPagina(1);
  }

  function handleFrenteChange(value) {
    setFiltros((prev) => ({ ...prev, frente: value, torre: '' }));
    setPagina(1);
  }

  function handleSync() {
    setSincronizando(true);
    setSyncError(null);
    iniciarSyncInventario().catch(() => {});
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      try {
        const res = await getSyncStatusInventario();
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

  function clearFilters() {
    setSearchInput('');
    setFiltros({ search: '', categoria: '', estado: '', etapa: '', frente: '', torre: '' });
    setPagina(1);
  }

  const meta = resultado ?? {};
  const hasFilters = filtros.search || filtros.categoria || filtros.estado || filtros.etapa || filtros.frente || filtros.torre;
  const isEmpty = !cargando && meta.pagination?.total === 0 && !hasFilters;
  const frenteOptions = filtros.etapa ? (opciones.frentesPorEtapa?.[filtros.etapa] || []) : (opciones.frentesDisponibles ?? []);
  const torreOptions = filtros.frente
    ? (filtros.etapa ? (opciones.torresPorEtapaFrente?.[`${filtros.etapa}||${filtros.frente}`] || []) : (opciones.torresPorFrente?.[filtros.frente] || []))
    : [];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.titulo}>Inmuebles</h1>
          {meta.pagination && !isEmpty && <span className={styles.contador}>{meta.pagination.total}</span>}
          <button type="button" className={styles.iconButton} title="Sincronizar inmuebles desde Zoho" onClick={handleSync} disabled={sincronizando}>
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
          {(p) => <TextInput {...p} value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Nombre, torre o referencia…" />}
        </Field>

        <div className={styles.filtrosGrid}>
          {opciones.etapasDisponibles.length > 0 && (
            <Field
              label={
                <span className={styles.labelConIcono}>
                  <Layers size={13} />
                  Etapa
                </span>
              }
            >
              {(p) => (
                <Select {...p} value={filtros.etapa} onChange={(e) => handleEtapaChange(e.target.value)}>
                  <option value="">Todas las etapas</option>
                  {opciones.etapasDisponibles.map((et) => <option key={et} value={et}>{etiquetaEtapa(et)}</option>)}
                </Select>
              )}
            </Field>
          )}
          {frenteOptions.length > 0 && (
            <Field
              label={
                <span className={styles.labelConIcono}>
                  <MapPin size={13} />
                  Frente
                </span>
              }
            >
              {(p) => (
                <Select {...p} value={filtros.frente} onChange={(e) => handleFrenteChange(e.target.value)}>
                  <option value="">Todos los frentes</option>
                  {frenteOptions.map((fr) => <option key={fr} value={fr}>{fr}</option>)}
                </Select>
              )}
            </Field>
          )}
          {filtros.frente && torreOptions.length > 0 && (
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
                  {torreOptions.map((tr) => <option key={tr} value={tr}>Torre {tr}</option>)}
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
        {!cargando && (meta.data ?? []).map((item) => <InventarioItem key={item.id} item={item} seleccionado={selectedId === item.id} />)}
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
