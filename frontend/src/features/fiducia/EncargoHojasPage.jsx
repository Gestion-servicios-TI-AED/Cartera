// Visor de las hojas crudas del Excel de un encargo -- en el legado
// (FiduciaDetalle.jsx, ruta /fiducia/:id) esta pantalla quedaba huérfana,
// sin ningún link real hacia ella (el click de la lista iba directo a
// EncargoNomenclaturasPage); acá se mantiene como vista secundaria,
// enlazada desde el header de esa página ("Ver hojas del Excel"), en vez de
// perderla del todo.
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BackLink } from '../../components/ui/BackLink.jsx';
import { getEncargo } from '../../api/fiducia.js';
import styles from './EncargoHojasPage.module.css';

export function EncargoHojasPage() {
  const { id } = useParams();
  const [encargo, setEncargo] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    getEncargo(id)
      .then((res) => setEncargo(res.data))
      .finally(() => setCargando(false));
  }, [id]);

  if (cargando) return <p>Cargando…</p>;
  if (!encargo) return <p>No encontrado.</p>;

  return (
    <div className={styles.page}>
      <BackLink to={`/fiducia/${id}`}>{encargo.nombre}</BackLink>
      <h1 className={styles.title}>Hojas del Excel</h1>
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
                  <Link to={`/fiducia/${id}/hojas/${hoja.id}`}>{hoja.nombre_hoja}</Link>
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
