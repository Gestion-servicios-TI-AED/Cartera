// Primer módulo de negocio migrado (piloto). La lista se enriquece con el
// árbol completo de frentes/torres/pisos del Inventario ya migrado (ver
// configuracionFrente.service.js) -- una fila por cada combinación real,
// tenga o no fecha configurada todavía. Vive en Accesos ("Fechas de
// entrega", ver AccesosLayout.jsx) -- no en NAV_GROUPS, es configuración de
// uso ocasional, no una pantalla operativa de uso diario.
import { useEffect, useMemo, useState } from 'react';
import { AccesosLayout } from '../../components/layout/AccesosLayout.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Field, TextInput } from '../../components/ui/Field.jsx';
import { SortHeader } from '../../components/ui/SortHeader.jsx';
import { useSortableTable, ariaSort } from '../../hooks/useSortableTable.js';
import {
  listConfiguracionesFrente,
  actualizarFechaProyecto,
  actualizarFechaTorre,
  actualizarFechaPiso,
} from '../../api/configuracionesFrentes.js';
import { Pagination } from '../../components/ui/Pagination.jsx';
import styles from '../accesos/Usuarios.module.css';

const TODAS = '(Todas)';
const PAGE_SIZE = 20;

export function ConfiguracionFrentesPage() {
  const [filas, setFilas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [frente, setFrente] = useState('');
  const [torre, setTorre] = useState('');
  const [piso, setPiso] = useState('');
  const [fecha, setFecha] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  async function cargar() {
    setCargando(true);
    try {
      const res = await listConfiguracionesFrente();
      setFilas(res.data);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  const valueGetters = useMemo(
    () => ({
      frente: (f) => f.frente,
      torre: (f) => f.torre ?? '',
      piso: (f) => f.piso ?? '',
      fechaEntrega: (f) => f.fechaEntrega ?? '',
    }),
    []
  );
  const { sortedRows, sort, toggleSort } = useSortableTable(filas, valueGetters);
  const visibles = sortedRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!frente.trim()) {
      setError('El frente es obligatorio');
      return;
    }
    if (!torre.trim() && piso.trim()) {
      setError('No puedes fijar un piso sin indicar la torre');
      return;
    }
    setGuardando(true);
    try {
      const fechaEntrega = fecha || null;
      if (torre.trim() && piso.trim()) {
        await actualizarFechaPiso(frente.trim(), torre.trim(), piso.trim(), fechaEntrega);
      } else if (torre.trim()) {
        await actualizarFechaTorre(frente.trim(), torre.trim(), fechaEntrega);
      } else {
        await actualizarFechaProyecto(frente.trim(), fechaEntrega);
      }
      setFrente('');
      setTorre('');
      setPiso('');
      setFecha('');
      await cargar();
    } catch (err) {
      setError(err.message ?? 'No se pudo guardar la configuración');
    } finally {
      setGuardando(false);
    }
  }

  async function handleQuitar(fila) {
    setError(null);
    try {
      if (fila.torre && fila.piso) {
        await actualizarFechaPiso(fila.frente, fila.torre, fila.piso, null);
      } else if (fila.torre) {
        await actualizarFechaTorre(fila.frente, fila.torre, null);
      } else {
        await actualizarFechaProyecto(fila.frente, null);
      }
      await cargar();
    } catch (err) {
      setError(err.message ?? 'No se pudo quitar la fecha');
    }
  }

  return (
    <div className={styles.page}>
      <AccesosLayout>
        <div className={styles.listHeader}>
          <div>
            <h1 className={styles.title}>Fechas de entrega</h1>
            <p className={styles.subtitle}>
              Por frente, torre y piso. Reemplaza la fecha estimada de la cuota Saldo Contraentrega en el cálculo de conciliación. Los tres niveles son
              mutuamente excluyentes: borra el nivel existente antes de configurar otro para el mismo frente/torre.
            </p>
          </div>
        </div>

        <form className={styles.sectionCard} onSubmit={handleSubmit}>
          <div>
            <h2 className={styles.sectionTitle}>Configurar una fecha</h2>
            <p className={styles.sectionHint}>Deja torre y piso vacíos para todo el frente; solo el piso vacío para toda la torre.</p>
          </div>
          <div className={styles.row}>
            <Field className={styles.fieldMd} label="Frente" required>
              {(p) => <TextInput {...p} value={frente} onChange={(e) => setFrente(e.target.value)} placeholder="Ej. Kala" />}
            </Field>
            <Field className={styles.fieldMd} label="Torre" helper="Vacío = todo el frente">
              {(p) => <TextInput {...p} value={torre} onChange={(e) => setTorre(e.target.value)} placeholder="Ej. 1" />}
            </Field>
            <Field className={styles.fieldMd} label="Piso" helper="Vacío = toda la torre">
              {(p) => <TextInput {...p} value={piso} onChange={(e) => setPiso(e.target.value)} placeholder="Ej. 3" />}
            </Field>
            <Field className={styles.fieldMd} label="Fecha de entrega" helper="Vacío = quitar fecha">
              {(p) => <TextInput {...p} type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />}
            </Field>
          </div>
          <div className={styles.actions}>
            <span />
            <div className={styles.actionsEnd}>
              <Button type="submit" variant="primary" disabled={guardando}>
                {guardando ? 'Guardando…' : 'Guardar'}
              </Button>
            </div>
          </div>
        </form>

        {error && (
          <div className={styles.errorBanner} role="alert">
            {error}
          </div>
        )}

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th aria-sort={ariaSort(sort, 'frente')}>
                  <SortHeader label="Frente" sortKey="frente" sort={sort} onSort={toggleSort} />
                </th>
                <th aria-sort={ariaSort(sort, 'torre')}>
                  <SortHeader label="Torre" sortKey="torre" sort={sort} onSort={toggleSort} />
                </th>
                <th aria-sort={ariaSort(sort, 'piso')}>
                  <SortHeader label="Piso" sortKey="piso" sort={sort} onSort={toggleSort} />
                </th>
                <th aria-sort={ariaSort(sort, 'fechaEntrega')}>
                  <SortHeader label="Fecha de entrega" sortKey="fechaEntrega" sort={sort} onSort={toggleSort} />
                </th>
                <th />
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={5} className={styles.emptyState}>
                    Cargando...
                  </td>
                </tr>
              ) : filas.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.emptyState}>
                    Todavía no hay ninguna fecha de entrega configurada.
                  </td>
                </tr>
              ) : (
                visibles.map((fila) => (
                  <tr key={`${fila.frente}|${fila.torre ?? ''}|${fila.piso ?? ''}`}>
                    <td>{fila.frente}</td>
                    <td>{fila.torre ?? TODAS}</td>
                    <td>{fila.piso ?? TODAS}</td>
                    <td className={fila.fechaEntrega ? styles.dateCell : `${styles.dateCell} ${styles.muted}`}>{fila.fechaEntrega ?? '—'}</td>
                    <td>
                      {fila.fechaEntrega && (
                        <Button variant="secondary" onClick={() => handleQuitar(fila)}>
                          Quitar
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {!cargando && filas.length > 0 && <Pagination page={page} pageSize={PAGE_SIZE} total={filas.length} onPageChange={setPage} />}
        </div>
      </AccesosLayout>
    </div>
  );
}
