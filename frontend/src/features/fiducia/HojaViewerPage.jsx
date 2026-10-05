import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getHoja } from '../../api/fiducia.js';
import { HojaVisorVista } from './HojasVistas.jsx';

export function HojaViewerPage() {
  const { id, hojaId } = useParams();
  const [hoja, setHoja] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    getHoja(id, hojaId, { page: pagina, limit: 200 })
      .then((res) => setHoja(res.data))
      .finally(() => setCargando(false));
  }, [id, hojaId, pagina]);

  if (cargando && !hoja) return <p>Cargando…</p>;
  if (!hoja) return <p>No encontrada.</p>;

  return <HojaVisorVista hoja={hoja} pagina={pagina} onPagina={setPagina} volverA={`/fiducia/${id}/hojas`} />;
}
