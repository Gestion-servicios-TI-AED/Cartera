import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext.jsx';
import styles from './UserMenu.module.css';

function initials(nombre) {
  return (nombre ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

// Mismo patron que NotificationBell.jsx (containerRef + onBlurCapture para
// cerrar al perder el foco, panel absolute anclado a la derecha del
// trigger) -- vive en .topbar, junto al bell.
export function UserMenu() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  if (!usuario) return null;

  function closeIfFocusLeft(event) {
    if (!containerRef.current?.contains(event.relatedTarget)) {
      setOpen(false);
    }
  }

  async function handleLogout() {
    setOpen(false);
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div ref={containerRef} className={styles.container} onBlurCapture={closeIfFocusLeft}>
      <button type="button" className={styles.trigger} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((prev) => !prev)}>
        <span className={styles.avatar} aria-hidden="true">
          {initials(usuario.nombre)}
        </span>
        <span className={styles.name}>{usuario.nombre}</span>
        <ChevronDown size={16} strokeWidth={1.75} aria-hidden="true" className={styles.caret} />
      </button>

      {open && (
        <div className={styles.panel} role="menu">
          <div className={styles.panelHeader}>
            <span className={styles.panelName}>{usuario.nombre}</span>
            <span className={styles.panelEmail}>{usuario.email}</span>
          </div>

          <button type="button" role="menuitem" className={styles.item} onClick={handleLogout}>
            <LogOut size={16} strokeWidth={1.75} aria-hidden="true" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
