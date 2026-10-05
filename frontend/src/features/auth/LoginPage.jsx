// Copiado de plantilla-arquitectura/componentes/auth/frontend/LoginPage.jsx.
// El titular grande sobre la foto es un SLOGAN, no el nombre de la app (mismo
// criterio que el HRMS: "Un lugar para cada persona de tu equipo." ahí, no
// "HRMS AED") -- el nombre real solo vive en el sidebar (`AppShell.brandName`)
// y el `<title>` de la pestaña, nunca repetido acá.
// `/login-hero.jpg` es una foto aérea real del skyline de Cartagena
// (Bocagrande, donde operan los proyectos de AED) -- no un stock genérico,
// tal como exige la plantilla, y ya no atada a un solo proyecto (antes era
// la laguna de Baía Kristal). Fuente: Wikimedia Commons, foto de Bernard
// Gagnon ("View of Cartagena from Convento de Santa Cruz de la Popa"),
// licencia CC BY-SA 4.0 -- atribución requerida si se redistribuye la
// imagen fuera de esta app interna.
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Field, TextInput } from '../../components/ui/Field.jsx';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const perfil = await login(email, password);
      if (perfil.debe_cambiar_password) {
        navigate('/cambiar-password', { replace: true });
      } else {
        navigate(location.state?.from?.pathname ?? '/', { replace: true });
      }
    } catch (err) {
      setError(err.message ?? 'Credenciales incorrectas');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className={styles.splitWrap}>
      <div className={styles.brandPanel} aria-hidden="true">
        <div className={styles.brandTextBlock}>
          <h2 className={styles.brandHeadline}>Cada peso de tu cartera, bajo control.</h2>
          <p className={styles.brandSubtext}>Ventas, planes de pago y recaudo de los proyectos inmobiliarios de AED — todo en un solo sistema.</p>
        </div>
      </div>

      <div className={styles.formPanel}>
        <form className={styles.formInner} onSubmit={handleSubmit}>
          <img className={styles.formLogo} src="/aed-logo.png" alt="aed" />
          <h1 className={styles.formTitle}>Iniciar sesión</h1>
          <Field label="Correo" required>
            {(p) => <TextInput {...p} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />}
          </Field>
          <Field label="Contraseña" required>
            {(p) => <TextInput {...p} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />}
          </Field>
          {error && <p className={styles.error}>{error}</p>}
          <Button type="submit" disabled={enviando}>
            {enviando ? 'Ingresando…' : 'Ingresar'}
          </Button>
        </form>
      </div>
    </div>
  );
}
