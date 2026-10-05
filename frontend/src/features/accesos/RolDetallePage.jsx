// Mismo diseño que el detalle de rol del HRMS (migración de diseño 2026-10-05):
// banner de detalle, tarjetas por sección, barra de acciones y confirmación de
// borrado en modal. Sin GET /roles/:id -- se busca en memoria sobre listRoles()
// (pocos roles no lo justifican). Identificado por :id (no por :nombre) para
// poder renombrar el rol sin romper la URL -- ver rol.schema.js.
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { BackLink } from '../../components/ui/BackLink.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Field, TextInput } from '../../components/ui/Field.jsx';
import { listRoles, updateRol, deleteRol } from '../../api/roles.js';
import { ModuloPermisos } from './ModuloPermisos.jsx';
import { AccesosLayout } from '../../components/layout/AccesosLayout.jsx';
import layoutStyles from '../../components/layout/WizardLayout.module.css';
import styles from './Roles.module.css';

export function RolDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rol, setRol] = useState(null);
  const [nombreEditado, setNombreEditado] = useState('');
  const [permisos, setPermisos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [confirmarBorrar, setConfirmarBorrar] = useState(false);

  useEffect(() => {
    listRoles()
      .then((res) => {
        const encontrado = res.data.find((r) => String(r.id) === id);
        if (!encontrado) throw new Error('Rol no encontrado');
        setRol(encontrado);
        setNombreEditado(encontrado.nombre);
        setPermisos(encontrado.permisos);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {};
      // El rol de administrador no se gobierna por modulos: solo se puede renombrar.
      if (!rol.es_admin) payload.permisos = permisos;
      if (nombreEditado.trim() !== rol.nombre) payload.nombre = nombreEditado.trim();
      await updateRol(id, payload);
      navigate('/accesos/roles');
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  async function handleBorrar() {
    setSaving(true);
    try {
      await deleteRol(id);
      navigate('/accesos/roles');
    } catch (err) {
      setConfirmarBorrar(false);
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

  if (!rol) {
    return (
      <div className={styles.page}>
        <AccesosLayout>
          <BackLink to="/accesos/roles">Roles</BackLink>
          <div className={styles.errorBanner} role="alert">
            {error ?? 'Rol no encontrado'}
          </div>
        </AccesosLayout>
      </div>
    );
  }

  const puedeBorrar = !rol.es_admin && rol.total_usuarios === 0;

  return (
    <div className={styles.page}>
      <AccesosLayout>
        <BackLink to="/accesos/roles">Roles</BackLink>

        <section className={layoutStyles.hero}>
          <div className={layoutStyles.heroAvatar}>
            <ShieldCheck size={34} strokeWidth={1.5} aria-hidden="true" />
          </div>
          <div className={layoutStyles.heroInfo}>
            <h1 className={layoutStyles.heroName}>{rol.nombre}</h1>
            <p className={layoutStyles.heroRole}>{rol.es_admin ? 'Rol del sistema' : 'Rol personalizado'}</p>
            <p className={layoutStyles.heroMeta}>{rol.es_admin ? 'Acceso total a todos los módulos' : `${rol.permisos.length} módulo(s) con acceso`}</p>
          </div>
          <div className={layoutStyles.heroSide}>
            <Badge variant="info">{rol.total_usuarios} cuenta(s)</Badge>
            {rol.total_usuarios > 0 && (
              <Link to={`/accesos/usuarios?rol=${encodeURIComponent(rol.nombre)}`} className={styles.heroLink}>
                Ver cuentas
              </Link>
            )}
          </div>
        </section>

        {error && (
          <div className={styles.formError} role="alert">
            {error}
          </div>
        )}

        <form className={styles.formStack} onSubmit={handleSubmit}>
          <section className={styles.sectionCard}>
            <div>
              <h2 className={styles.sectionTitle}>Nombre</h2>
              <p className={styles.sectionHint}>Al renombrar, las cuentas que tienen este rol lo conservan con el nombre nuevo.</p>
            </div>
            <div className={styles.row}>
              <Field className={styles.fieldMd} label="Nombre del rol" required>
                {(fp) => <TextInput {...fp} value={nombreEditado} onChange={(e) => setNombreEditado(e.target.value)} />}
              </Field>
            </div>
          </section>

          <section className={styles.sectionCard}>
            <div>
              <h2 className={styles.sectionTitle}>Permisos por módulo</h2>
              <p className={styles.sectionHint}>Marca los módulos a los que podrán entrar las cuentas con este rol.</p>
            </div>
            {rol.es_admin ? (
              <div className={styles.infoBanner}>El rol de administrador tiene acceso total y no se configura por módulos.</div>
            ) : (
              <ModuloPermisos value={permisos} onChange={setPermisos} />
            )}
          </section>

          <div className={styles.actions}>
            <Button type="button" variant="secondary" onClick={() => navigate('/accesos/roles')}>
              Cancelar
            </Button>
            <div className={styles.actionsEnd}>
              {puedeBorrar && (
                <Button type="button" variant="danger" onClick={() => setConfirmarBorrar(true)} disabled={saving}>
                  Eliminar rol
                </Button>
              )}
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </div>
        </form>

        <Modal
          open={confirmarBorrar}
          onClose={() => setConfirmarBorrar(false)}
          title="Eliminar rol"
          footer={
            <>
              <Button variant="secondary" onClick={() => setConfirmarBorrar(false)}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={handleBorrar} disabled={saving}>
                Eliminar
              </Button>
            </>
          }
        >
          <p>
            Se eliminará el rol <strong>{rol.nombre}</strong>. Ninguna cuenta lo tiene asignado.
          </p>
        </Modal>
      </AccesosLayout>
    </div>
  );
}
