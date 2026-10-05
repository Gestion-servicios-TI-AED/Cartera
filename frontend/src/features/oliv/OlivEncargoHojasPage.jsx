// Hojas crudas de un Excel de Oliv subido -- calcada de
// fiducia/EncargoHojasPage.jsx (Baía Kristal). A diferencia de Baía Kristal
// (donde clickear un encargo va primero a una página de Nomenclaturas, que
// cruza con Negocio), acá esta es la página directa al clickear un encargo
// en la lista -- no hay todavía reglas para cruzar estos movimientos con un
// Negocio de Oliv (columnas aún no definidas).
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getEncargoOliv } from '../../api/oliv.js';
import { EncargoHojasVista } from '../fiducia/HojasVistas.jsx';

export function OlivEncargoHojasPage() {
  const { id } = useParams();
  const [encargo, setEncargo] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    getEncargoOliv(id)
      .then((res) => setEncargo(res.data))
      .finally(() => setCargando(false));
  }, [id]);

  if (cargando) return <p>Cargando…</p>;
  if (!encargo) return <p>No encontrado.</p>;

  return <EncargoHojasVista encargo={encargo} volverA="/oliv/encargos" volverLabel="Encargos de Oliv" rutaHoja={(hojaId) => `/oliv/encargos/${id}/hojas/${hojaId}`} />;
}
