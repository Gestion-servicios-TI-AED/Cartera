// Encargos fiduciarios de Baía Kristal: buscar + filtro por proyecto/código (con
// descripción legible), edición en línea de nombre/código, eliminar con
// confirmación y subida de uno o varios Excel a la vez con un resumen de
// resultados. La interfaz vive en EncargosLista.jsx (compartida con Oliv).
import { listEncargos, uploadFiducia, updateEncargo, removeEncargo } from '../../api/fiducia.js';
import { EncargosLista } from './EncargosLista.jsx';

const CONFIG = {
  titulo: 'Encargos fiduciarios',
  subtitulo: 'Excel de movimientos de Baía Kristal',
  claveFiltros: 'fiducia-encargos',
  rutaBase: '/fiducia',
  api: { list: listEncargos, upload: (file) => uploadFiducia(file), update: updateEncargo, remove: removeEncargo },
  conProyecto: true,
  conFecha: false,
  avisoEliminar: 'Se borrarán todas sus hojas.',
};

export function EncargosListPage() {
  return <EncargosLista config={CONFIG} />;
}
