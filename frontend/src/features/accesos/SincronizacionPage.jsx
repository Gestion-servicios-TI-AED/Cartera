// Puerto de zoho-payment-tracker/frontend/src/pages/Ajustes.jsx -- sección
// "Sincronización de datos" (SubformsBackfillCard + ProjectCodeReportCard).
// Backend: POST/GET /oportunidades/backfill-subforms[/status] (ya existía,
// sin frontend hasta ahora) y GET /inventario/verificar-project-code (idem).
import { useCallback, useEffect, useRef, useState } from 'react';
import ExcelJS from 'exceljs';
import { RefreshCw, Check, XCircle, FileSearch, Download, AlertTriangle } from 'lucide-react';
import { AccesosLayout } from '../../components/layout/AccesosLayout.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { iniciarBackfillSubforms, getBackfillSubformsStatus } from '../../api/oportunidades.js';
import { verificarProjectCode } from '../../api/inventario.js';
import styles from './Accesos.module.css';

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
    <div className={styles.card}>
      <div>
        <h2 className={styles.cardTitle}>Plan de pagos desde Zoho</h2>
        <p className={styles.cardHint}>Trae el plan de pagos (Forma de Pago / Propuesta de Pago) de Zoho para las oportunidades que todavía no lo tengan guardado -- necesario para que Dashboard muestre datos completos.</p>
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
    </div>
  );
}

// Reporte on-demand: inmuebles cuyo Project_Code de Zoho no le pertenece
// (copiado de otro apartamento del mismo frente) -- problema de datos en
// Zoho, no del sync. Solo lo detecta y lo deja descargar en Excel, no
// corrige nada acá.
function ProjectCodeReportCard() {
  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  async function handleVerificar() {
    setCargando(true);
    setError(null);
    try {
      const res = await verificarProjectCode();
      setReporte(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  async function handleDescargar() {
    if (!reporte) return;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Project Code inconsistentes');
    ws.columns = [
      { header: 'Frente', key: 'frente', width: 16 },
      { header: 'Torre', key: 'torre', width: 8 },
      { header: 'Unidad (Product Name)', key: 'productName', width: 20 },
      { header: 'Project Code actual (incorrecto)', key: 'projectCodeActual', width: 30 },
      { header: 'Estado del inmueble', key: 'estado', width: 16 },
      { header: 'Referencia de recaudo', key: 'referenciaRecaudo', width: 18 },
      { header: 'Zoho ID', key: 'zohoId', width: 22 },
    ];
    ws.getRow(1).font = { bold: true };
    for (const inc of reporte.inconsistencias) {
      ws.addRow({
        frente: inc.frente ?? '',
        torre: inc.torre ?? '',
        productName: inc.productName,
        projectCodeActual: inc.projectCodeActual,
        estado: inc.estado ?? '',
        referenciaRecaudo: inc.referenciaRecaudo ?? '',
        zohoId: inc.zohoId,
      });
    }
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project-code-inconsistentes-${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={styles.card}>
      <div>
        <h2 className={styles.cardTitle}>Project Code inconsistentes</h2>
        <p className={styles.cardHint}>Detecta inmuebles cuyo Project_Code de Zoho no coincide con su propia unidad -- señal de que fue copiado por error de otro apartamento del mismo frente. Problema de datos en Zoho, no de la sincronización.</p>
      </div>

      <div>
        <Button variant="secondary" onClick={handleVerificar} disabled={cargando}>
          <FileSearch size={14} />
          {cargando ? 'Verificando…' : 'Verificar Project Code'}
        </Button>
      </div>

      {error && (
        <div className={styles.statusError}>
          <XCircle size={14} /> <span>Error: {error}</span>
        </div>
      )}

      {reporte && reporte.total === 0 && (
        <div className={styles.statusOk}>
          <Check size={14} /> <span>Sin inconsistencias -- todos los Project_Code coinciden con su propia unidad.</span>
        </div>
      )}

      {reporte && reporte.total > 0 && (
        <>
          <div className={styles.statusWarning}>
            <AlertTriangle size={14} /> <span>{reporte.total} inmuebles con Project_Code copiado de otra unidad.</span>
          </div>
          <div className={styles.torreLista}>
            {reporte.porTorre.map((t) => (
              <div key={t.torre} className={styles.torreFila}>
                <span>{t.torre}</span>
                <Badge variant="warning">{t.count}</Badge>
              </div>
            ))}
          </div>
          <div>
            <Button variant="secondary" onClick={handleDescargar}>
              <Download size={13} /> Descargar Excel
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export function SincronizacionPage() {
  return (
    <div className={styles.page}>
      <AccesosLayout>
        <div className={styles.header}>
          <div className={styles.headerRow}>
            <div>
              <h1 className={styles.title}>Sincronización de datos</h1>
              <p className={styles.subtitle}>Herramientas de mantenimiento sobre los datos que vienen de Zoho.</p>
            </div>
          </div>
        </div>

        <BackfillSubformsCard />
        <ProjectCodeReportCard />
      </AccesosLayout>
    </div>
  );
}
