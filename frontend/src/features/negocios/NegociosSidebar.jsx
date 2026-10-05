// Panel izquierdo del maestro-detalle de Negocios (ver NegociosPage.jsx) --
// header con contador+exportar+reconstruir, filtros (búsqueda, Estado,
// Etapa→Frente→Torre en cascada, Solo con abonos, Solo con movimientos) y la
// lista de negocios/inmuebles, cada uno enlazando a `/negocios/:id`. Mismo
// contenido y comportamiento que el panel izquierdo de
// zoho-payment-tracker/frontend/src/pages/Negocios.jsx.
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, CircleDot, Layers, MapPin, Building, Wallet, History, Download, RefreshCw } from 'lucide-react';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Field, TextInput, Select } from '../../components/ui/Field.jsx';
import { InfoTooltip } from '../../components/ui/InfoTooltip.jsx';
import { usePersistentState } from '../../hooks/usePersistentState.js';
import { listNegocios, iniciarBackfillNegocios, getBackfillStatusNegocios } from '../../api/negocios.js';
import { estadoToken } from '../../utils/estados.js';
import { etiquetaEtapa } from '../../utils/etapas.js';
import { exportNegociosCsv, exportNegociosExcel, exportNegociosPdf } from './negociosExport.js';
import styles from './NegociosSidebar.module.css';

function formatSaldoCompact(val) {
  if (val == null || val === '') return null;
  const n = parseFloat(String(val).replace(/[^0-9.-]/g, ''));
  if (isNaN(n) || n === 0) return null;
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n)}`;
}

function getSaldoActual(datos) {
  if (!datos) return null;
  if (datos['Saldo Actual'] != null && datos['Saldo Actual'] !== '') return datos['Saldo Actual'];
  return null;
}

function cleanNombre(nombre) {
  if (!nombre) return null;
  return nombre.replace(/^\d+\s+/, '').replace(/\s*\(\d+\.?\d*%\)\s*$/, '');
}

function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function ExportMenu({ onExport, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function close(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const options = [
    { label: 'Excel (.xlsx)', fmt: 'xlsx' },
    { label: 'CSV', fmt: 'csv' },
    { label: 'PDF', fmt: 'pdf' },
  ];

  return (
    <div className={styles.exportWrap} ref={ref}>
      <button type="button" className={styles.iconButton} title="Exportar" onClick={() => setOpen((o) => !o)} disabled={disabled}>
        <Download size={13} />
      </button>
      {open && (
        <div className={styles.exportMenu}>
          {options.map(({ label, fmt }) => (
            <button key={fmt} className={styles.exportOption} onClick={() => { setOpen(false); onExport(fmt); }}>
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function NegocioItem({ negocio, seleccionado }) {
  const compradorPrincipal = cleanNombre(negocio.compradores?.[0]?.nombre);
  const extra = (negocio.compradores?.length ?? 0) - 1;
  const nomenclatura = negocio.datos?.Nomenclatura;
  const saldo = formatSaldoCompact(getSaldoActual(negocio.datos) ?? negocio.saldoActual);
  const saldoNum = saldo ? parseFloat(String(getSaldoActual(negocio.datos) ?? negocio.saldoActual).replace(/[^0-9.-]/g, '')) : null;

  return (
    <Link to={`/negocios/${negocio.id}`} className={`${styles.item} ${seleccionado ? styles.itemSeleccionado : ''}`}>
      {seleccionado && <span className={styles.itemBarra} aria-hidden="true" />}
      <div className={styles.itemRow}>
        <div className={styles.itemInfo}>
          <p className={styles.itemTitulo}>{negocio.projectCode || (nomenclatura ? `Apto ${nomenclatura}` : negocio.referencia) || negocio.id}</p>
          {negocio.proyectoTorre && <p className={styles.itemSub}>{negocio.proyectoTorre} · {etiquetaEtapa(negocio.etapa)}</p>}
          {compradorPrincipal && (
            <p className={styles.itemSub}>
              {compradorPrincipal}
              {extra > 0 && <span className={styles.itemExtra}> +{extra}</span>}
            </p>
          )}
        </div>
        <div className={styles.itemMeta}>
          {negocio.estado && <Badge variant={estadoToken(negocio.estado)}>{negocio.estado}</Badge>}
          {!negocio.tieneNegocio && <Badge variant="neutral">Sin negocio</Badge>}
          {saldo && <span className={`${styles.itemSaldo} ${saldoNum > 0 ? styles.itemSaldoPositivo : ''}`}>{saldo}</span>}
        </div>
      </div>
    </Link>
  );
}

export function NegociosSidebar({ selectedId, onDatosCargados }) {
  const [filtros, setFiltros] = usePersistentState('negocios-list:filtros', {
    search: '', estado: '', etapa: '', frente: '', torre: '', saldoPendiente: false, conMovimientos: false,
  });
  const [pagina, setPagina] = usePersistentState('negocios-list:pagina', 1);
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [corriendo, setCorriendo] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [searchInput, setSearchInput] = useState(filtros.search);
  const debouncedSearch = useDebounce(searchInput);

  // Las opciones de los filtros (estados/etapas/frentes/torres) solo vienen
  // en la respuesta cuando NO hay filtros activos -- se guardan aparte y
  // solo se pisan cuando llegan, para que el selector no se vacíe al
  // aplicar un filtro (mismo criterio que el legado).
  const [opciones, setOpciones] = useState({
    estados: [], etapasDisponibles: [], frentesDisponibles: [], frentesPorEtapa: {}, torresPorFrente: {}, torresPorEtapaFrente: {},
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
      const res = await listNegocios({ ...filtros, page: pagina, limit: 50 });
      setResultado(res.data);
      setOpciones((prev) => ({
        estados: res.data.estados ?? prev.estados,
        etapasDisponibles: res.data.etapasDisponibles ?? prev.etapasDisponibles,
        frentesDisponibles: res.data.frentesDisponibles ?? prev.frentesDisponibles,
        frentesPorEtapa: res.data.frentesPorEtapa ?? prev.frentesPorEtapa,
        torresPorFrente: res.data.torresPorFrente ?? prev.torresPorFrente,
        torresPorEtapaFrente: res.data.torresPorEtapaFrente ?? prev.torresPorEtapaFrente,
      }));
      const sinFiltros = !filtros.search && !filtros.estado && !filtros.etapa && !filtros.frente && !filtros.torre && !filtros.saldoPendiente && !filtros.conMovimientos;
      onDatosCargados?.({ isEmpty: res.data.total === 0 && sinFiltros });
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros.search, filtros.estado, filtros.etapa, filtros.frente, filtros.torre, filtros.saldoPendiente, filtros.conMovimientos, pagina]);

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

  async function handleBackfill() {
    setCorriendo(true);
    await iniciarBackfillNegocios();
    const interval = setInterval(async () => {
      const res = await getBackfillStatusNegocios();
      if (!res.data.running) {
        clearInterval(interval);
        setCorriendo(false);
        cargar();
      }
    }, 2000);
  }

  async function handleExport(fmt) {
    setExportando(true);
    try {
      const res = await listNegocios({ ...filtros, page: 1, limit: 9999 });
      const date = new Date().toISOString().slice(0, 10);
      const base = `negocios-${date}`;
      if (fmt === 'xlsx') exportNegociosExcel(res.data.data, `${base}.xlsx`);
      else if (fmt === 'pdf') exportNegociosPdf(res.data.data, `${base}.pdf`);
      else exportNegociosCsv(res.data.data, `${base}.csv`);
    } finally {
      setExportando(false);
    }
  }

  function clearFilters() {
    setSearchInput('');
    setFiltros({ search: '', estado: '', etapa: '', frente: '', torre: '', saldoPendiente: false, conMovimientos: false });
    setPagina(1);
  }

  const meta = resultado ?? {};
  const hasFilters = filtros.search || filtros.estado || filtros.etapa || filtros.frente || filtros.torre || filtros.saldoPendiente || filtros.conMovimientos;
  const isEmpty = !cargando && meta.total === 0 && !hasFilters;
  const frenteOptions = filtros.etapa ? (opciones.frentesPorEtapa?.[filtros.etapa] || []) : (opciones.frentesDisponibles ?? []);
  const torreOptions = filtros.frente
    ? (filtros.etapa ? (opciones.torresPorEtapaFrente?.[`${filtros.etapa}||${filtros.frente}`] || []) : (opciones.torresPorFrente?.[filtros.frente] || []))
    : [];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.titulo}>Negocios</h1>
          {meta.total !== undefined && !isEmpty && <span className={styles.contador}>{meta.total}</span>}
          <ExportMenu onExport={handleExport} disabled={exportando || cargando} />
          <button type="button" className={styles.iconButton} title="Reconstruir desde Fiducia" onClick={handleBackfill} disabled={corriendo}>
            <RefreshCw size={13} className={corriendo ? styles.spin : ''} />
          </button>
        </div>

        <Field
          label={
            <span className={styles.labelConIcono}>
              <Search size={13} />
              Buscar
              <InfoTooltip text="Busca por referencia, nomenclatura, nombre del comprador o número de cédula." />
            </span>
          }
        >
          {(p) => <TextInput {...p} value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Ref., nomenclatura, comprador o cédula…" />}
        </Field>

        <div className={styles.filtrosGrid}>
          {opciones.estados.length > 0 && (
            <Field
              label={
                <span className={styles.labelConIcono}>
                  <CircleDot size={13} />
                  Estado del negocio
                  <InfoTooltip text="Filtra según la situación del negocio: al día, en proceso, pendiente o cancelado." />
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
          {opciones.etapasDisponibles.length > 0 && (
            <Field
              label={
                <span className={styles.labelConIcono}>
                  <Layers size={13} />
                  Etapa
                  <InfoTooltip text="Filtra por la etapa del inmueble asociado al negocio. Los proyectos sin etapa numerada y los negocios sin inmueble asociado (Sin proyecto) se agrupan aparte." />
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
                  <InfoTooltip text="Filtra por el proyecto/desarrollo del inmueble asociado al negocio. Si hay una Etapa elegida, solo se muestran los frentes de esa etapa. Los negocios sin inmueble asociado no aparecen al filtrar por un Frente específico." />
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
                  <InfoTooltip text="Filtra por la torre del Frente seleccionado." />
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
        </div>

        <button type="button" className={`${styles.toggle} ${filtros.saldoPendiente ? styles.toggleActivo : ''}`} onClick={() => actualizarFiltro('saldoPendiente', !filtros.saldoPendiente)}>
          <Wallet size={13} />
          Solo con abonos
          <InfoTooltip text="Muestra únicamente los negocios que ya registran al menos un abono." />
        </button>
        <button type="button" className={`${styles.toggle} ${filtros.conMovimientos ? styles.toggleActivo : ''}`} onClick={() => actualizarFiltro('conMovimientos', !filtros.conMovimientos)}>
          <History size={13} />
          Solo con movimientos
          <InfoTooltip text="Muestra únicamente los inmuebles/negocios que tienen al menos un movimiento registrado." />
        </button>

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

      {meta.total > 0 && (
        <div className={styles.paginacion}>
          <Button variant="ghost" disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)}>← Ant.</Button>
          <span className={styles.paginacionTexto}>{pagina}/{Math.max(1, Math.ceil(meta.total / 50))}</span>
          <Button variant="ghost" disabled={pagina >= Math.ceil(meta.total / 50)} onClick={() => setPagina((p) => p + 1)}>Sig. →</Button>
        </div>
      )}
    </aside>
  );
}
