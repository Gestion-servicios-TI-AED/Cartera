// Copiado del patrón real de Solicitudes-Indirectos (Contratación AED)
// -- frontend/src/features/configuracion/RolDetallePage.jsx#ModuloPermisos
// -- pedido explícito del usuario: la matriz de permisos de un rol se ve
// pixel a pixel igual (árbol padre/hijos), con el padre = proyecto (Baía
// Kristal/Alegra) e hijos = los módulos de ese proyecto (en vez de
// nav-section/ver-crear, que es lo que separa en hijos en Contratación).
// El checkbox del padre es solo un atajo para marcar/desmarcar todos sus
// hijos de una (si ya hay alguno marcado, los desmarca todos; si no hay
// ninguno, los marca todos) -- no existe un permiso propio "acceso total a
// Baía Kristal" en la base, el acceso real depende únicamente de qué
// módulos tenga marcados.
import { Checkbox } from '../../components/ui/Checkbox.jsx';
import styles from './Roles.module.css';

export function ModuloPermisos({ titulo, items, permisos, onChange }) {
  if (items.length === 0) return null;
  const algunoMarcado = items.some((item) => permisos.has(item.key));

  function toggleTodos() {
    const nuevos = new Set(permisos);
    if (algunoMarcado) items.forEach((item) => nuevos.delete(item.key));
    else items.forEach((item) => nuevos.add(item.key));
    onChange(nuevos);
  }

  function toggleUno(key) {
    const nuevos = new Set(permisos);
    if (nuevos.has(key)) nuevos.delete(key);
    else nuevos.add(key);
    onChange(nuevos);
  }

  return (
    <div>
      <Checkbox label={titulo} checked={algunoMarcado} onChange={toggleTodos} />
      <div className={styles.moduloItems}>
        {items.map((item) => (
          <Checkbox key={item.key} label={item.label} checked={permisos.has(item.key)} onChange={() => toggleUno(item.key)} />
        ))}
      </div>
    </div>
  );
}
