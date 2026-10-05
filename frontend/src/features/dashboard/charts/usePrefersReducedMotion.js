// PLANTILLA (via HRMS aed) -- copiado tal cual, cero dependencias de
// CSS/estilo.
//
// Regla que resuelve: ApexCharts anima la entrada de barras/lineas por
// defecto y no respeta prefers-reduced-motion por su cuenta -- cada grafico
// apaga esa animacion (chart.animations.enabled) cuando aplica. Ver "Dashboard
// KPIs & Charts" en ARQUITECTURA-FRONTEND.md.
import { useEffect, useState } from 'react';

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (event) => setReduced(event.matches);
    query.addEventListener('change', handler);
    return () => query.removeEventListener('change', handler);
  }, []);

  return reduced;
}
