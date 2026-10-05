// Destino de "click en un encargo" (Baía Kristal): las unidades (Nomenclatura) del
// encargo, resueltas desde Negocio -- cada una abre el detalle completo en
// ApartamentoDetallePage.jsx. El listado de hojas crudas del Excel
// (EncargoHojasPage.jsx) queda como vista secundaria, enlazada desde el banner.
// Rediseño 2026-10-05: banner de detalle + tabla de unidades (antes una grilla de
// tarjetas) con comprador, estado, saldo y movimientos.
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FileSpreadsheet, Search } from 'lucide-react';
import { BackLink } from '../../components/ui/BackLink.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Field, TextInput } from '../../components/ui/Field.jsx';
import { Pagination } from '../../components/ui/Pagination.jsx';
import { getEncargo, getNomenclaturas } from '../../api/fiducia.js';
import { estadoToken } from '../../utils/estados.js';
import { formatCOP } from '../../utils/format.js';
import { descripcionProyecto } from '../../utils/proyectos.js';
import layoutStyles from '../../components/layout/WizardLayout.module.css';
import base from '../negocios/NegociosPage.module.css';
import styles from './Encargos.module.css';

const PAGE_SIZE = 50;

function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function iniciales(nombre = '') {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  return `${partes[0]?.[0] ?? ''}${partes.length > 1 ? partes[partes.length - 1][0] : ''}`.toUpperCase() || '?';
}

export function EncargoNomenclaturasPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [encargo, setEncargo] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [search, setSearch] = useState('');
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const debouncedSearch = useDebounce(search);

  const cargar = useCallback(async (s, p) => {
    setCargando(true);
    try {
      const res = await getNomenclaturas(id, { search: s || undefined, page: p, limit: PAGE_SIZE });
      setResultado(res.data);
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => { getEncargo(id).then((res) => setEncargo(res.data)).catch(() => {}); }, [id]);
  useEffect(() => { setPagina(1); cargar(debouncedSearch, 1); }, [debouncedSearch, cargar]);

  const meta = resultado ?? {};
  const items = meta.data ?? [];
  const total = meta.pagination?.total ?? 0;

  return (
    <div className={base.page}>
      <BackLink to="/fiducia">Encargos fiduciarios</BackLink>

      <section className={layoutStyles.hero}>
        <div className={layoutStyles.heroAvatar}>
          <FileSpreadsheet size={32} strokeWidth={1.5} aria-hidden="true" />
        </div>
        <div className={layoutStyles.heroInfo}>
          <h1 className={layoutStyles.heroName}>{encargo?.nombre ?? 'Cargando…'}</h1>
          <p className={layoutStyles.heroRole}>{encargo?.codigo ? `Código ${encargo.codigo}${descripcionProyecto(encargo.codigo) ? ` · ${descripcionProyecto(encargo.codigo)}` : ''}` : 'Encargo fiduciario'}</p>
          {encargo?.archivo_nombre && <p className={layoutStyles.heroMeta}>Archivo: {encargo.archivo_nombre}</p>}
        </div>
        <div className={layoutStyles.heroSide}>
          <Badge variant="info">{total.toLocaleString('es-CO')} unidades</Badge>
          <Link to={`/fiducia/${id}/hojas`}>
            <Button variant="secondary">Ver hojas del Excel</Button>
          </Link>
        </div>
      </section>

      <div className={base.filtros}>
        <div className={base.filtroBusqueda}>
          <Field
            label={
              <span className={base.labelConIcono}>
                <Search size={13} />
                Buscar
              </span>
            }
          >
            {(p) => <TextInput {...p} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nomenclatura, inventario o comprador…" />}
          </Field>
        </div>
      </div>

      <div className={base.tableWrap}>
        {!cargando && items.length === 0 ? (
          <div className={base.vacio}>
            <p className={base.vacioTitulo}>Sin unidades encontradas</p>
            <p className={base.vacioTexto}>{search ? 'Ajusta la búsqueda.' : 'Ejecuta "Reconstruir desde Fiducia" en el módulo Negocios para cargar los datos.'}</p>
          </div>
        ) : (
          <>
            <table className={base.table}>
              <thead>
                <tr>
                  <th>Unidad</th>
                  <th>Comprador</th>
                  <th>Estado</th>
                  <th className={base.derecha}>Saldo actual</th>
                  <th className={base.derecha}>Movimientos</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan={5} className={base.mensaje}>Cargando unidades…</td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const saldoNum = item.saldoActual ? parseFloat(item.saldoActual) : 0;
                    return (
                      <tr key={item.referencia} className={base.filaClicable} onClick={() => navigate(`/fiducia/${id}/apartamento/${encodeURIComponent(item.referencia)}`)}>
                        <td>
                          <div className={base.celdaTitulo}>
                            <span className={base.nombre}>{item.nomenclatura}</span>
                            {(item.tipo || item.inventario) && <span className={styles.tipoUnidad}>{String(item.tipo || item.inventario).toLowerCase()}</span>}
                          </div>
                        </td>
                        <td>
                          {item.compradorPrincipal ? (
                            <div className={base.persona}>
                              <span className={base.avatar}>{iniciales(item.compradorPrincipal)}</span>
                              <div className={base.celdaTitulo}>
                                <span>{item.compradorPrincipal}</span>
                                {item.nroId && <span className={styles.idComprador}>{item.nroId}</span>}
                              </div>
                            </div>
                          ) : (
                            <span className={base.muted}>Sin comprador</span>
                          )}
                        </td>
                        <td>{item.estado ? <Badge variant={estadoToken(item.estado)}>{item.estado}</Badge> : <span className={base.muted}>—</span>}</td>
                        <td className={`${base.derecha} ${base.saldo} ${saldoNum > 0 ? base.saldoPositivo : base.muted}`}>{saldoNum ? formatCOP(saldoNum) : '—'}</td>
                        <td className={`${base.derecha} ${base.muted}`}>{item.totalMovimientos}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            {!cargando && total > 0 && (
              <Pagination
                page={pagina}
                pageSize={PAGE_SIZE}
                total={total}
                onPageChange={(p) => { setPagina(p); cargar(debouncedSearch, p); }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
