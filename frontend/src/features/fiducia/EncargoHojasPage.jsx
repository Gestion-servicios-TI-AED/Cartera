// Visor de las hojas crudas del Excel de un encargo -- en el legado
// (FiduciaDetalle.jsx, ruta /fiducia/:id) esta pantalla quedaba huérfana,
// sin ningún link real hacia ella (el click de la lista iba directo a
// EncargoNomenclaturasPage); acá se mantiene como vista secundaria,
// enlazada desde el header de esa página ("Ver hojas del Excel"), en vez de
// perderla del todo.
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getEncargo } from '../../api/fiducia.js';
import { EncargoHojasVista } from './HojasVistas.jsx';

export function EncargoHojasPage() {
  const { id } = useParams();
  const [encargo, setEncargo] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    getEncargo(id)
      .then((res) => setEncargo(res.data))
      .finally(() => setCargando(false));
  }, [id]);

  if (cargando) return <p>Cargando…</p>;
  if (!encargo) return <p>No encontrado.</p>;

  return <EncargoHojasVista encargo={encargo} volverA={`/fiducia/${id}`} volverLabel={encargo.nombre} rutaHoja={(hojaId) => `/fiducia/${id}/hojas/${hojaId}`} />;
}
