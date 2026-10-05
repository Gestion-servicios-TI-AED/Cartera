// Adaptado 1:1 de Human-Resource-Management-System-AED/frontend/src/features/
// usuarios/UsuarioFormPage.jsx -- misma estructura/CSS exacta (BackLink,
// header propio arriba de AccesosLayout, .card con .form/.section/.row).
// Cambia el contenido de negocio: el HRMS vincula el usuario a un
// `empleado` (rol rrhh/empleado); acá se eligen roles dinámicos (ver
// ARQUITECTURA-BACKEND.md, "Roles y permisos dinámicos" -- reemplaza el
// anterior par esAdmin/modulosPermitidos, migrado por completo). A
// diferencia del HRMS (que excluye su reservado EMPLEADO de la lista, esas
// cuentas se crean solas), acá ADMIN SÍ es un rol asignable normal más
// desde este formulario -- Cartera no tiene un segundo tipo de cuenta de
// autoservicio. Tampoco existe "Generar contraseña aleatoria" -- el backend
// de Cartera no tiene ese endpoint, el reset de contraseña es siempre
// manual.
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BackLink } from '../../components/ui/BackLink.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { CheckboxGroup } from '../../components/ui/CheckboxGroup.jsx';
import { Field, TextInput } from '../../components/ui/Field.jsx';
import { createUsuario, getUsuario, updateUsuario, removeUsuarioDefinitivo } from '../../api/usuarios.js';
import { listRoles } from '../../api/roles.js';
import { AccesosLayout } from '../../components/layout/AccesosLayout.jsx';
import styles from './Usuarios.module.css';

const PASSWORD_HELP = 'Mínimo 8 caracteres, incluye una mayúscula, un número y un carácter especial (!@#$%…).';

const EMPTY_FORM = { nombre: '', email: '', password: '', roles: [] };

export function UsuarioFormPage({ mode }) {
  const isEdit = mode === 'editar';
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [usuarioEditado, setUsuarioEditado] = useState(null); // solo en editar: para el titulo ("Editar NOMBRE")
  // Roles asignables vienen en vivo de GET /roles -- un rol creado desde
  // Accesos > Roles queda asignable de inmediato, sin tocar este archivo.
  const [opcionesRoles, setOpcionesRoles] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [requisitosFaltantes, setRequisitosFaltantes] = useState(null);

  useEffect(() => {
    listRoles()
      .then((res) => setOpcionesRoles(res.data.map((rol) => ({ value: rol.nombre, label: rol.nombre }))))
      .catch(() => {
        // Secundario -- si falla, el selector de roles queda vacio.
      });

    if (!isEdit) return;
    getUsuario(id)
      .then((res) => {
        setUsuarioEditado(res.data);
        setForm((prev) => ({ ...prev, nombre: res.data.nombre, email: res.data.email, roles: res.data.roles }));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [isEdit, id]);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setFieldErrors({});
    setRequisitosFaltantes(null);

    try {
      if (isEdit) {
        const payload = { nombre: form.nombre, email: form.email, roles: form.roles };
        if (form.password) payload.password = form.password;
        await updateUsuario(id, payload);
      } else {
        await createUsuario({
          nombre: form.nombre,
          email: form.email,
          password: form.password,
          roles: form.roles,
        });
      }
      navigate('/accesos/usuarios');
    } catch (err) {
      setError(err.message);
      setFieldErrors(err.details?.fieldErrors ?? {});
      setRequisitosFaltantes(err.details?.requisitos_faltantes ?? null);
      setSaving(false);
    }
  }

  // Eliminacion fisica real -- solo se renderiza (mas abajo) cuando el
  // usuario ya esta desactivado, y el backend la rechaza igual si no lo
  // esta. Irreversible: confirmacion nativa del navegador antes de disparar
  // el request (este codebase no usa modales para flujos, y esto es un
  // click destructivo unico, no un flujo).
  async function handleEliminarDefinitivo() {
    const confirmado = window.confirm(`¿Eliminar a ${usuarioEditado?.nombre ?? 'este usuario'} permanentemente? Esta acción no se puede deshacer.`);
    if (!confirmado) return;
    setEliminando(true);
    setError(null);
    try {
      await removeUsuarioDefinitivo(id);
      navigate('/accesos/usuarios');
    } catch (err) {
      setError(err.message);
      setEliminando(false);
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
          <div>
            <BackLink to="/accesos/usuarios">Usuarios</BackLink>
            <div className={styles.headerRow}>
              <div>
                <h1 className={styles.title}>{isEdit ? `Editar ${usuarioEditado?.nombre ?? 'usuario'}` : 'Crear usuario'}</h1>
                <p className={styles.subtitle}>{isEdit ? 'Todo se puede cambiar, incluidos el email y los roles.' : 'Da acceso al sistema a una persona.'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          {error && (
            <div className={styles.formError} role="alert">
              <div>
                {error}
                {requisitosFaltantes && (
                  <ul>
                    {requisitosFaltantes.map((req) => <li key={req}>{req}</li>)}
                  </ul>
                )}
              </div>
            </div>
          )}

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.section}>
              <div className={styles.row}>
                <Field className={styles.fieldLg} label="Nombre" required error={fieldErrors.nombre?.[0]}>
                  {(fp) => <TextInput {...fp} value={form.nombre} onChange={(e) => setField('nombre', e.target.value)} />}
                </Field>

                <Field className={styles.fieldLg} label="Email" required error={fieldErrors.email?.[0]}>
                  {(fp) => <TextInput {...fp} type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} />}
                </Field>
              </div>

              <div className={styles.row}>
                <Field
                  className={styles.fieldLg}
                  label={isEdit ? 'Nueva contraseña' : 'Contraseña'}
                  required={!isEdit}
                  error={fieldErrors.password?.[0]}
                  helper={isEdit ? 'Dejar en blanco para no cambiar la contraseña actual.' : PASSWORD_HELP}
                >
                  {(fp) => <TextInput {...fp} type="password" value={form.password} onChange={(e) => setField('password', e.target.value)} />}
                </Field>
              </div>

              <div className={styles.row}>
                <CheckboxGroup label="Roles" options={opcionesRoles} value={form.roles} onChange={(roles) => setField('roles', roles)} />
              </div>
              {fieldErrors.roles?.[0] && <p className={styles.formError}>{fieldErrors.roles[0]}</p>}
            </div>

            <div className={styles.actions}>
              <div className={styles.actionsEnd}>
                <Button type="button" variant="secondary" onClick={() => navigate('/accesos/usuarios')}>Cancelar</Button>
                {isEdit && usuarioEditado?.activo === false && (
                  <Button type="button" variant="danger" disabled={eliminando} onClick={handleEliminarDefinitivo}>
                    {eliminando ? 'Eliminando...' : 'Eliminar permanentemente'}
                  </Button>
                )}
              </div>
              <div className={styles.actionsEnd}>
                <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear usuario'}</Button>
              </div>
            </div>
          </form>
        </div>
      </AccesosLayout>
    </div>
  );
}
