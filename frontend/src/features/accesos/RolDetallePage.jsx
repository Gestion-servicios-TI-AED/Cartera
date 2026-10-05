// Estructura pixel a pixel calcada de Solicitudes-Indirectos (Contratación
// AED) -- frontend/src/features/configuracion/RolDetallePage.jsx -- pedido
// explícito del usuario. Sin "Alcance de solicitudes" ni "Otros permisos"
// (conceptos propios de Contratación que Cartera no tiene). El árbol de
// ModuloPermisos.jsx usa proyecto→módulos en vez de nav-section→ver/crear.
// Sin GET /roles/:id -- se busca en memoria sobre listRoles() (pocos roles
// no lo justifica). Identificado por :id (no por :nombre) para poder
// renombrar el rol sin romper la URL -- ver rol.schema.js.
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BackLink } from '../../components/ui/BackLink.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Field, TextInput } from '../../components/ui/Field.jsx';
import { listRoles, updateRol } from '../../api/roles.js';
import { MODULOS_POR_PROYECTO } from '../../config/modulosPorProyecto.js';
import { ModuloPermisos } from './ModuloPermisos.jsx';
import { AccesosLayout } from '../../components/layout/AccesosLayout.jsx';
import styles from './Roles.module.css';

export function RolDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [permisos, setPermisos] = useState(null); // Set
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    listRoles()
      .then((res) => {
        const encontrado = res.data.find((r) => String(r.id) === id);
        if (!encontrado) throw new Error('Rol no encontrado');
        setNombre(encontrado.nombre);
        setPermisos(new Set(encontrado.permisos));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleGuardar() {
    setSaving(true);
    setError(null);
    try {
      await updateRol(id, { nombre, permisos: Array.from(permisos) });
      navigate('/accesos/roles');
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <AccesosLayout>
          <div className={styles.loadingState}>Cargando...</div>
        </AccesosLayout>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <AccesosLayout>
        <div className={styles.header}>
          <BackLink to="/accesos/roles">Roles</BackLink>
          <div className={styles.headerRow}>
            <h1 className={styles.title}>Editar rol</h1>
            <Button type="button" variant="primary" onClick={handleGuardar} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>

        {error && (
          <div className={styles.errorBanner} role="alert">
            {error}
          </div>
        )}

        <div className={styles.card}>
          <div className={styles.section}>
            <div className={styles.row}>
              <Field className={styles.fieldMd} label="Nombre" required>
                {(fp) => <TextInput {...fp} value={nombre} onChange={(e) => setNombre(e.target.value)} />}
              </Field>
            </div>
            {MODULOS_POR_PROYECTO.map(({ proyecto, items }) => (
              <ModuloPermisos key={proyecto} titulo={proyecto} items={items} permisos={permisos} onChange={setPermisos} />
            ))}
          </div>
        </div>
      </AccesosLayout>
    </div>
  );
}
