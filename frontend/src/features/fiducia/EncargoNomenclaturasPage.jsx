// Adaptado de zoho-payment-tracker/frontend/src/pages/EncargoNomenclaturas.jsx
// -- es el destino real de "click en un encargo" en el legado (el listado de
// hojas crudas -- HojaViewerPage.jsx -- quedaba huérfano ahí, sin ningún
// link real hacia él; ver el link "Ver hojas del Excel" más abajo, agregado
// para no perder esa función). Grilla de tarjetas por unidad (Nomenclatura),
// resuelta desde Negocio -- cada una abre el detalle completo en
// ApartamentoDetallePage.jsx.
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, User } from 'lucide-react';
import { BackLink } from '../../components/ui/BackLink.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Field, TextInput } from '../../components/ui/Field.jsx';
import { Pagination } from '../../components/ui/Pagination.jsx';
import { getEncargo, getNomenclaturas } from '../../api/fiducia.js';
import { estadoToken } from '../../utils/estados.js';
import styles from './EncargoNomenclaturasPage.module.css';

function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function formatSaldoCompact(val) {
  if (val == null) return null;
  const n = parseFloat(val);
  if (isNaN(n) || n === 0) return null;
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n)}`;
}

export function EncargoNomenclaturasPage() {
  const { id } = useParams();
  const [encargo, setEncargo] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [search, setSearch] = useState('');
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const debouncedSearch = useDebounce(search);

  const cargar = useCallback(async (s, p) => {
    setCargando(true);
    try {
      const res = await getNomenclaturas(id, { search: s || undefined, page: p, limit: 50 });
      setResultado(res.data);
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => { getEncargo(id).then((res) => setEncargo(res.data)).catch(() => {}); }, [id]);
  useEffect(() => { setPagina(1); cargar(debouncedSearch, 1); }, [debouncedSearch, cargar]);

  const meta = resultado ?? {};
  const items = meta.data ?? [];

  return (
    <div className={styles.page}>
      <BackLink to="/fiducia">Encargos fiduciarios</BackLink>

      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>{encargo?.nombre ?? 'Cargando…'}</h1>
          {encargo?.codigo && <span className={styles.codigoBadge}>{encargo.codigo}</span>}
        </div>
        <span className={styles.contador}>{meta.pagination?.total ?? 0} unidades</span>
        <Link to={`/fiducia/${id}/hojas`} className={styles.linkHojas}>Ver hojas del Excel</Link>
      </div>

      <Field className={styles.fieldBuscar} label="Buscar">
        {(p) => <TextInput {...p} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nomenclatura, inventario o comprador…" />}
      </Field>

      {cargando && !resultado ? (
        <p className={styles.cargando}>Cargando unidades…</p>
      ) : items.length === 0 ? (
        <div className={styles.vacio}>
          <p className={styles.vacioTitulo}>Sin unidades encontradas</p>
          <p className={styles.vacioTexto}>{search ? 'Ajusta los filtros.' : 'Ejecuta el backfill en el módulo Negocios para cargar los datos.'}</p>
        </div>
      ) : (
        <>
          <div className={styles.grid}>
            {items.map((item) => {
              const saldo = formatSaldoCompact(item.saldoActual);
              const saldoNum = item.saldoActual ? parseFloat(item.saldoActual) : 0;
              return (
                <Link key={item.referencia} to={`/fiducia/${id}/apartamento/${encodeURIComponent(item.referencia)}`} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div>
                      <h3 className={styles.cardTitulo}>{item.nomenclatura}</h3>
                      {(item.tipo || item.inventario) && <p className={styles.cardSub}>{item.tipo || item.inventario}</p>}
                    </div>
                    <ChevronRight size={16} className={styles.chevron} />
                  </div>

                  {item.compradorPrincipal && (
                    <div className={styles.compradorRow}>
                      <User size={12} className={styles.compradorIcono} />
                      <span className={styles.compradorNombre}>{item.compradorPrincipal}</span>
                      {item.nroId && <span className={styles.compradorId}>{item.nroId}</span>}
                    </div>
                  )}

                  <div className={styles.cardFooter}>
                    <div className={styles.footerIzq}>
                      {item.estado && <Badge variant={estadoToken(item.estado)}>{item.estado}</Badge>}
                      {saldo && <span className={`${styles.saldo} ${saldoNum > 0 ? styles.saldoPositivo : ''}`}>{saldo}</span>}
                    </div>
                    <span className={styles.movCount}>{item.totalMovimientos} mov.</span>
                  </div>
                </Link>
              );
            })}
          </div>

          {meta.pagination && (
            <Pagination
              page={pagina}
              pageSize={meta.pagination.limit}
              total={meta.pagination.total}
              onPageChange={(p) => { setPagina(p); cargar(debouncedSearch, p); }}
            />
          )}
        </>
      )}
    </div>
  );
}
