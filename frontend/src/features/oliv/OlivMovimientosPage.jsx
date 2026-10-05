// Lista global de movimientos importados de los Excel de Oliv. Cada fila
// ya trae Propietario/Encargo/Concepto/Valor como columnas directas
// (columnas conocidas del Excel real "Saldos Acumulados por Concepto y
// Unidad", ver backend/olivEncargo.service.js) y el Inmueble vinculado --
// cruzado por esa misma columna Encargo (= Referencia de Recaudo) contra la
// Oportunidad y de ahí a la Unidad de HubSpot. Pedido explícito del usuario
// (2026-09-14): "la idea es que el movimiento te diga todo específicamente";
// columna Encargo agregada aparte (mismo día) porque antes solo se usaba
// internamente para el cruce con Inmueble, sin mostrarse. Propietario e
// Inmueble enlazan AMBOS al mismo Negocio (mov.negocioId, mismo día: "que
// vincule el propietario del negocio [...] igual que vincula el
// inmueble") -- Propietario enlaza siempre que haya negocio (incluso sin
// inmueble vinculado en HubSpot todavía), Inmueble solo cuando además hay
// unidad resuelta.
// Al expandir una fila se sigue viendo el resto de columnas crudas del
// Excel (Identificación, Estado, Valor de la unidad, etc.), con separadores
// de miles cuando el nombre de columna sugiere que es plata (ver
// utils/formatCelda.js) -- antes se mostraban sin ningún formato.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, ChevronRight } from 'lucide-react';
import { Field, TextInput, Select } from '../../components/ui/Field.jsx';
import { Pagination } from '../../components/ui/Pagination.jsx';
import { listMovimientosOliv } from '../../api/oliv.js';
import { formatCOP, formatDate } from '../../utils/format.js';
import { formatCelda } from '../../utils/formatCelda.js';
import styles from '../fiducia/MovimientosPage.module.css';

function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function MovimientoRow({ mov }) {
  const [expanded, setExpanded] = useState(false);
  const datos = mov.datos || {};
  const campos = Object.keys(datos);

  return (
    <>
      <tr className={styles.filaClicable} onClick={() => setExpanded((e) => !e)}>
        <td className={styles.colChevron}>
          <ChevronRight size={12} strokeWidth={2.5} className={`${styles.chevronRow} ${expanded ? styles.chevronRowOpen : ''}`} />
        </td>
        <td className={styles.nowrap}>{mov.fecha ? formatDate(mov.fecha) : <span className={styles.vacio}>—</span>}</td>
        <td className={styles.truncMd}>
          {mov.propietario ? (
            mov.negocioId ? (
              <Link to={`/oliv/negocios/${mov.negocioId}`} onClick={(e) => e.stopPropagation()}>{mov.propietario}</Link>
            ) : (
              mov.propietario
            )
          ) : (
            <span className={styles.vacio}>—</span>
          )}
        </td>
        <td className={styles.nowrap}>{mov.referencia ?? <span className={styles.vacio}>—</span>}</td>
        <td className={styles.truncSm}>{mov.concepto ?? <span className={styles.vacio}>—</span>}</td>
        <td className={`${styles.nowrap} ${styles.right} ${styles.strong}`}>{mov.valor != null ? formatCOP(mov.valor) : <span className={styles.vacio}>—</span>}</td>
        <td className={styles.nowrap}>
          {mov.inmueble ? (
            <Link to={`/oliv/negocios/${mov.negocioId}`} onClick={(e) => e.stopPropagation()}>
              {mov.inmueble.codigoUnidad ?? mov.inmueble.torre ?? 'Ver negocio'}
            </Link>
          ) : (
            <span className={styles.vacio}>—</span>
          )}
        </td>
      </tr>
      {expanded && (
        <tr className={styles.filaExpandida}>
          <td colSpan={7}>
            {campos.length === 0 ? (
              <p className={styles.vacio}>Esta fila no trae ningún dato.</p>
            ) : (
              <div className={styles.gridExpandido}>
                {campos.map((col) => {
                  const display = formatCelda(col, datos[col]);
                  return (
                    <div key={col}>
                      <p className={styles.miniLabel}>{col}</p>
                      <p className={styles.miniValor}>{display ?? <span className={styles.vacio}>—</span>}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

export function OlivMovimientosPage() {
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [pagina, setPagina] = useState(1);

  const [search, setSearch] = useState('');
  const [hojaFilter, setHojaFilter] = useState('');

  const debouncedSearch = useDebounce(search);
  const filtrosRef = useRef({});
  filtrosRef.current = { debouncedSearch, hojaFilter };

  const cargar = useCallback((p = 1) => {
    const { debouncedSearch: s, hojaFilter: h } = filtrosRef.current;
    setCargando(true);
    listMovimientosOliv({ search: s, hoja: h, page: p, limit: 50 })
      .then((res) => { setResultado(res.data); setPagina(p); })
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => { cargar(1); }, [debouncedSearch, hojaFilter, cargar]);

  function clearAll() {
    setSearch('');
    setHojaFilter('');
  }
  const hasFilters = search || hojaFilter;

  const pagination = resultado?.pagination;
  const movimientos = resultado?.data || [];
  const hojas = resultado?.hojas || [];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Movimientos de Oliv</h1>
        {pagination && <span className={styles.contador}>{pagination.total.toLocaleString('es-CO')} movimientos</span>}
      </div>

      <div className={styles.filtrosCard}>
        <div className={styles.filtrosFila}>
          <Field
            className={styles.fieldBuscar}
            label={
              <span className={styles.labelConIcono}>
                <Search size={13} />
                Buscar
              </span>
            }
          >
            {(p) => <TextInput {...p} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Propietario o cualquier dato de la fila…" />}
          </Field>
          {hojas.length > 0 && (
            <Field className={styles.fieldMd} label="Hoja">
              {(p) => (
                <Select {...p} value={hojaFilter} onChange={(e) => setHojaFilter(e.target.value)}>
                  <option value="">Todas las hojas</option>
                  {hojas.map((h) => <option key={h} value={h}>{h}</option>)}
                </Select>
              )}
            </Field>
          )}
          {hasFilters && (
            <button type="button" className={styles.limpiar} onClick={clearAll}>
              <X size={13} /> Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {cargando && !resultado ? (
        <p className={styles.cargando}>Cargando…</p>
      ) : movimientos.length === 0 ? (
        <div className={styles.vacioEstado}>
          <p className={styles.vacioTitulo}>Sin movimientos</p>
          <p className={styles.vacioTexto}>{hasFilters ? 'Ajusta los filtros para ver resultados.' : 'Sube un Excel en Encargos para importar movimientos.'}</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.colChevron} />
                <th>Fecha</th>
                <th>Propietario</th>
                <th>Encargo</th>
                <th>Concepto</th>
                <th className={styles.right}>Valor</th>
                <th>Inmueble</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((mov) => <MovimientoRow key={mov.id} mov={mov} />)}
            </tbody>
          </table>

          {pagination && (
            <Pagination page={pagina} pageSize={pagination.limit} total={pagination.total} onPageChange={cargar} />
          )}
        </div>
      )}
    </div>
  );
}
