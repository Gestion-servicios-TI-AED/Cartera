// Extraído de NegociosPage.jsx (primer módulo con layout maestro-detalle) --
// cualquier página con un panel de sidebar+detalle que necesite scroll
// independiente por columna reutiliza este mismo hook.
//
// Un layout maestro-detalle necesita un alto EXACTO (no `auto`) para que el
// sidebar y el panel de detalle puedan scrollear cada uno por su cuenta --
// pero `height: 100%` no sirve: el contenedor que realmente scrollea
// (`.scrollArea` del AppShell) es un item flex sin un `height` propio (solo
// `flex: 1`), y un porcentaje no se resuelve contra el alto "usado" de un
// item flex, solo contra un alto explícito -- termina cayendo a `auto` (alto
// según el contenido) en vez del alto real disponible. En lugar de adivinar
// ese alto con un `calc(100vh - Npx)` a mano (fragil si cambia el
// topbar/padding del AppShell), se mide en JS: se busca el ancestro que de
// verdad scrollea (`overflow-y: auto/scroll`) y se usa su alto de contenido
// real, recalculado en cada resize.
import { useEffect, useState } from 'react';

export function useAlturaDisponible(ref) {
  const [altura, setAltura] = useState(null);

  useEffect(() => {
    function recalcular() {
      const el = ref.current;
      if (!el) return;
      let ancestro = el.parentElement;
      while (ancestro && !['auto', 'scroll'].includes(getComputedStyle(ancestro).overflowY)) {
        ancestro = ancestro.parentElement;
      }
      if (!ancestro) return;
      const cs = getComputedStyle(ancestro);
      const disponible = ancestro.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      setAltura(disponible);
    }
    recalcular();
    window.addEventListener('resize', recalcular);
    return () => window.removeEventListener('resize', recalcular);
  }, [ref]);

  return altura;
}
