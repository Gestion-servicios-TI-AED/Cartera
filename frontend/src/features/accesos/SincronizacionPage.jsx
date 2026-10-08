// Puerto de zoho-payment-tracker/frontend/src/pages/Ajustes.jsx -- sección
// "Sincronización de datos" (SubformsBackfillCard).
// Backend: POST/GET /oportunidades/backfill-subforms[/status] (ya existía,
// sin frontend hasta ahora).
import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw, Check, XCircle } from 'lucide-react';
import { AccesosLayout } from '../../components/layout/AccesosLayout.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { iniciarBackfillSubforms, getBackfillSubformsStatus } from '../../api/oportunidades.js';
import styles from './Accesos.module.css';
import shared from './Usuarios.module.css';

function formatDuracion(segundos) {
  if (segundos == null) return null;
  if (segundos < 60) return `${segundos}s`;
  const min = Math.floor(segundos / 60);
  const seg = segundos % 60;
  return `${min} min${seg > 0 ? ` ${seg}s` : ''}`;
}

// Trae el plan de pagos (Forma de Pago/Propuesta de Pago) de Zoho para las
// oportunidades que todavía no lo tengan cacheado -- el GET masivo de Deals
// nunca lo trae, solo pidiendo el deal individual (ver
// oportunidad.subformsBackfill.js). Seguro de correr varias veces: solo
// procesa lo pendiente.
function BackfillSubformsCard() {
  const [status, setStatus] = useState(null);
  const [triggering, setTriggering] = useState(false);
  const pollRef = useRef(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await getBackfillSubformsStatus();
        setStatus(res.data);
        if (!res.data.running) stopPolling();
      } catch {
        // seguir intentando en el próximo tick
      }
    }, 2000);
  }, [stopPolling]);

  useEffect(() => {
    getBackfillSubformsStatus()
      .then((res) => {
        setStatus(res.data);
        if (res.data.running) startPolling();
      })
      .catch(() => {});
    return stopPolling;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleTrigger() {
    setTriggering(true);
    try {
      await iniciarBackfillSubforms();
      startPolling();
    } finally {
      setTriggering(false);
    }
  }

  const running = status?.running;
  const result = status?.result;
  const enCurso = running && result?.running;

  return (
    <section className={shared.sectionCard}>
      <div>
        <h2 className={shared.sectionTitle}>Plan de pagos desde Zoho</h2>
        <p className={shared.sectionHint}>Trae el plan de pagos (Forma de Pago / Propuesta de Pago) de Zoho para las oportunidades que todavía no lo tengan guardado -- necesario para que Dashboard muestre datos completos.</p>
      </div>

      <div>
        <Button variant="secondary" onClick={handleTrigger} disabled={triggering || enCurso}>
          <RefreshCw size={13} className={enCurso ? styles.spin : ''} />
          {enCurso ? 'Sincronizando…' : 'Sincronizar planes de pago'}
        </Button>
      </div>

      {enCurso && (
        <div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${result.porcentaje}%` }} />
          </div>
          <p className={styles.progressText}>
            {result.porcentaje}% · {result.procesadas} de {result.total} oportunidades
            {result.segundosRestantesEstimados != null && <> · faltan ~{formatDuracion(result.segundosRestantesEstimados)}</>}
            {result.errores > 0 && <> · {result.errores} errores</>}
          </p>
        </div>
      )}

      {!enCurso && result?.ok === true && (
        <div className={styles.statusOk}>
          <Check size={14} />
          <span>Listo: {result.actualizadas} de {result.total} oportunidades actualizadas en {result.elapsed}{result.errores > 0 && ` (${result.errores} errores)`}</span>
        </div>
      )}

      {!enCurso && result?.ok === false && (
        <div className={styles.statusError}>
          <XCircle size={14} />
          <span>Error: {result.error}</span>
        </div>
      )}
    </section>
  );
}

export function SincronizacionPage() {
  return (
    <div className={shared.page}>
      <AccesosLayout>
        <div className={shared.listHeader}>
          <div>
            <h1 className={shared.title}>Sincronización</h1>
            <p className={shared.subtitle}>Herramientas de mantenimiento sobre los datos que vienen de Zoho y HubSpot.</p>
          </div>
        </div>

        <BackfillSubformsCard />
      </AccesosLayout>
    </div>
  );
}
