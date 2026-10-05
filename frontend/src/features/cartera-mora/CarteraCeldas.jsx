// Celdas compartidas de "Cartera en Gestión" (Baía Kristal y Oliv). Rediseño
// 2026-10-05: en vez de 10 columnas de texto plano, cada fila se lee de un
// vistazo -- quién debe (avatar), qué inmueble, qué tan grave (chip de días y
// barra de % en mora).
import { formatCOP } from '../../utils/format.js';
import styles from './CarteraMoraPage.module.css';

function iniciales(nombre = '') {
  const partes = String(nombre).trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '—';
  return (partes[0][0] + (partes[1]?.[0] ?? '')).toUpperCase();
}

export function CeldaComprador({ nombre, sub }) {
  return (
    <div className={styles.persona}>
      <span className={styles.avatar}>{iniciales(nombre)}</span>
      <div className={styles.personaTexto}>
        <p className={styles.personaNombre} title={nombre ?? ''}>{nombre ?? '—'}</p>
        {sub ? <p className={styles.personaSub}>{sub}</p> : null}
      </div>
    </div>
  );
}

// `principal` ya viene como nodo (puede ser un <Link>); `sub` es la ubicación.
export function CeldaInmueble({ principal, sub }) {
  return (
    <div className={styles.inmueble}>
      <p className={styles.inmueblePrincipal}>{principal}</p>
      {sub ? <p className={styles.personaSub}>{sub}</p> : null}
    </div>
  );
}

// Severidad por días de atraso: mismos tramos que "Antigüedad de la mora".
export function ChipDias({ dias }) {
  const n = Number(dias) || 0;
  const nivel = n > 60 ? styles.sevAlta : n > 30 ? styles.sevMedia : styles.sevBaja;
  return <span className={`${styles.chipDias} ${nivel}`}>{n} d</span>;
}

export function BarraMora({ pct }) {
  if (pct == null) return <span className={styles.muted}>—</span>;
  return (
    <div className={styles.barraMora}>
      <span className={styles.barraMoraValor}>{pct.toFixed(1)}%</span>
      <span className={styles.barraMoraPista}>
        <span className={styles.barraMoraRelleno} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
      </span>
    </div>
  );
}

export function ValorVencido({ valor }) {
  return <span className={styles.valorVencido}>{formatCOP(valor)}</span>;
}
