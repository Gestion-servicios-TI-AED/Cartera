// Hojas crudas de un Excel de Oliv subido -- calcada de
// fiducia/EncargoHojasPage.jsx (Baía Kristal). A diferencia de Baía Kristal
// (donde clickear un encargo va primero a una página de Nomenclaturas, que
// cruza con Negocio), acá esta es la página directa al clickear un encargo
// en la lista -- no hay todavía reglas para cruzar estos movimientos con un
// Negocio de Oliv (columnas aún no definidas).
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BackLink } from '../../components/ui/BackLink.jsx';
import { getEncargoOliv } from '../../api/oliv.js';
import styles from '../fiducia/EncargoHojasPage.module.css';

export function OlivEncargoHojasPage() {
  const { id } = useParams();
  const [encargo, setEncargo] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    getEncargoOliv(id)
      .then((res) => setEncargo(res.data))
      .finally(() => setCargando(false));
  }, [id]);

  if (cargando) return <p>Cargando…</p>;
  if (!encargo) return <p>No encontrado.</p>;

  return (
    <div className={styles.page}>
      <BackLink to="/oliv/encargos">Encargos de Oliv</BackLink>
      <h1 className={styles.title}>{encargo.nombre}</h1>
      <p className={styles.subtitle}>
        Código: {encargo.codigo ?? '—'} — Archivo: {encargo.archivo_nombre}
      </p>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Hoja</th>
              <th>Filas</th>
            </tr>
          </thead>
          <tbody>
            {(encargo.hojas ?? []).map((hoja) => (
              <tr key={hoja.id}>
                <td>
                  <Link to={`/oliv/encargos/${id}/hojas/${hoja.id}`}>{hoja.nombre_hoja}</Link>
                </td>
                <td>{hoja.total_filas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
