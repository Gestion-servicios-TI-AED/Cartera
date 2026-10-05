// Panel izquierdo del maestro-detalle de Negocios de Oliv -- calcado de
// negocios/NegociosSidebar.jsx (Baía Kristal), pero SIN Etapa→Frente→Torre
// (Oliv no tiene esa jerarquía de Zoho) ni exportar/reconstruir (no hay
// Excel de fiducia que sincronizar todavía) -- búsqueda + Estado (la etapa
// del negocio, HubSpot) + Torre + Estado del inmueble (LIVA/SEIVA,
// Disponible/Reservado/Separado/Vendido -- pedido explícito del usuario:
// "coloca el filtro si es LIVA o SEIVA y también el estado del inmueble",
// mismos dos filtros que ya existían en Inmuebles, ver
// OlivInventarioSidebar.jsx) + la lista.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, CircleDot, Building } from 'lucide-react';
import { Field, TextInput, Select } from '../../components/ui/Field.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { EstadoInventarioBadge } from '../../components/ui/EstadoInventarioBadge.jsx';
import { usePersistentState } from '../../hooks/usePersistentState.js';
import { listNegociosOliv } from '../../api/oliv.js';
import styles from '../negocios/NegociosSidebar.module.css';

function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// Mismo formato compacto que NegociosSidebar.jsx (Baía Kristal) -- acá
// `saldoActual` sale de sumar "Aportes" del Excel de Encargos cruzado por
// Referencia de Recaudo (ver olivNegocio.service.js), null hasta que ese
// cruce exista.
function formatSaldoCompact(val) {
  if (val == null || val === '') return null;
  const n = parseFloat(String(val).replace(/[^0-9.-]/g, ''));
  if (isNaN(n) || n === 0) return null;
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n)}`;
}

// Lista dirigida por inmueble (ver olivNegocio.service.js) -- la mayoría de
// las filas todavía no tienen negocio vinculado (~80 de 96), así que el
// título siempre es la unidad (estable, siempre existe) y el comprador va
// como subtítulo solo cuando sí hay negocio -- evita mostrar la misma
// unidad duplicada como título y subtítulo en las filas sin negocio.
function NegocioItem({ negocio, seleccionado }) {
  const saldo = formatSaldoCompact(negocio.saldoActual);

  return (
    <Link to={`/oliv/negocios/${negocio.id}`} className={`${styles.item} ${seleccionado ? styles.itemSeleccionado : ''}`}>
      {seleccionado && <span className={styles.itemBarra} aria-hidden="true" />}
      <div className={styles.itemRow}>
        <div className={styles.itemInfo}>
          <p className={styles.itemTitulo}>{negocio.unidad || negocio.referencia}</p>
          <p className={styles.itemSub}>{negocio.comprador || 'Sin negocio'}</p>
        </div>
        <div className={styles.itemMeta}>
          {negocio.estado && <Badge variant="neutral">{negocio.estado}</Badge>}
          {negocio.estadoInmueble && <EstadoInventarioBadge estado={negocio.estadoInmueble} />}
          {saldo && <span className={`${styles.itemSaldo} ${negocio.saldoActual > 0 ? styles.itemSaldoPositivo : ''}`}>{saldo}</span>}
        </div>
      </div>
    </Link>
  );
}

const FILTROS_VACIOS = { search: '', estado: '', torre: '', estadoInmueble: '' };

export function OlivNegociosSidebar({ selectedId, onDatosCargados }) {
  const [filtros, setFiltros] = usePersistentState('oliv-negocios-list:filtros', FILTROS_VACIOS);
  const [pagina, setPagina] = usePersistentState('oliv-negocios-list:pagina', 1);
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [searchInput, setSearchInput] = useState(filtros.search);
  const debouncedSearch = useDebounce(searchInput);

  const [opciones, setOpciones] = useState({ estados: [], torres: [], estadosInmueble: [] });

  useEffect(() => {
    if (debouncedSearch === filtros.search) return;
    setFiltros((prev) => ({ ...prev, search: debouncedSearch }));
    setPagina(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  async function cargar() {
    setCargando(true);
    try {
      const res = await listNegociosOliv({ ...filtros, page: pagina, limit: 50 });
      setResultado(res.data);
      setOpciones((prev) => ({
        estados: res.data.estados ?? prev.estados,
        torres: res.data.torres ?? prev.torres,
        estadosInmueble: res.data.estadosInmueble ?? prev.estadosInmueble,
      }));
      const sinFiltros = !filtros.search && !filtros.estado && !filtros.torre && !filtros.estadoInmueble;
      onDatosCargados?.({ isEmpty: res.data.pagination.total === 0 && sinFiltros });
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros.search, filtros.estado, filtros.torre, filtros.estadoInmueble, pagina]);

  function actualizarFiltro(campo, valor) {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
    setPagina(1);
  }

  function clearFilters() {
    setSearchInput('');
    setFiltros(FILTROS_VACIOS);
    setPagina(1);
  }

  const meta = resultado ?? {};
  const hasFilters = filtros.search || filtros.estado || filtros.torre || filtros.estadoInmueble;
  const isEmpty = !cargando && meta.pagination?.total === 0 && !hasFilters;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.titulo}>Negocios</h1>
          {meta.pagination && !isEmpty && <span className={styles.contador}>{meta.pagination.total}</span>}
        </div>

        <Field
          label={
            <span className={styles.labelConIcono}>
              <Search size={13} />
              Buscar
            </span>
          }
        >
          {(p) => <TextInput {...p} value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Unidad, referencia o comprador…" />}
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
          {opciones.estadosInmueble.length > 0 && (
            <Field label="Estado del inmueble">
              {(p) => (
                <Select {...p} value={filtros.estadoInmueble} onChange={(e) => actualizarFiltro('estadoInmueble', e.target.value)}>
                  <option value="">Todos los estados</option>
                  {opciones.estadosInmueble.map((e) => <option key={e} value={e}>{e}</option>)}
                </Select>
              )}
            </Field>
          )}
          {opciones.estados.length > 0 && (
            <Field
              label={
                <span className={styles.labelConIcono}>
                  <CircleDot size={13} />
                  Estado del negocio
                </span>
              }
            >
              {(p) => (
                <Select {...p} value={filtros.estado} onChange={(e) => actualizarFiltro('estado', e.target.value)}>
                  <option value="">Todos los estados</option>
                  {opciones.estados.map((v) => <option key={v} value={v}>{v}</option>)}
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
          <p className={styles.mensajeLista}>{isEmpty ? 'Sin negocios cargados.' : 'Sin resultados para los filtros aplicados.'}</p>
        )}
        {!cargando && (meta.data ?? []).map((n) => <NegocioItem key={n.id} negocio={n} seleccionado={selectedId === n.id} />)}
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
