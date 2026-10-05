// Lista de Excels de movimientos subidos para Oliv. Misma interfaz que Baía
// Kristal (fiducia/EncargosLista.jsx), simplificada: sin filtro por "Proyecto"
// (Oliv es un solo proyecto) y con la fecha del Excel (opcional al subir, vacía
// = hoy; una sola fecha por Encargo). Los movimientos se suben y guardan tal
// cual, sin interpretar ninguna columna en particular (todavía no están
// definidas las columnas de Oliv).
import { listEncargosOliv, uploadEncargoOliv, updateEncargoOliv, removeEncargoOliv } from '../../api/oliv.js';
import { EncargosLista } from '../fiducia/EncargosLista.jsx';

const CONFIG = {
  titulo: 'Encargos de Oliv',
  subtitulo: 'Excel de movimientos de Oliv',
  claveFiltros: 'oliv-encargos',
  rutaBase: '/oliv/encargos',
  api: { list: listEncargosOliv, upload: uploadEncargoOliv, update: updateEncargoOliv, remove: removeEncargoOliv },
  conProyecto: false,
  conFecha: true,
  avisoEliminar: 'Se borrarán todas sus hojas y movimientos.',
};

export function OlivEncargosListPage() {
  return <EncargosLista config={CONFIG} />;
}
