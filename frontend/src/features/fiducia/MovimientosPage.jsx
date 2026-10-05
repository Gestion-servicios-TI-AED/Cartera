// Adaptado de zoho-payment-tracker/frontend/src/pages/FiduciaMovimientos.jsx.
// Ojo: en el legado esta pantalla NO usa el endpoint propio de Fiducia
// (`/api/fiducia/movimientos`, que de hecho queda huérfano -- ninguna
// página lo llama) sino `/api/negocios/movimientos` (getAllNegocioMovimientos):
// todos los movimientos con el contexto de Negocio ya resuelto (Fideicomiso/
// Nomenclatura/Estado/compradores) -- ver negocio.service.js:listMovimientos,
// portado durante la fase de Negocios. Mismos filtros, misma fila expandible
// con el grid completo de campos crudos, y la misma exportación a Excel
// estilizada (ExcelJS -- xlsx/SheetJS no permite estilos en su build libre),
// con el color de marca de Cartera en vez del teal de Baía Kristal.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, X, ChevronRight, Download } from 'lucide-react';
import ExcelJS from 'exceljs';
import { ConceptoHint } from '../../components/ui/ConceptoHint.jsx';
import { Field, TextInput, Select } from '../../components/ui/Field.jsx';
import { Pagination } from '../../components/ui/Pagination.jsx';
import { listMovimientosNegocios, exportMovimientosNegocios } from '../../api/negocios.js';
import { formatExcelDate } from '../../utils/format.js';
import { filtrarKeysMovimiento } from '../../utils/columnasExcluidas.js';
import { descripcionProyecto, obtenerProyecto } from '../../utils/proyectos.js';
import styles from './MovimientosPage.module.css';

function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function formatCOP(val) {
  if (val == null || val === '') return null;
  const n = parseFloat(String(val).replace(/[^0-9.-]/g, ''));
  if (isNaN(n)) return null;
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);
}

function formatCell(key, value) {
  if (value == null || value === '') return null;
  const k = (key || '').toLowerCase();
  if (k.includes('fecha')) {
    const f = formatExcelDate(value);
    return f !== '—' ? f : String(value);
  }
  if (k.includes('valor') || k.includes('monto') || k.includes('saldo') || k.includes('cuota') || k.includes('capital') ||
      k.includes('abono') || k.includes('descuento') || k.includes('credito') || k.includes('crédito') ||
      k.includes('aporte') || k.includes('importe') || k.includes('acreditacion') || k.includes('acreditación') ||
      k.includes('anticipo') || k.includes('canje')) {
    const cop = formatCOP(value);
    return cop !== null ? cop : String(value);
  }
  return String(value);
}

function cleanNombre(nombre) {
  if (!nombre) return null;
  return nombre.replace(/^\d+\s+/, '').replace(/\s*\(\d+\.?\d*%\)\s*$/, '');
}

function shortFideicomiso(raw) {
  if (!raw) return null;
  return String(raw).replace(/^\d+[\s-]+/, '').replace(/^P\.?A\.?\s*/i, '').trim();
}

const PRESETS = [
  { label: 'Último mes', months: 1 },
  { label: 'Últimos 3 meses', months: 3 },
  { label: 'Últimos 6 meses', months: 6 },
  { label: 'Último año', months: 12 },
];

function MovimientoRow({ mov }) {
  const [expanded, setExpanded] = useState(false);
  const datos = mov.datos || {};
  const neg = mov.negocio;

  const fecha = datos['Fecha Contable'] ? formatExcelDate(datos['Fecha Contable']) : null;
  const tipo = datos['Tipo Movimiento'] || datos['Concepto'] || null;
  const valor = datos['Valor'] ? formatCOP(datos['Valor']) : null;

  const compradorPrincipal = cleanNombre(neg?.compradores?.[0]?.nombre);
  const extraCompradores = (neg?.compradores?.length ?? 0) - 1;
  const allFields = filtrarKeysMovimiento(Object.keys(datos));

  return (
    <>
      <tr className={styles.filaClicable} onClick={() => setExpanded((e) => !e)}>
        <td className={styles.colChevron}>
          <ChevronRight size={12} strokeWidth={2.5} className={`${styles.chevronRow} ${expanded ? styles.chevronRowOpen : ''}`} />
        </td>
        <td className={styles.mono}>{mov.referencia}</td>
        <td className={styles.truncSm}>{neg?.fideicomiso ? shortFideicomiso(neg.fideicomiso) : <span className={styles.vacio}>—</span>}</td>
        <td className={styles.nowrap}>{neg?.nomenclatura ?? <span className={styles.vacio}>—</span>}</td>
        <td className={styles.truncMd}>
          {compradorPrincipal ? (
            <>
              {compradorPrincipal}
              {extraCompradores > 0 && <span className={styles.extra}> +{extraCompradores}</span>}
            </>
          ) : <span className={styles.vacio}>—</span>}
        </td>
        <td className={styles.nowrap}>{fecha ?? <span className={styles.vacio}>—</span>}</td>
        <td className={styles.truncMd}>{tipo ?? <span className={styles.vacio}>—</span>}</td>
        <td className={`${styles.nowrap} ${styles.right} ${styles.strong}`}>{valor ?? <span className={styles.vacio}>—</span>}</td>
      </tr>
      {expanded && (
        <tr className={styles.filaExpandida}>
          <td colSpan={8}>
            <div className={styles.gridExpandido}>
              {allFields.map((col) => {
                const v = datos[col];
                const display = v != null && v !== '' ? (formatCell(col, v) ?? String(v)) : null;
                return (
                  <div key={col}>
                    <p className={styles.miniLabel}>
                      {col}
                      <ConceptoHint columna={col} hoja="movimiento" />
                    </p>
                    <p className={styles.miniValor}>{display ?? <span className={styles.vacio}>—</span>}</p>
                  </div>
                );
              })}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function MovimientosPage() {
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [exportando, setExportando] = useState(false);

  const [search, setSearch] = useState('');
  const [fideicomisoFilter, setFideicomisoFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [tipoMovFilter, setTipoMovFilter] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [datePreset, setDatePreset] = useState('');

  const debouncedSearch = useDebounce(search);
  const filtrosRef = useRef({});
  filtrosRef.current = { debouncedSearch, fideicomisoFilter, estadoFilter, tipoMovFilter, fechaDesde, fechaHasta };

  const cargar = useCallback((p = 1) => {
    const { debouncedSearch: s, fideicomisoFilter: f, estadoFilter: e, tipoMovFilter: tm, fechaDesde: fd, fechaHasta: fh } = filtrosRef.current;
    setCargando(true);
    listMovimientosNegocios({ search: s, fideicomiso: f, estado: e, tipoMovimiento: tm, fechaDesde: fd, fechaHasta: fh, page: p, limit: 50 })
      .then((res) => { setResultado(res.data); setPagina(p); })
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => { cargar(1); }, [debouncedSearch, fideicomisoFilter, estadoFilter, tipoMovFilter, fechaDesde, fechaHasta, cargar]);

  function clearAll() {
    setSearch(''); setFideicomisoFilter(''); setEstadoFilter(''); setTipoMovFilter(''); setFechaDesde(''); setFechaHasta(''); setDatePreset('');
  }
  const hasFilters = search || fideicomisoFilter || estadoFilter || tipoMovFilter || fechaDesde || fechaHasta;

  async function handleExport() {
    const { debouncedSearch: s, fideicomisoFilter: f, estadoFilter: e, tipoMovFilter: tm, fechaDesde: fd, fechaHasta: fh } = filtrosRef.current;
    setExportando(true);
    try {
      const res = await exportMovimientosNegocios({ search: s, fideicomiso: f, estado: e, tipoMovimiento: tm, fechaDesde: fd, fechaHasta: fh });
      const rows = res.data?.data || [];
      if (rows.length === 0) return;

      const datosKeys = [];
      const seen = new Set();
      for (const mov of rows) {
        for (const k of filtrarKeysMovimiento(Object.keys(mov.datos || {}))) {
          if (!seen.has(k)) { seen.add(k); datosKeys.push(k); }
        }
      }

      const headers = ['Referencia', 'Proyecto', 'Nomenclatura', 'Comprador(es)', 'Cédula(s)', 'Estado negocio', ...datosKeys];
      const excelRows = rows.map((mov) => {
        const neg = mov.negocio;
        const compradores = (neg?.compradores || []).map((c) => cleanNombre(c.nombre)).filter(Boolean).join(' | ');
        const cedulas = (neg?.compradores || []).map((c) => c.nroId || '').filter(Boolean).join(' | ');
        const fila = [
          mov.referencia ?? '',
          neg?.fideicomiso ? shortFideicomiso(neg.fideicomiso) : '',
          neg?.nomenclatura ?? '',
          compradores,
          cedulas,
          neg?.estado ?? '',
        ];
        const datos = mov.datos || {};
        for (const k of datosKeys) {
          const v = datos[k];
          fila.push(v != null && v !== '' ? (formatCell(k, v) ?? String(v)) : '');
        }
        return fila;
      });

      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Movimientos');
      ws.addRow(headers);
      excelRows.forEach((fila) => ws.addRow(fila));

      const headerRow = ws.getRow(1);
      headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF232BED' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        cell.alignment = { vertical: 'middle' };
      });
      headerRow.height = 20;

      headers.forEach((h, i) => {
        let maxLen = h.length;
        for (const fila of excelRows) {
          const len = String(fila[i] ?? '').length;
          if (len > maxLen) maxLen = len;
        }
        ws.getColumn(i + 1).width = Math.min(Math.max(maxLen + 4, 12), 60);
      });
      ws.views = [{ state: 'frozen', ySplit: 1 }];
      ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: headers.length } };

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fecha = new Date().toISOString().slice(0, 10);
      a.download = `movimientos-fiduciarios-${fecha}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      window.alert(`Error al exportar los movimientos: ${err.message}`);
    } finally {
      setExportando(false);
    }
  }

  const pagination = resultado?.pagination;
  const movimientos = resultado?.data || [];
  const fideicomisos = [...(resultado?.fideicomisos || [])].sort((a, b) => {
    const matchA = String(a).match(/^(\d{4,6})/);
    const matchB = String(b).match(/^(\d{4,6})/);
    const etapaA = matchA ? obtenerProyecto(matchA[1])?.etapa : null;
    const etapaB = matchB ? obtenerProyecto(matchB[1])?.etapa : null;
    if (etapaA != null && etapaB != null) return parseInt(etapaA, 10) - parseInt(etapaB, 10);
    if (etapaA != null) return -1;
    if (etapaB != null) return 1;
    const labelA = (matchA && descripcionProyecto(matchA[1])) || shortFideicomiso(a);
    const labelB = (matchB && descripcionProyecto(matchB[1])) || shortFideicomiso(b);
    return String(labelA).localeCompare(String(labelB), 'es');
  });
  const estados = resultado?.estados || [];
  const tiposMov = resultado?.tiposMovimiento || [];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Movimientos Fiduciarios</h1>
        {pagination && <span className={styles.contador}>{pagination.total.toLocaleString('es-CO')} movimientos</span>}
        <button type="button" className={styles.botonExportar} onClick={handleExport} disabled={exportando || !pagination || pagination.total === 0}>
          <Download size={14} />
          {exportando ? 'Exportando…' : 'Exportar'}
        </button>
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
            {(p) => <TextInput {...p} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Referencia, comprador, cédula, ID movimiento o nomenclatura…" />}
          </Field>
          {fideicomisos.length > 0 && (
            <Field className={styles.fieldMd} label="Proyecto / Fideicomiso">
              {(p) => (
                <Select {...p} value={fideicomisoFilter} onChange={(e) => setFideicomisoFilter(e.target.value)}>
                  <option value="">Todos los proyectos</option>
                  {fideicomisos.map((f) => {
                    const match = String(f).match(/^(\d{4,6})/);
                    const desc = match ? descripcionProyecto(match[1]) : null;
                    return <option key={f} value={f}>{desc || shortFideicomiso(f)}</option>;
                  })}
                </Select>
              )}
            </Field>
          )}
          {estados.length > 0 && (
            <Field className={styles.fieldSm} label="Estado negocio">
              {(p) => (
                <Select {...p} value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)}>
                  <option value="">Todos los estados</option>
                  {estados.map((e) => <option key={e} value={e}>{e}</option>)}
                </Select>
              )}
            </Field>
          )}
        </div>

        {tiposMov.length > 0 && (
          <div className={styles.filtrosFila}>
            <Field className={styles.fieldMd} label="Tipo movimiento">
              {(p) => (
                <Select {...p} value={tipoMovFilter} onChange={(e) => setTipoMovFilter(e.target.value)}>
                  <option value="">Todos los tipos</option>
                  {tiposMov.map((t) => <option key={t} value={t}>{t}</option>)}
                </Select>
              )}
            </Field>
          </div>
        )}

        <div className={styles.filtrosFila}>
          <Field className={styles.fieldFecha} label="Fecha contable desde">
            {(p) => <TextInput {...p} type="date" value={fechaDesde} onChange={(e) => { setFechaDesde(e.target.value); setDatePreset(''); }} />}
          </Field>
          <Field className={styles.fieldFecha} label="Fecha contable hasta">
            {(p) => <TextInput {...p} type="date" value={fechaHasta} onChange={(e) => { setFechaHasta(e.target.value); setDatePreset(''); }} />}
          </Field>
          <div className={styles.presets}>
            {PRESETS.map(({ label, months }) => (
              <button
                key={months}
                type="button"
                className={`${styles.presetBoton} ${datePreset === String(months) ? styles.presetActivo : ''}`}
                onClick={() => {
                  const now = new Date();
                  const hasta = now.toISOString().slice(0, 10);
                  const desde = new Date(now.getFullYear(), now.getMonth() - months, now.getDate()).toISOString().slice(0, 10);
                  setFechaDesde(desde);
                  setFechaHasta(hasta);
                  setDatePreset(String(months));
                }}
              >
                {label}
              </button>
            ))}
          </div>
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
          <p className={styles.vacioTexto}>{hasFilters ? 'Ajusta los filtros para ver resultados.' : 'Sincroniza los datos desde el módulo Negocios.'}</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.colChevron} />
                <th><span className={styles.thConcepto}>Referencia<ConceptoHint columna="Referencia" hoja="movimiento" /></span></th>
                <th><span className={styles.thConcepto}>Proyecto<ConceptoHint columna="Fideicomiso" hoja="movimiento" /></span></th>
                <th><span className={styles.thConcepto}>Nomenclatura<ConceptoHint columna="Nomenclatura" hoja="movimiento" /></span></th>
                <th><span className={styles.thConcepto}>Comprador<ConceptoHint columna="Propietario" hoja="movimiento" /></span></th>
                <th><span className={styles.thConcepto}>Fecha contable<ConceptoHint columna="Fecha Contable" hoja="movimiento" /></span></th>
                <th><span className={styles.thConcepto}>Tipo movimiento<ConceptoHint columna="Tipo Movimiento" hoja="movimiento" /></span></th>
                <th className={styles.right}><span className={styles.thConcepto}>Valor<ConceptoHint columna="Valor" hoja="movimiento" /></span></th>
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
