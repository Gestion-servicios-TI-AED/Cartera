// Detalle de una Oportunidad de Oliv -- misma base que
// oportunidades/OportunidadDetallePage.jsx (Baía Kristal/Zoho): header con
// título+StageBadge+sync, body de 2 columnas (izquierda: 2 cards fijas --
// Información general + un FieldGrid; derecha: card de monto + un FieldGrid
// + Accordion(s) al final) -- pedido explícito del usuario (2026-09-11):
// "el diseño debe ser tal cual como en Baía Kristal, solo que en Oliv va a
// mostrar la información que tiene disponible". Los campos de Oliv vienen
// de HubSpot (`propiedades`, con su catálogo de metadatos) en vez de los
// campos fijos de Zoho -- cada FieldGrid se arma con las claves reales que
// sí tienen datos en los negocios de Oliv (ver SECCIONES más abajo).
//
// "Plan de Pagos" (cuando hay una cotización aceptada en el Cotizador de
// Cuotas -- ver utils/centroAplicacionesDb.js en el backend) va como el
// ÚLTIMO Accordion a propósito, no primero -- pedido explícito del usuario.
//
// Card "Inmueble" (Unidad/Torre/Piso/Parqueadero/Depósito/Cuarto útil) sale
// de la cotización aceptada (`op.cotizacionAceptada`), no de propiedades de
// HubSpot -- es la misma información que muestra Centro Aplicaciones
// Comerciales para esa cotización (`quotes.parking_*`/`deposito_*`/
// `cuarto_util_*`) -- pedido explícito del usuario: "debes mostrar también
// toda la información del inmueble, como sale en Centro Aplicaciones
// Comercial, eso tiene el parqueadero asignado, deposito y cuarto util,
// obviamente si no tiene lo vas a dejar como vacio".
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BackLink } from '../../components/ui/BackLink.jsx';
import { Vinculados } from '../../components/Vinculados.jsx';
import { StageBadge } from '../../components/ui/StageBadge.jsx';
import { Accordion } from '../../components/ui/Accordion.jsx';
import { Tabs } from '../../components/ui/Tabs.jsx';
import { getOportunidadOliv, listPropiedadesMetadataOliv } from '../../api/oliv.js';
import { formatCOP, formatDate, formatDateTime } from '../../utils/format.js';
import layoutStyles from '../../components/layout/WizardLayout.module.css';
import styles from '../oportunidades/OportunidadDetallePage.module.css';

function iniciales(texto = '') {
  const partes = String(texto).replace(/^(Baia Kristal|Oliv)\s*-\s*/i, '').trim().split(/\s+/).filter(Boolean);
  return `${partes[0]?.[0] ?? ''}${partes.length > 1 ? partes[1][0] : ''}`.toUpperCase() || '?';
}


// Elegidas a mano revisando qué propiedades de HubSpot vienen pobladas de
// verdad en los negocios reales de Oliv (no solo definidas) -- el resto de
// las ~400 propiedades restantes son en su mayoría métricas internas de
// HubSpot (hs_*) sin valor para negocio.
const PREFERENCIAS_INMUEBLE = ['proyecto_interesado', 'proyecto_de_interes', 'piso_de_preferencia', 'no_de_alcobas_de_interes', 'alcobas', 'uso_previsto_del_inmueble', 'destino_del_inmueble'];
const COTIZACIONES = ['numero_de_cotizaciones_enviadas', 'fecha_ultima_cotizacion_enviada', 'fecha_ultima_cotizacion_aceptada', 'ultima_unidad_cotizada', 'unidad_separada_48_horas', 'url_ultima_cotizacion'];
const DOCUMENTOS_Y_NEGOCIACION = [
  'dealtype', 'descuento_especial', 'deal_currency_code', 'comprobante_separacion', 'closed_lost_reason', 'aed_lost_reason_comment', 'razon_de_no_interes', 'segundo_propietario',
  'comentarios_de_perfilamiento', 'comentarios_perfilamiento',
  'plano_acotado', 'especificaciones_oliv_cartagena', 'carta_normatividad_turistica', 'cotizacion', 'anexo_parqueadero', 'carta_remisora', 'cartilla_de_negocios_fiduciarios',
];

function InfoRow({ label, children }) {
  return (
    <div className={styles.infoRow}>
      <span className={styles.miniLabel}>{label}</span>
      <div className={styles.infoValor}>{children || '—'}</div>
    </div>
  );
}

function esUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
}

function valorCampo(tipo, value) {
  if (esUrl(value)) return null; // se renderiza aparte como link, ver FieldGrid
  if (tipo === 'date') return formatDate(value);
  if (tipo === 'datetime') return formatDateTime(value);
  if (tipo === 'number') {
    const n = Number(value);
    return isNaN(n) ? value : n.toLocaleString('es-CO');
  }
  return String(value);
}

// Calcado de FieldGrid en OportunidadDetallePage.jsx -- misma grilla de 2
// columnas, mismo criterio de "no renderizar si no hay ninguna entrada".
function FieldGrid({ campos, propiedades, metadata }) {
  const entries = campos.map((key) => [key, propiedades[key]]).filter(([, v]) => v != null && v !== '');
  if (entries.length === 0) return <p className={styles.sinDatos}>Sin datos disponibles</p>;

  return (
    <div className={styles.fieldGrid}>
      {entries.map(([key, value]) => {
        const label = metadata[key]?.label ?? key;
        const display = esUrl(value) ? (
          <a href={value} target="_blank" rel="noreferrer" className={styles.link}>Ver documento</a>
        ) : (
          valorCampo(metadata[key]?.tipo, value)
        );
        return (
          <div key={key} className={styles.fieldCell}>
            <span className={styles.miniLabel}>{label}</span>
            <span className={styles.fieldValor}>{display || '—'}</span>
          </div>
        );
      })}
    </div>
  );
}

export function OlivOportunidadDetallePage() {
  const { id } = useParams();
  const [tab, setTab] = useState('resumen');
  const [op, setOp] = useState(null);
  const [metadata, setMetadata] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setCargando(true);
    setError(null);
    Promise.all([getOportunidadOliv(id), listPropiedadesMetadataOliv()])
      .then(([opRes, metaRes]) => {
        setOp(opRes.data);
        const map = {};
        metaRes.data.forEach((p) => { map[p.name] = p; });
        setMetadata(map);
      })
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, [id]);

  if (cargando) return <p className={styles.cargando}>Cargando…</p>;
  if (error || !op) return <p className={styles.error}>{error || 'Oportunidad no encontrada'}</p>;

  const propiedades = op.propiedades ?? {};

  return (
    <div className={styles.page}>
      <BackLink to="/oliv/oportunidades">Oportunidades</BackLink>

      <section className={layoutStyles.hero}>
        <div className={layoutStyles.heroAvatar}>{iniciales(op.nombreContacto || op.dealName)}</div>
        <div className={layoutStyles.heroInfo}>
          <h1 className={layoutStyles.heroName}>{op.nombreContacto || op.dealName}</h1>
          <p className={layoutStyles.heroRole}>{op.proyecto || op.dealName || 'Oportunidad'}</p>
          <p className={layoutStyles.heroMeta}>Última sincronización: {formatDateTime(op.ultimoSyncEn)}</p>
        </div>
        <div className={layoutStyles.heroSide}>
          <StageBadge stage={op.stage} />
          {op.referenciaRecaudo && <span className={styles.refBadge}>Ref. {op.referenciaRecaudo}</span>}
        </div>
      </section>

      <Vinculados proyecto="oliv" tipo="oportunidad" id={id} />

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Monto</p>
          <p className={styles.kpiValor}>{op.amount != null ? formatCOP(op.amount) : 'Sin definir'}</p>
        </div>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Unidad</p>
          <p className={styles.kpiValor}>{op.cotizacionAceptada?.unitCode || '—'}</p>
        </div>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Cotizaciones enviadas</p>
          <p className={styles.kpiValor}>{propiedades.numero_de_cotizaciones_enviadas ?? '—'}</p>
        </div>
      </div>

      <Tabs
        ariaLabel="Secciones de la oportunidad"
        value={tab}
        onChange={setTab}
        tabs={[
          { key: 'resumen', label: 'Resumen' },
          { key: 'cotizaciones', label: 'Cotizaciones y pagos' },
          { key: 'documentos', label: 'Documentos y negociación' },
        ]}
      />

      {tab === 'resumen' && (
        <div className={styles.body}>
          <div className={styles.columna}>
            <div className={styles.card}>
              <p className={styles.subtitulo}>Información general</p>
              <InfoRow label="Contacto">{op.nombreContacto}</InfoRow>
              <InfoRow label="Email">{op.email ? <a href={`mailto:${op.email}`} className={styles.link}>{op.email}</a> : null}</InfoRow>
              <InfoRow label="Teléfono">{op.telefono ? <a href={`tel:${op.telefono}`} className={styles.link}>{op.telefono}</a> : null}</InfoRow>
              <InfoRow label="Proyecto">{op.proyecto}</InfoRow>
              <InfoRow label="Referencia Recaudo">{op.referenciaRecaudo ? <span className={styles.refBadge}>{op.referenciaRecaudo}</span> : null}</InfoRow>
              <InfoRow label="Ciudad de residencia">{propiedades.ciudad_de_residencia}</InfoRow>
              <InfoRow label="País de ciudadanía">{propiedades.pais_de_ciudadania}</InfoRow>
              <InfoRow label="Nacionalidad">{propiedades.nacionalidad}</InfoRow>
              <InfoRow label="Residencia">{propiedades.residencia}</InfoRow>
              <InfoRow label="Método de contacto preferido">{propiedades.metodo_de_contacto_preferido}</InfoRow>
            </div>
          </div>

          <div className={styles.columna}>
            <div className={styles.card}>
              <p className={styles.subtitulo}>Inmueble</p>
              {op.cotizacionAceptada ? (
                <>
                  <InfoRow label="Unidad">{op.cotizacionAceptada.unitCode}</InfoRow>
                  <InfoRow label="Torre">{op.cotizacionAceptada.unitTower}</InfoRow>
                  <InfoRow label="Piso">{op.cotizacionAceptada.unitFloor}</InfoRow>
                  <InfoRow label="Parqueadero asignado">{op.cotizacionAceptada.parqueadero?.nombre}</InfoRow>
                  <InfoRow label="Depósito">{op.cotizacionAceptada.deposito?.nombre}</InfoRow>
                  <InfoRow label="Cuarto útil">{op.cotizacionAceptada.cuartoUtil?.nombre}</InfoRow>
                </>
              ) : (
                <p className={styles.sinDatos}>Sin cotización aceptada</p>
              )}
            </div>

            <div className={styles.card}>
              <p className={styles.subtitulo}>Preferencias del inmueble</p>
              <FieldGrid campos={PREFERENCIAS_INMUEBLE} propiedades={propiedades} metadata={metadata} />
            </div>
          </div>
        </div>
      )}

      {tab === 'cotizaciones' && (
        <div className={styles.columna}>
          <div className={styles.card}>
            <p className={styles.subtitulo}>Cotizaciones</p>
            <FieldGrid campos={COTIZACIONES} propiedades={propiedades} metadata={metadata} />
          </div>

          {op.cotizacionAceptada?.planDePago ? (
            <Accordion collapsible={false} title="Plan de Pagos">
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
                      {op.cotizacionAceptada.planDePago.map((cuota) => (
                        <tr key={cuota.numero}>
                          <td>{cuota.concepto}</td>
                          <td>{cuota.fecha_estimada ? formatDate(cuota.fecha_estimada) : '—'}</td>
                          <td className={`${styles.right} ${styles.montoFuerte}`}>{formatCOP(cuota.valor)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className={styles.aviso}>
                  Cotización aceptada · Unidad {op.cotizacionAceptada.unitCode} · {formatDateTime(op.cotizacionAceptada.createdAt)}
                </p>
              </div>
            </Accordion>
          ) : (
            <div className={styles.card}>
              <p className={styles.subtitulo}>Plan de Pagos</p>
              <p className={styles.sinDatos}>Sin cotización aceptada: todavía no hay plan de pagos.</p>
            </div>
          )}
        </div>
      )}

      {tab === 'documentos' && (
        <div className={styles.card}>
          <p className={styles.subtitulo}>Documentos y negociación</p>
          <FieldGrid campos={DOCUMENTOS_Y_NEGOCIACION} propiedades={propiedades} metadata={metadata} />
        </div>
      )}
    </div>
  );
}
