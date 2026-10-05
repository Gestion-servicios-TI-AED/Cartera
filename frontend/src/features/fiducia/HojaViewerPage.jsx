import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BackLink } from '../../components/ui/BackLink.jsx';
import { Pagination } from '../../components/ui/Pagination.jsx';
import { getHoja } from '../../api/fiducia.js';
import { formatCelda } from '../../utils/formatCelda.js';
import styles from './HojaViewerPage.module.css';

export function HojaViewerPage() {
  const { id, hojaId } = useParams();
  const [hoja, setHoja] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    getHoja(id, hojaId, { page: pagina, limit: 200 })
      .then((res) => setHoja(res.data))
      .finally(() => setCargando(false));
  }, [id, hojaId, pagina]);

  if (cargando && !hoja) return <p>Cargando…</p>;
  if (!hoja) return <p>No encontrada.</p>;

  return (
    <div className={styles.page}>
      <BackLink to={`/fiducia/${id}/hojas`}>Hojas del Excel</BackLink>
      <h1 className={styles.title}>{hoja.nombreHoja}</h1>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {hoja.columnas.map((c, i) => <th key={i}>{c || `Col ${i + 1}`}</th>)}
            </tr>
          </thead>
          <tbody>
            {hoja.filas.map((fila, i) => (
              <tr key={i}>
                {hoja.columnas.map((col, ci) => <td key={ci}>{formatCelda(col, fila[ci]) ?? '—'}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hoja.pagination && (
        <Pagination page={pagina} pageSize={hoja.pagination.limit} total={hoja.pagination.total} onPageChange={setPagina} />
      )}
    </div>
  );
}
