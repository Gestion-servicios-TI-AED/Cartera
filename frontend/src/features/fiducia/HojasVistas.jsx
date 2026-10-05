// Vistas compartidas de las hojas crudas de un Excel de encargo (Baía Kristal y
// Oliv): el listado de hojas de un encargo y el visor de una hoja. Cada página
// hace su propio fetch (API distinta) y delega el dibujo acá. Rediseño
// 2026-10-05: banner de detalle y tablas en tarjeta.
import { Link } from 'react-router-dom';
import { FileSpreadsheet, Table2 } from 'lucide-react';
import { BackLink } from '../../components/ui/BackLink.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Pagination } from '../../components/ui/Pagination.jsx';
import { formatCelda } from '../../utils/formatCelda.js';
import layoutStyles from '../../components/layout/WizardLayout.module.css';
import base from '../negocios/NegociosPage.module.css';
import styles from './Encargos.module.css';

export function EncargoHojasVista({ encargo, volverA, volverLabel, rutaHoja, accionExtra }) {
  const hojas = encargo.hojas ?? [];
  const totalFilas = hojas.reduce((suma, h) => suma + (Number(h.total_filas) || 0), 0);
  return (
    <div className={base.page}>
      <BackLink to={volverA}>{volverLabel}</BackLink>

      <section className={layoutStyles.hero}>
        <div className={layoutStyles.heroAvatar}>
          <FileSpreadsheet size={32} strokeWidth={1.5} aria-hidden="true" />
        </div>
        <div className={layoutStyles.heroInfo}>
          <h1 className={layoutStyles.heroName}>{encargo.nombre}</h1>
          <p className={layoutStyles.heroRole}>Código {encargo.codigo ?? '—'}</p>
          <p className={layoutStyles.heroMeta}>Archivo: {encargo.archivo_nombre}</p>
        </div>
        <div className={layoutStyles.heroSide}>
          <Badge variant="info">{hojas.length} hoja{hojas.length !== 1 ? 's' : ''}</Badge>
          {accionExtra}
        </div>
      </section>

      <div className={base.kpiGrid}>
        <div className={base.kpiCard}>
          <p className={base.kpiLabel}>Hojas en el Excel</p>
          <p className={base.kpiValor}>{hojas.length}</p>
        </div>
        <div className={base.kpiCard}>
          <p className={base.kpiLabel}>Filas en total</p>
          <p className={base.kpiValor}>{totalFilas.toLocaleString('es-CO')}</p>
        </div>
      </div>

      <div className={base.tableWrap}>
        <table className={base.table}>
          <thead>
            <tr>
              <th>Hoja</th>
              <th className={base.derecha}>Filas</th>
            </tr>
          </thead>
          <tbody>
            {hojas.length === 0 ? (
              <tr>
                <td colSpan={2} className={base.mensaje}>Este encargo no tiene hojas.</td>
              </tr>
            ) : (
              hojas.map((hoja) => (
                <tr key={hoja.id}>
                  <td>
                    <div className={styles.encargoCelda}>
                      <span className={styles.archivoIcono}>
                        <Table2 size={18} strokeWidth={1.75} aria-hidden="true" />
                      </span>
                      <Link to={rutaHoja(hoja.id)} className={styles.enlace}>{hoja.nombre_hoja}</Link>
                    </div>
                  </td>
                  <td className={`${base.derecha} ${base.saldo}`}>{Number(hoja.total_filas).toLocaleString('es-CO')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function HojaVisorVista({ hoja, pagina, onPagina, volverA }) {
  return (
    <div className={base.page}>
      <BackLink to={volverA}>Hojas del Excel</BackLink>

      <div className={base.header}>
        <div>
          <h1 className={base.title}>{hoja.nombreHoja}</h1>
          <p className={base.subtitle}>
            {hoja.pagination ? `${hoja.pagination.total.toLocaleString('es-CO')} filas` : `${hoja.filas.length} filas`} · {hoja.columnas.length} columnas
          </p>
        </div>
      </div>

      <div className={styles.visorWrap}>
        <table className={base.table}>
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

      {hoja.pagination && <Pagination page={pagina} pageSize={hoja.pagination.limit} total={hoja.pagination.total} onPageChange={onPagina} />}
    </div>
  );
}
