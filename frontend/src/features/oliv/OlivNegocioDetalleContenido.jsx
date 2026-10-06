// Detalle de un Negocio de Oliv -- calcado del layout de
// negocios/NegocioDetalleContenido.jsx (Baía Kristal): header (Referencia +
// estado + total abonado) + 6 Accordion en el mismo orden (Comprador / Info
// del apartamento / Estructura financiera y abonos / Conciliación /
// Historial de movimientos / Forma y propuesta de pago). Pedido explícito
// del usuario (2026-09-11, con captura de pantalla adjunta del Negocio real
// de Baía Kristal): "debe tener las mismas secciones de Negocios como en
// Baia Kristal.. Todo lo de la imagen completo, todo completo".
//
// "Estructura financiera y abonos" e "Historial de movimientos" ya se
// pueblan (2026-09-14) desde el Excel de Encargos "Saldos Acumulados por
// Concepto y Unidad" -- ver backend/olivNegocio.service.js: se cruza por
// Referencia de Recaudo (columna ENCARGO del Excel = campo de HubSpot), y
// "Aportes" es lo que cuenta como "Total abonado" -- "Rendimientos Brutos"
// no se importa en absoluto (pedido explícito del usuario, 2026-09-15).
// Si el negocio no tiene esa referencia vinculada todavía en HubSpot, o no
// hay ningún Excel subido con esa referencia, quedan vacíos.
// "Historial de movimientos" es expandible por fila (pedido explícito del
// usuario, 2026-09-14: "los movimientos tienen que tener sus detalles tal
// cual como lo hace Baia Kristal") -- el resto de columnas crudas del Excel
// (`movimiento.detalle`, ya sin Concepto/Valor/Propietario duplicados, ver
// olivHelpers.js#detalleSinDuplicar) se muestra al hacer clic, igual que
// `negocios/NegocioDetalleContenido.jsx#MovimientoRow`.
// "Conciliación" (2026-09-14) es APROXIMADA -- el Excel de Encargos es un
// acumulado por Excel subido, no un histórico de transacciones fecha por
// fecha, así que no se puede saber con certeza EN QUÉ CUOTA puntual cayó
// cada peso, solo el orden cronológico real en que se pagó (cada movimiento
// SÍ tiene una fecha real desde 2026-09-24 -- la de `OlivEncargo.fecha`, el
// Excel que lo trajo -- ver backend/olivNegocio.service.js#_conciliacionAproximada,
// que ahora arma un `pago` por movimiento con su fecha real en vez de un
// solo blob sin fecha). "Atrasada"/"días de atraso" y "Fecha de pago"
// (`fechaCubierta`) son confiables; lo aproximado es la asignación
// pago-a-cuota en sí, no las fechas -- de ahí el aviso.
// "Forma y propuesta de pago" sale de la cotización aceptada en Centro
// Aplicaciones Comerciales (mismo dato y misma tabla que ya se muestra en
// OlivOportunidadDetallePage.jsx).
import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Badge } from '../../components/ui/Badge.jsx';
import { Accordion } from '../../components/ui/Accordion.jsx';
import { Tabs } from '../../components/ui/Tabs.jsx';
import { getNegocioOliv } from '../../api/oliv.js';
import { exportarEstadoCuentaOliv } from './estadoCuentaPdfOliv.js';
import { formatCOP, formatDate, formatDateTime } from '../../utils/format.js';
import { formatCelda } from '../../utils/formatCelda.js';
import styles from '../negocios/NegocioDetallePage.module.css';
import { DetalleHero, HeroBadges, HeroBoton, HeroSaldo } from '../../components/layout/DetalleHero.jsx';
import { Briefcase } from 'lucide-react';

function badgeConciliacion(c) {
  if (c.atrasada) return { txt: 'Atrasada', variant: 'danger' };
  if (c.estado === 'pagada') return { txt: 'Pagada', variant: 'success' };
  if (c.estado === 'parcial') return { txt: 'Parcial', variant: 'warning' };
  return { txt: 'Pendiente', variant: 'neutral' };
}

function labelCuota(etiqueta) {
  return /^\d+$/.test(etiqueta) ? `Cuota ${etiqueta}` : etiqueta;
}

const CAMPOS_INMUEBLE = [
  ['codigoUnidad', 'Unidad'],
  ['torre', 'Torre'],
  ['piso', 'Piso'],
  ['categoria', 'Categoría'],
  ['tipoApartamento', 'Tipo de apartamento'],
  ['estado', 'Estado'],
  ['areaConstruida', 'Área construida (m²)'],
  ['areaPrivada', 'Área privada (m²)'],
  ['areaTerraza', 'Área terraza (m²)'],
  ['alcobas', 'Alcobas'],
  ['banos', 'Baños'],
  ['tipoVista', 'Tipo de vista'],
  ['valorComercial', 'Valor comercial'],
  ['valorM2', 'Valor m²'],
  ['bono', 'Bono'],
];
const CAMPOS_MONEDA = new Set(['valorComercial', 'valorM2', 'bono']);

// Parqueadero/Depósito/Cuarto útil salen de la cotización aceptada (Centro
// Aplicaciones Comerciales), no del objeto "Unidades" de HubSpot -- pedido
// explícito del usuario: "eso también lo muestres dentro del negocio en el
// modulo de Negocios en la Info del apartamento" (mismos 3 campos pedidos
// para el detalle de Oportunidad, ver OlivOportunidadDetallePage.jsx).
function InfoApartamentoGrid({ inmueble, cotizacion }) {
  const entries = CAMPOS_INMUEBLE.map(([key, label]) => [key, label, inmueble?.[key]]).filter(([, , v]) => v != null && v !== '');
  const subInmuebles = [
    ['Parqueadero asignado', cotizacion?.parqueadero?.nombre],
    ['Depósito', cotizacion?.deposito?.nombre],
    ['Cuarto útil', cotizacion?.cuartoUtil?.nombre],
  ].filter(([, v]) => v);

  if (entries.length === 0 && subInmuebles.length === 0) return <p className={styles.sinDatosPad}>Sin datos del apartamento</p>;

  return (
    <div className={styles.seccionBody}>
      <div className={styles.gridExpandido}>
        {entries.map(([key, label, value]) => (
          <div key={key}>
            <p className={styles.miniLabel}>{label}</p>
            <p className={styles.miniValor}>{CAMPOS_MONEDA.has(key) ? formatCOP(value) : String(value)}</p>
          </div>
        ))}
        {subInmuebles.map(([label, value]) => (
          <div key={label}>
            <p className={styles.miniLabel}>{label}</p>
            <p className={styles.miniValor}>{value}</p>
          </div>
        ))}
      </div>
      {inmueble?.planoLink && (
        <p className={styles.aviso}>
          <a href={inmueble.planoLink} target="_blank" rel="noreferrer" className={styles.link}>Ver plano</a>
        </p>
      )}
    </div>
  );
}

// Aportes viene del Excel de Encargos, cruzado por Referencia de Recaudo --
// ver el comentario de cabecera. Rendimientos Brutos ya no se importa en
// absoluto (pedido explícito del usuario, 2026-09-15: "esos movimientos no
// debe importarlos... sacarlos de todo el sistema" -- antes se mostraba
// aparte, informativo, sin sumarse a Aportes; ahora ni siquiera se guarda).
function EstructuraFinancieraSection({ estructura }) {
  if (!estructura) {
    return <p className={styles.sinDatosPad}>Sin datos financieros -- este negocio todavía no tiene Referencia de Recaudo vinculada en HubSpot que cruce con un Excel de Encargos subido.</p>;
  }
  return (
    <div className={styles.seccionBody}>
      <div className={styles.gridExpandido}>
        <div>
          <p className={styles.miniLabel}>Aportes (abonado real)</p>
          <p className={styles.miniValor}>{formatCOP(estructura.aportes)}</p>
        </div>
        {estructura.valorUnidadFiducia != null && (
          <div>
            <p className={styles.miniLabel}>Valor de la unidad (fiduciaria)</p>
            <p className={styles.miniValor}>{formatCOP(estructura.valorUnidadFiducia)}</p>
          </div>
        )}
      </div>
      <p className={styles.aviso}>Datos del Excel de Encargos (Saldos Acumulados por Concepto y Unidad).</p>
    </div>
  );
}

// Cada fila es Aportes acumulados del Excel de Encargos (Rendimientos
// Brutos no se importa). `fecha` (Jefe Gabriel, 2026-09-24) es la fecha del
// Excel EN SÍ (`OlivEncargo.fecha`), no una fecha por transacción -- el
// archivo sigue siendo un acumulado a la fecha de corte, así que TODOS los
// movimientos de un mismo Excel comparten la misma fecha. Al expandir se ve
// el resto de columnas crudas de esa fila (`detalle`, ya sin Concepto/Valor/
// Propietario duplicados) -- mismo patrón que
// negocios/NegocioDetalleContenido.jsx#MovimientoRow y
// oliv/OlivMovimientosPage.jsx#MovimientoRow.
function MovimientoRow({ m }) {
  const [expanded, setExpanded] = useState(false);
  const detalle = m.detalle || {};
  const campos = Object.keys(detalle);

  return (
    <>
      <tr className={styles.filaClicable} onClick={() => setExpanded((e) => !e)}>
        <td className={styles.colChevron}>
          <ChevronRight size={12} strokeWidth={2.5} className={`${styles.chevronRow} ${expanded ? styles.chevronRowOpen : ''}`} />
        </td>
        <td className={styles.nowrap}>{m.fecha ? formatDate(m.fecha) : <span className={styles.vacio}>—</span>}</td>
        <td>{m.concepto ?? <span className={styles.vacio}>—</span>}</td>
        <td>{m.estado ?? <span className={styles.vacio}>—</span>}</td>
        <td className={`${styles.right} ${styles.strong}`}>{m.valor != null ? formatCOP(m.valor) : <span className={styles.vacio}>—</span>}</td>
      </tr>
      {expanded && (
        <tr className={styles.filaExpandida}>
          <td colSpan={5}>
            {campos.length === 0 ? (
              <p className={styles.vacio}>Esta fila no trae ningún otro dato.</p>
            ) : (
              <div className={styles.gridExpandido}>
                {campos.map((col) => {
                  const display = formatCelda(col, detalle[col]);
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

function HistorialMovimientosSection({ movimientos }) {
  if (!movimientos || movimientos.length === 0) {
    return <p className={styles.sinDatosPad}>Sin movimientos registrados.</p>;
  }
  return (
    <div className={styles.seccionBody}>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.colChevron} />
              <th>Fecha</th>
              <th>Concepto</th>
              <th>Estado</th>
              <th className={styles.right}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {movimientos.map((m) => <MovimientoRow key={m.id} m={m} />)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Aproximada (`aproximada: true`, ver el comentario de cabecera del
// backend): "Fecha de pago" (`c.fechaCubierta`) es la fecha REAL del
// movimiento/Excel que completó esa cuota (Jefe Gabriel, 2026-09-24) -- ya
// no sale vacía. Sigue siendo aproximada porque no sabemos EN QUÉ CUOTA
// puntual cayó cada peso del Excel (solo el orden cronológico de los
// pagos), no porque falte la fecha.
function CuotaRow({ c }) {
  const badge = badgeConciliacion(c);
  return (
    <tr>
      <td>{labelCuota(c.etiqueta)}</td>
      <td className={styles.nowrap}>{c.fechaEstimada ? formatDate(c.fechaEstimada) : '—'}</td>
      <td className={styles.nowrap}>{c.estado === 'pagada' && c.fechaCubierta ? formatDate(c.fechaCubierta) : '—'}</td>
      <td className={`${styles.right} ${styles.strong}`}>{formatCOP(c.valorPlan)}</td>
      <td className={styles.right}>
        {c.cubierto > 0 ? <span className={c.estado === 'pagada' ? styles.textoExito : styles.textoAmbar}>{formatCOP(c.cubierto)}</span> : <span className={styles.vacio}>—</span>}
      </td>
      <td className={styles.right}>{formatCOP(c.valorPlan - c.cubierto)}</td>
      <td className={styles.right}>
        {c.atrasada && c.diasAtraso != null ? <span className={styles.textoPeligro}>{c.diasAtraso}</span> : <span className={styles.vacio}>—</span>}
      </td>
      <td className={styles.right}><Badge variant={badge.variant}>{badge.txt}</Badge></td>
    </tr>
  );
}

function ConciliacionSection({ conciliacion }) {
  if (!conciliacion) {
    return <p className={styles.sinDatosPad}>Sin plan de pagos o sin movimientos vinculados a este negocio.</p>;
  }
  const { cuotas, resumen } = conciliacion;
  return (
    <div className={styles.seccionBody}>
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <p className={styles.miniLabel}>Total plan</p>
          <p className={styles.kpiValor}>{formatCOP(resumen.totalPlan)}</p>
        </div>
        <div className={styles.kpiCard}>
          <p className={styles.miniLabel}>Total pagado</p>
          <p className={`${styles.kpiValor} ${styles.textoExito}`}>
            {formatCOP(resumen.totalPagado)} <span className={styles.kpiPorcentaje}>({resumen.porcentaje}%)</span>
          </p>
        </div>
        <div className={styles.kpiCard}>
          <p className={styles.miniLabel}>Cuotas pagadas</p>
          <p className={styles.kpiValor}>{resumen.cuotasPagadas}/{resumen.totalCuotas}</p>
        </div>
        <div className={styles.kpiCard}>
          <p className={styles.miniLabel}>En mora</p>
          {resumen.cuotasEnMora > 0 ? (
            <p className={`${styles.kpiValor} ${styles.textoPeligro}`}>
              {resumen.cuotasEnMora} {resumen.cuotasEnMora === 1 ? 'cuota' : 'cuotas'}
              <span className={styles.kpiSub}>{formatCOP(resumen.montoEnMora)}</span>
              <span className={styles.kpiSub}>{resumen.maxDiasAtraso} días</span>
            </p>
          ) : (
            <p className={styles.kpiValorVacio}>—</p>
          )}
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Cuota</th>
              <th>Fecha esperada</th>
              <th>Fecha de pago</th>
              <th className={styles.right}>Valor de la cuota</th>
              <th className={styles.right}>Valor pagado</th>
              <th className={styles.right}>Diferencia</th>
              <th className={styles.right}>Días de atraso</th>
              <th className={styles.right}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {cuotas.map((c, i) => <CuotaRow key={i} c={c} />)}
          </tbody>
        </table>
      </div>

      {resumen.saldoAFavor > 0 && <p className={styles.saldoAFavor}>Saldo a favor: {formatCOP(resumen.saldoAFavor)}</p>}

      <p className={styles.aviso}>
        * Conciliación aproximada: cada pago se aplica en orden cronológico (según la fecha del Excel que lo trajo) contra el plan de pagos de la cotización aceptada -- las cuotas pagadas/atrasadas y su "Fecha de pago" son un buen estimado, pero no sabemos en qué cuota puntual cayó cada peso del Excel. No representa un estado de cuenta oficial.
      </p>
    </div>
  );
}

function PlanDePagosOliv({ cotizacion }) {
  if (!cotizacion?.planDePago) return <p className={styles.sinDatosPad}>Sin cotización aceptada.</p>;
  return (
    <div className={styles.seccionBody}>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Concepto</th>
              <th>Fecha</th>
              <th className={styles.right}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {cotizacion.planDePago.map((cuota) => (
              <tr key={cuota.numero}>
                <td>{cuota.concepto}</td>
                <td>{cuota.fecha_estimada ? formatDate(cuota.fecha_estimada) : '—'}</td>
                <td className={`${styles.right} ${styles.strong}`}>{formatCOP(cuota.valor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={styles.aviso}>
        Cotización aceptada · Unidad {cotizacion.unitCode} · {formatDateTime(cotizacion.createdAt)}
      </p>
    </div>
  );
}

export function OlivNegocioDetalleContenido({ id }) {
  const [tab, setTab] = useState('resumen');
  const [negocio, setNegocio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getNegocioOliv(id)
      .then((res) => setNegocio(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  // A diferencia de Baía Kristal (`obtenerConciliacionCompleta`, que hace
  // fetch aparte), acá `negocio.conciliacion`/`historialMovimientos` ya
  // vienen completos en la misma respuesta que cargó la pantalla -- el PDF
  // solo dibuja con lo que ya está en memoria, sin pedir nada más.
  async function handleExportarEstadoCuenta() {
    if (!negocio || exportando) return;
    if (!negocio.conciliacion) {
      window.alert('Este negocio no tiene un plan de pagos registrado -- no se puede generar el estado de cuenta.');
      return;
    }
    setExportando(true);
    try {
      await exportarEstadoCuentaOliv(negocio);
    } catch (err) {
      window.alert(`Error generando el estado de cuenta: ${err.message}`);
    } finally {
      setExportando(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.centrado}>
        <p className={styles.cargando}>Cargando…</p>
      </div>
    );
  }
  if (error || !negocio) {
    return (
      <div className={styles.centrado}>
        <p className={styles.error}>{error || 'Negocio no encontrado'}</p>
      </div>
    );
  }

  const saldoFmt = negocio.totalAbonado != null ? formatCOP(negocio.totalAbonado) : null;

  return (
    <div className={styles.detalle}>
      <DetalleHero
        icon={Briefcase}
        titulo={negocio.referencia || '—'}
        subtitulo={negocio.proyecto || 'Referencia'}
        meta={`${negocio.totalMovimientos} movimientos`}
      >
        <HeroBadges>
          {negocio.estado && <Badge variant="neutral">{negocio.estado}</Badge>}
          {!negocio.tieneNegocio && <Badge variant="neutral">Sin negocio</Badge>}
          {negocio.conciliacion && (
            <HeroBoton onClick={handleExportarEstadoCuenta} disabled={exportando} title="Exportar estado de cuenta (PDF)">
              {exportando ? 'Generando…' : 'Estado de cuenta'}
            </HeroBoton>
          )}
        </HeroBadges>
        <HeroSaldo valor={saldoFmt ?? '—'} />
      </DetalleHero>

      <Tabs
        ariaLabel="Secciones del negocio"
        value={tab}
        onChange={setTab}
        tabs={[
          { key: 'resumen', label: 'Resumen' },
          { key: 'financiero', label: 'Financiero' },
          { key: 'conciliacion', label: 'Conciliación' },
          { key: 'movimientos', label: 'Movimientos', badge: negocio.totalMovimientos },
        ]}
      />

      {tab === 'resumen' && (
        <>
      <Accordion collapsible={false} title="Comprador" badge={negocio.comprador?.nombre ? 1 : 0}>
        {negocio.comprador?.nombre ? (
          <div className={styles.listaCompradores}>
            <div className={styles.filaComprador}>
              <div className={styles.avatar}>{negocio.comprador.nombre.charAt(0).toUpperCase()}</div>
              <div className={styles.compradorInfo}>
                <p className={styles.compradorNombre}>{negocio.comprador.nombre}</p>
                {negocio.comprador.cedula && <p className={styles.mutedSmall}>C.C. {negocio.comprador.cedula}</p>}
                {negocio.comprador.email && <p className={styles.mutedSmall}>{negocio.comprador.email}</p>}
                {negocio.comprador.telefono && <p className={styles.mutedSmall}>{negocio.comprador.telefono}</p>}
              </div>
            </div>
          </div>
        ) : (
          <p className={styles.sinDatosPad}>Sin comprador registrado</p>
        )}
      </Accordion>
      <Accordion collapsible={false} title="Info del apartamento" badge={negocio.inmueble || negocio.cotizacionAceptada ? 1 : 0}>
        {negocio.inmueble || negocio.cotizacionAceptada ? (
          <InfoApartamentoGrid inmueble={negocio.inmueble} cotizacion={negocio.cotizacionAceptada} />
        ) : (
          <p className={styles.sinDatosPad}>Sin inmueble asociado</p>
        )}
      </Accordion>
        </>
      )}

      {tab === 'financiero' && (
        <>
      <Accordion collapsible={false} title="Estructura financiera y abonos" badge={negocio.estructuraFinanciera ? 1 : 0}>
        <EstructuraFinancieraSection estructura={negocio.estructuraFinanciera} />
      </Accordion>
      <Accordion collapsible={false} title="Forma y propuesta de pago">
        <PlanDePagosOliv cotizacion={negocio.cotizacionAceptada} />
      </Accordion>
        </>
      )}

      {tab === 'conciliacion' && (
        <>
      <Accordion collapsible={false} title="Conciliación">
        <ConciliacionSection conciliacion={negocio.conciliacion} />
      </Accordion>
        </>
      )}

      {tab === 'movimientos' && (
        <>
      <Accordion collapsible={false} title="Historial de movimientos" badge={negocio.totalMovimientos}>
        <HistorialMovimientosSection movimientos={negocio.historialMovimientos} />
      </Accordion>
        </>
      )}
    </div>
  );
}
