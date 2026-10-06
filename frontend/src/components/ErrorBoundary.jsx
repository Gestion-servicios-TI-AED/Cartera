// Si una pantalla falla al dibujarse, solo esa pantalla muestra el aviso: el
// menú, la sesión y el resto de la app siguen en pie (sin esto React desmonta
// toda la aplicación y queda la pantalla en blanco). `resetKey` (la ruta
// actual) limpia el error al navegar a otra pantalla.
import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack); // eslint-disable-line no-console
  }

  componentDidUpdate(prev) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" style={{ padding: 32, textAlign: 'center' }}>
        <h2 style={{ fontSize: 18, margin: '0 0 8px' }}>Algo salió mal en esta pantalla</h2>
        <p style={{ margin: '0 0 16px', color: 'var(--color-ink-secondary)' }}>Tu sesión sigue abierta. Puedes reintentar o volver al inicio.</p>
        <div style={{ display: 'inline-flex', gap: 8 }}>
          <button type="button" style={{ padding: '8px 16px', cursor: 'pointer' }} onClick={() => this.setState({ error: null })}>Reintentar</button>
          <a href={this.props.inicioHref ?? '/'} style={{ padding: '8px 16px' }}>Ir al inicio</a>
        </div>
      </div>
    );
  }
}
