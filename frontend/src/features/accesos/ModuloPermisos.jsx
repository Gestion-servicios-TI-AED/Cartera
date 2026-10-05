// Árbol de permisos por módulo, con el diseño del HRMS (PermisosPorModulo): un
// grupo por proyecto (Baía Kristal / Oliv / Configuración) y un checkbox por
// módulo. El checkbox del grupo marca/desmarca todos sus módulos de una; el
// acceso real depende únicamente de qué módulos tenga marcados -- no existe un
// permiso propio "acceso total a Baía Kristal". Compartido entre RolFormPage y
// RolDetallePage. Las etiquetas salen de config/modulosPorProyecto.js.
import { Checkbox } from '../../components/ui/Checkbox.jsx';
import { MODULOS_POR_PROYECTO } from '../../config/modulosPorProyecto.js';
import styles from './PermisosPorModulo.module.css';

export function ModuloPermisos({ value, onChange }) {
  function toggleGrupo(claves) {
    const todosMarcados = claves.every((clave) => value.includes(clave));
    onChange(todosMarcados ? value.filter((clave) => !claves.includes(clave)) : [...new Set([...value, ...claves])]);
  }

  function toggleUno(clave) {
    onChange(value.includes(clave) ? value.filter((item) => item !== clave) : [...value, clave]);
  }

  return (
    <div className={styles.tree} role="tree" aria-label="Permisos por módulo">
      {MODULOS_POR_PROYECTO.map(({ proyecto, items }) => {
        const claves = items.map((item) => item.key);
        // El grupo se ve marcado en cuanto hay UN módulo marcado: refleja la
        // misma condición que usa el sidebar para mostrar la categoría.
        const algunoMarcado = claves.some((clave) => value.includes(clave));
        return (
          <div key={proyecto} className={styles.group} role="treeitem" aria-expanded="true">
            <Checkbox label={proyecto} checked={algunoMarcado} onChange={() => (algunoMarcado ? onChange(value.filter((c) => !claves.includes(c))) : toggleGrupo(claves))} />
            <div className={styles.children} role="group">
              {items.map((item) => (
                <Checkbox key={item.key} className={styles.child} label={item.label} checked={value.includes(item.key)} onChange={() => toggleUno(item.key)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
