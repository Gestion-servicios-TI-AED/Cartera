// Layout maestro-detalle de Negocios de Oliv -- calcado de
// negocios/NegociosPage.jsx (Baía Kristal), pero sin el panel de
// estadísticas (no hay un endpoint de stats para Oliv todavía, ni un botón
// de sincronizar: Negocios de Oliv es una vista compuesta en vivo sobre
// Oportunidad+Inmueble, no algo que se sincronice aparte -- ver el
// comentario de cabecera de backend/src/modules/olivNegocio/olivNegocio.service.js).
// Sin selección se muestra un placeholder simple en su lugar.
import { useCallback, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAlturaDisponible } from '../../hooks/useAlturaDisponible.js';
import { OlivNegociosSidebar } from './OlivNegociosSidebar.jsx';
import { OlivNegocioDetalleContenido } from './OlivNegocioDetalleContenido.jsx';
import styles from '../negocios/NegociosPage.module.css';

function SinSeleccionPanel({ isEmpty }) {
  return (
    <div className={styles.centrado}>
      <p className={styles.emptyTitulo}>{isEmpty ? 'Sin negocios cargados' : 'Selecciona un negocio'}</p>
      <p className={styles.emptyTexto}>
        {isEmpty ? 'Los negocios se generan a partir de las oportunidades de Oliv en etapa 8 o superior.' : 'Elige un negocio de la lista para ver el detalle completo.'}
      </p>
    </div>
  );
}

export function OlivNegociosPage() {
  const { id } = useParams();
  const [isEmpty, setIsEmpty] = useState(false);
  const layoutRef = useRef(null);
  const altura = useAlturaDisponible(layoutRef);

  const handleSidebarData = useCallback(({ isEmpty: vacio }) => {
    setIsEmpty(vacio);
  }, []);

  return (
    <div className={styles.layout} ref={layoutRef} style={altura ? { height: `${altura}px` } : undefined}>
      <OlivNegociosSidebar selectedId={id ?? null} onDatosCargados={handleSidebarData} />
      <div className={styles.panel} data-lenis-prevent>
        {id ? <OlivNegocioDetalleContenido key={id} id={id} /> : <SinSeleccionPanel isEmpty={isEmpty} />}
      </div>
    </div>
  );
}
