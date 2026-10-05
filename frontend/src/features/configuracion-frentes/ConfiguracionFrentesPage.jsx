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
import styles from './ConfiguracionFrentesPage.module.css';

const TODAS = '(Todas)';

export function ConfiguracionFrentesPage() {
  const [filas, setFilas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [frente, setFrente] = useState('');
  const [torre, setTorre] = useState('');
  const [piso, setPiso] = useState('');
  const [fecha, setFecha] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

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
        <div className={styles.header}>
          <div className={styles.headerRow}>
            <div>
              <h1 className={styles.title}>Fechas de entrega por Frente / Torre / Piso</h1>
              <p className={styles.subtitle}>
                Reemplaza la fecha estimada de la cuota Saldo Contraentrega en el cálculo de conciliación. Los tres niveles son
                mutuamente excluyentes: borra el nivel existente antes de configurar otro para el mismo frente/torre.
              </p>
            </div>
          </div>
        </div>

        <form className={styles.row} onSubmit={handleSubmit}>
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
          <Button type="submit" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar'}
          </Button>
        </form>
        {error && <p className={styles.error}>{error}</p>}

        {cargando ? (
          <p>Cargando…</p>
        ) : filas.length === 0 ? (
          <p className={styles.vacio}>Todavía no hay ninguna fecha de entrega configurada.</p>
        ) : (
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
              {sortedRows.map((fila) => (
                <tr key={`${fila.frente}|${fila.torre ?? ''}|${fila.piso ?? ''}`}>
                  <td>{fila.frente}</td>
                  <td>{fila.torre ?? TODAS}</td>
                  <td>{fila.piso ?? TODAS}</td>
                  <td>{fila.fechaEntrega ?? '—'}</td>
                  <td>
                    {fila.fechaEntrega && (
                      <Button variant="ghost" onClick={() => handleQuitar(fila)}>
                        Quitar
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AccesosLayout>
    </div>
  );
}
