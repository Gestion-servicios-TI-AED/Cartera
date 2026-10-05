// Mismo diseño que el formulario de usuario del HRMS (migración de diseño
// 2026-10-05): banner de detalle (Detail Hero) al editar, secciones en tarjetas
// (Cuenta / Roles y acceso / Contraseña) y barra de acciones. Cartera no tiene
// cuentas de empleado: los roles son siempre de staff y ADMIN es un rol
// asignable más. Se conserva "Eliminar permanentemente" (solo cuentas ya
// desactivadas), que el HRMS no tiene.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BackLink } from '../../components/ui/BackLink.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Field, TextInput } from '../../components/ui/Field.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Checkbox } from '../../components/ui/Checkbox.jsx';
import { CheckboxGroup } from '../../components/ui/CheckboxGroup.jsx';
import { createUsuario, generarPasswordUsuario, getUsuario, removeUsuarioDefinitivo, updateUsuario } from '../../api/usuarios.js';
import { listRoles } from '../../api/roles.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import { MODULOS_POR_PROYECTO } from '../../config/modulosPorProyecto.js';
import { AccesosLayout } from '../../components/layout/AccesosLayout.jsx';
import layoutStyles from '../../components/layout/WizardLayout.module.css';
import { iniciales, fmtFecha, fmtAcceso } from './usuarioUtils.js';
import styles from './Usuarios.module.css';

const PASSWORD_HELP = 'Mínimo 8 caracteres, incluye una mayúscula, un número y un carácter especial (!@#$%…).';

const EMPTY_FORM = { nombre: '', email: '', password: '', roles: [], activo: true };

// slug de módulo -> "Proyecto · Módulo", para mostrar qué otorgan los roles elegidos.
const ETIQUETAS_MODULOS = Object.fromEntries(
  MODULOS_POR_PROYECTO.flatMap((grupo) => grupo.items.map((item) => [item.key, `${grupo.proyecto} · ${item.label}`]))
);

export function UsuarioFormPage({ mode }) {
  const isEdit = mode === 'editar';
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario: usuarioActual } = useAuth();

  const [form, setForm] = useState(EMPTY_FORM);
  const [usuarioEditado, setUsuarioEditado] = useState(null);
  // Roles asignables vienen en vivo de GET /roles -- un rol creado desde
  // Accesos > Roles queda asignable de inmediato, sin tocar este archivo.
  const [rolesCatalogo, setRolesCatalogo] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [requisitosFaltantes, setRequisitosFaltantes] = useState(null);
  const [generando, setGenerando] = useState(false);
  const [passwordGenerada, setPasswordGenerada] = useState(null);

  useEffect(() => {
    listRoles()
      .then((res) => setRolesCatalogo(res.data))
      .catch(() => {
        // Secundario -- si falla, el selector de roles queda vacio.
      });

    if (!isEdit) return;
    getUsuario(id)
      .then((res) => {
        setUsuarioEditado(res.data);
        setForm((prev) => ({ ...prev, nombre: res.data.nombre, email: res.data.email, roles: res.data.roles, activo: res.data.activo }));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [isEdit, id]);

  const opcionesRoles = useMemo(() => rolesCatalogo.map((rol) => ({ value: rol.nombre, label: rol.nombre })), [rolesCatalogo]);
  const permisosPorRol = useMemo(() => Object.fromEntries(rolesCatalogo.map((rol) => [rol.nombre, rol.permisos ?? []])), [rolesCatalogo]);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // Genera y GUARDA de una vez una contraseña temporal nueva (no depende de
  // "Guardar cambios"). Se muestra una sola vez.
  async function handleGenerarPassword() {
    setGenerando(true);
    setError(null);
    setPasswordGenerada(null);
    try {
      const res = await generarPasswordUsuario(id);
      setPasswordGenerada(res.data.password);
      setField('password', '');
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerando(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setFieldErrors({});
    setRequisitosFaltantes(null);

    try {
      if (isEdit) {
        const payload = { nombre: form.nombre, roles: form.roles, activo: form.activo };
        if (form.password) payload.password = form.password;
        await updateUsuario(id, payload);
      } else {
        await createUsuario({ nombre: form.nombre, email: form.email, password: form.password, roles: form.roles });
      }
      navigate('/accesos/usuarios');
    } catch (err) {
      setError(err.message);
      setFieldErrors(err.details?.fieldErrors ?? {});
      setRequisitosFaltantes(err.details?.requisitos_faltantes ?? null);
      setSaving(false);
    }
  }

  async function handleEliminarDefinitivo() {
    if (!window.confirm(`¿Eliminar permanentemente a ${usuarioEditado?.nombre}? Esta acción no se puede deshacer.`)) return;
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

  const esAdmin = rolesCatalogo.some((rol) => rol.es_admin && form.roles.includes(rol.nombre)) || form.roles.includes('ADMIN');
  const permisosEfectivos = [...new Set(form.roles.flatMap((rol) => permisosPorRol[rol] ?? []))];
  const esMismaCuenta = usuarioActual?.id === usuarioEditado?.id;

  const errorBanner = error && (
    <div className={styles.formError} role="alert">
      <div>
        {error}
        {requisitosFaltantes && (
          <ul>
            {requisitosFaltantes.map((req) => (
              <li key={req}>{req}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  return (
    <div className={styles.page}>
      <AccesosLayout>
        <BackLink to="/accesos/usuarios">Usuarios</BackLink>

        {isEdit && usuarioEditado ? (
          <section className={layoutStyles.hero}>
            <div className={layoutStyles.heroAvatar}>{iniciales(usuarioEditado.nombre)}</div>
            <div className={layoutStyles.heroInfo}>
              <h1 className={layoutStyles.heroName}>{usuarioEditado.nombre}</h1>
              <p className={layoutStyles.heroRole}>{usuarioEditado.email}</p>
              <p className={layoutStyles.heroMeta}>
                Cuenta creada el {fmtFecha(usuarioEditado.creado_en)} · Último acceso: {fmtAcceso(usuarioEditado.ultimo_acceso) ?? 'nunca ha iniciado sesión'}
              </p>
            </div>
            <div className={layoutStyles.heroSide}>
              <Badge variant={usuarioEditado.activo ? 'success' : 'neutral'} dot={usuarioEditado.activo}>
                {usuarioEditado.activo ? 'Activo' : 'Inactivo'}
              </Badge>
              <Badge variant={usuarioEditado.debe_cambiar_password ? 'warning' : 'success'}>
                {usuarioEditado.debe_cambiar_password ? 'Primer ingreso pendiente' : 'Primer ingreso completado'}
              </Badge>
            </div>
          </section>
        ) : (
          <div>
            <h1 className={styles.title}>Crear usuario</h1>
            <p className={styles.subtitle}>Da acceso al sistema a una persona y elige los roles que definen a qué módulos entra.</p>
          </div>
        )}

        {errorBanner}

        <form className={styles.formStack} onSubmit={handleSubmit}>
          <section className={styles.sectionCard}>
            <div>
              <h2 className={styles.sectionTitle}>Cuenta</h2>
              <p className={styles.sectionHint}>{isEdit ? 'El correo no se puede cambiar.' : 'Datos con los que la persona inicia sesión.'}</p>
            </div>
            <div className={styles.row}>
              <Field className={styles.fieldLg} label="Nombre" required error={fieldErrors.nombre?.[0]}>
                {(fp) => <TextInput {...fp} value={form.nombre} onChange={(e) => setField('nombre', e.target.value)} />}
              </Field>

              {isEdit ? (
                <Field className={styles.fieldLg} label="Correo">
                  {(fp) => <TextInput {...fp} value={usuarioEditado?.email ?? ''} disabled />}
                </Field>
              ) : (
                <Field className={styles.fieldLg} label="Correo" required error={fieldErrors.email?.[0]}>
                  {(fp) => <TextInput {...fp} type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} />}
                </Field>
              )}
            </div>
          </section>

          <section className={styles.sectionCard}>
            <div>
              <h2 className={styles.sectionTitle}>Roles y acceso</h2>
              <p className={styles.sectionHint}>Los roles definen a qué módulos entra esta cuenta.</p>
            </div>
            <CheckboxGroup label="Roles" options={opcionesRoles} value={form.roles} onChange={(roles) => setField('roles', roles)} />
            {fieldErrors.roles?.[0] && <p className={styles.formError}>{fieldErrors.roles[0]}</p>}

            <div>
              <p className={styles.permisosTitulo}>Módulos que otorgan los roles elegidos</p>
              {esAdmin ? (
                <p className={styles.permisosVacio}>Acceso total al sistema (rol de administrador).</p>
              ) : permisosEfectivos.length > 0 ? (
                <div className={styles.permisosChips}>
                  {permisosEfectivos.map((slug) => (
                    <Badge key={slug} variant="info">
                      {ETIQUETAS_MODULOS[slug] ?? slug}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className={styles.permisosVacio}>Ningún módulo con los roles actuales.</p>
              )}
            </div>

            {isEdit && (
              <Checkbox
                label="Cuenta activa"
                checked={form.activo}
                disabled={esMismaCuenta && form.activo}
                title={esMismaCuenta && form.activo ? 'No puedes desactivarte a ti mismo' : undefined}
                onChange={(e) => setField('activo', e.target.checked)}
              />
            )}
          </section>

          <section className={styles.sectionCard}>
            <div>
              <h2 className={styles.sectionTitle}>Contraseña</h2>
              <p className={styles.sectionHint}>
                {isEdit
                  ? usuarioEditado?.debe_cambiar_password
                    ? 'Esta persona aún no ha cambiado su contraseña inicial.'
                    : 'Deja el campo en blanco para conservar la contraseña actual.'
                  : PASSWORD_HELP}
              </p>
            </div>

            {passwordGenerada && (
              <div className={styles.passwordBanner} role="status">
                Contraseña temporal generada: <span className={styles.passwordValue}>{passwordGenerada}</span> — cópiala ahora, no se volverá a
                mostrar. Se le pedirá cambiarla en el primer inicio de sesión.
              </div>
            )}

            <div className={styles.row}>
              <Field
                className={styles.fieldLg}
                label={isEdit ? 'Nueva contraseña' : 'Contraseña'}
                required={!isEdit}
                error={fieldErrors.password?.[0]}
                helper={isEdit ? PASSWORD_HELP : undefined}
              >
                {(fp) => <TextInput {...fp} type="password" value={form.password} onChange={(e) => setField('password', e.target.value)} />}
              </Field>

              {isEdit && (
                <div className={styles.actionRow}>
                  <span className={styles.actionRowSpacer} aria-hidden="true">
                    &nbsp;
                  </span>
                  <Button type="button" variant="secondary" onClick={handleGenerarPassword} disabled={generando}>
                    {generando ? 'Generando...' : 'Generar contraseña aleatoria'}
                  </Button>
                </div>
              )}
            </div>
          </section>

          <div className={styles.actions}>
            <Button type="button" variant="secondary" onClick={() => navigate('/accesos/usuarios')}>
              Cancelar
            </Button>
            <div className={styles.actionsEnd}>
              {isEdit && usuarioEditado?.activo === false && (
                <Button type="button" variant="danger" disabled={eliminando} onClick={handleEliminarDefinitivo}>
                  {eliminando ? 'Eliminando...' : 'Eliminar permanentemente'}
                </Button>
              )}
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear usuario'}
              </Button>
            </div>
          </div>
        </form>
      </AccesosLayout>
    </div>
  );
}
