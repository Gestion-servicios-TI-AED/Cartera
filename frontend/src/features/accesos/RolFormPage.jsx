// Sin equivalente literal en Solicitudes-Indirectos (esa referencia no
// tiene ruta de creación de rol, sus ~9 roles nacen por seed/migración) --
// mismo árbol padre/hijos que RolDetallePage.jsx (ModuloPermisos.jsx) para
// que crear y editar un rol se vean y se comporten idéntico.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackLink } from '../../components/ui/BackLink.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Field, TextInput } from '../../components/ui/Field.jsx';
import { createRol } from '../../api/roles.js';
import { MODULOS_POR_PROYECTO } from '../../config/modulosPorProyecto.js';
import { ModuloPermisos } from './ModuloPermisos.jsx';
import { AccesosLayout } from '../../components/layout/AccesosLayout.jsx';
import styles from './Roles.module.css';

export function RolFormPage() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [permisos, setPermisos] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setFieldErrors({});
    try {
      await createRol({ nombre, permisos: Array.from(permisos) });
      navigate('/accesos/roles');
    } catch (err) {
      setError(err.message);
      setFieldErrors(err.details?.fieldErrors ?? {});
      setSaving(false);
    }
  }

  return (
    <div className={styles.page}>
      <AccesosLayout>
        <div className={styles.header}>
          <BackLink to="/accesos/roles">Roles</BackLink>
          <div className={styles.headerRow}>
            <div>
              <h1 className={styles.title}>Crear rol</h1>
              <p className={styles.subtitle}>El nombre no se podrá cambiar después de crearlo.</p>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          {error && (
            <div className={styles.formError} role="alert">
              {error}
            </div>
          )}

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.section}>
              <div className={styles.row}>
                <Field className={styles.fieldMd} label="Nombre" required error={fieldErrors.nombre?.[0]}>
                  {(fp) => <TextInput {...fp} value={nombre} onChange={(e) => setNombre(e.target.value)} />}
                </Field>
              </div>

              {MODULOS_POR_PROYECTO.map(({ proyecto, items }) => (
                <ModuloPermisos key={proyecto} titulo={proyecto} items={items} permisos={permisos} onChange={setPermisos} />
              ))}
            </div>

            <div className={styles.actions}>
              <Button type="button" variant="secondary" onClick={() => navigate('/accesos/roles')}>Cancelar</Button>
              <div className={styles.actionsEnd}>
                <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Guardando...' : 'Crear rol'}</Button>
              </div>
            </div>
          </form>
        </div>
      </AccesosLayout>
    </div>
  );
}
