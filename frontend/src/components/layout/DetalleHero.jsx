// Detail Hero de las vistas de detalle (Negocio, Inmueble, Unidad): mismo
// banner de marca que usan Oportunidad/Usuario/Rol (WizardLayout.module.css
// .hero*) -- degradado Azul Profundo -> Azul Vibrante, avatar circular de 72px
// (aqui un icono), nombre, una linea de subtitulo, una de meta, y a la derecha
// los badges/acciones (`children`).
import layoutStyles from './WizardLayout.module.css';
import styles from './DetalleHero.module.css';

export function DetalleHero({ icon: Icon, titulo, subtitulo, meta, children }) {
  return (
    <section className={layoutStyles.hero}>
      <div className={layoutStyles.heroAvatar}>{Icon && <Icon size={30} strokeWidth={1.75} aria-hidden="true" />}</div>
      <div className={layoutStyles.heroInfo}>
        <h1 className={layoutStyles.heroName}>{titulo}</h1>
        {subtitulo && <p className={layoutStyles.heroRole}>{subtitulo}</p>}
        {meta && <p className={layoutStyles.heroMeta}>{meta}</p>}
      </div>
      {children && <div className={layoutStyles.heroSide}>{children}</div>}
    </section>
  );
}

// Piezas reutilizables dentro del hero.
export function HeroSaldo({ label = 'Total abonado', valor, positivo }) {
  return (
    <div className={styles.saldo}>
      <span className={styles.saldoLabel}>{label}</span>
      <span className={`${styles.saldoValor} ${positivo ? styles.saldoPositivo : ''}`}>{valor}</span>
    </div>
  );
}

export function HeroBoton({ children, ...props }) {
  return <button type="button" className={styles.boton} {...props}>{children}</button>;
}

export function HeroBadges({ children }) {
  return <div className={styles.badges}>{children}</div>;
}
