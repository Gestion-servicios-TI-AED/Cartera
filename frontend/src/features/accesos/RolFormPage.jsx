// Mismo diseño que la creación de rol del HRMS (migración de diseño 2026-10-05):
// tarjetas por sección (Datos del rol / Permisos por módulo) y barra de
// acciones. Cartera identifica el rol por :id (ver rol.schema.js).
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackLink } from '../../components/ui/BackLink.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Field, TextInput } from '../../components/ui/Field.jsx';
import { createRol } from '../../api/roles.js';
import { ModuloPermisos } from './ModuloPermisos.jsx';
import { AccesosLayout } from '../../components/layout/AccesosLayout.jsx';
import styles from './Roles.module.css';

export function RolFormPage() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [permisos, setPermisos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setFieldErrors({});
    try {
      await createRol({ nombre, permisos });
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
        <BackLink to="/accesos/roles">Roles</BackLink>
        <div>
          <h1 className={styles.title}>Crear rol</h1>
          <p className={styles.subtitle}>Define un conjunto de módulos para asignarlo a las cuentas.</p>
        </div>

        {error && (
          <div className={styles.formError} role="alert">
            {error}
          </div>
        )}

        <form className={styles.formStack} onSubmit={handleSubmit}>
          <section className={styles.sectionCard}>
            <div>
              <h2 className={styles.sectionTitle}>Datos del rol</h2>
              <p className={styles.sectionHint}>Cómo se mostrará en la lista de roles y al asignarlo a una cuenta.</p>
            </div>
            <div className={styles.row}>
              <Field className={styles.fieldMd} label="Nombre del rol" required error={fieldErrors.nombre?.[0]}>
                {(fp) => <TextInput {...fp} value={nombre} onChange={(e) => setNombre(e.target.value)} />}
              </Field>
            </div>
          </section>

          <section className={styles.sectionCard}>
            <div>
              <h2 className={styles.sectionTitle}>Permisos por módulo</h2>
              <p className={styles.sectionHint}>Marca los módulos a los que podrán entrar las cuentas con este rol.</p>
            </div>
            <ModuloPermisos value={permisos} onChange={setPermisos} />
          </section>

          <div className={styles.actions}>
            <Button type="button" variant="secondary" onClick={() => navigate('/accesos/roles')}>
              Cancelar
            </Button>
            <div className={styles.actionsEnd}>
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'Guardando...' : 'Crear rol'}
              </Button>
            </div>
          </div>
        </form>
      </AccesosLayout>
    </div>
  );
}
