// Visor de una hoja cruda del Excel de Oliv -- calcado de
// fiducia/HojaViewerPage.jsx (Baía Kristal), tabla genérica columnas+filas
// tal cual llegaron del Excel, sin asumir ningún nombre de columna.
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getHojaOliv } from '../../api/oliv.js';
import { HojaVisorVista } from '../fiducia/HojasVistas.jsx';

export function OlivHojaViewerPage() {
  const { id, hojaId } = useParams();
  const [hoja, setHoja] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    getHojaOliv(id, hojaId, { page: pagina, limit: 200 })
      .then((res) => setHoja(res.data))
      .finally(() => setCargando(false));
  }, [id, hojaId, pagina]);

  if (cargando && !hoja) return <p>Cargando…</p>;
  if (!hoja) return <p>No encontrada.</p>;

  return <HojaVisorVista hoja={hoja} pagina={pagina} onPagina={setPagina} volverA={`/oliv/encargos/${id}`} />;
}
