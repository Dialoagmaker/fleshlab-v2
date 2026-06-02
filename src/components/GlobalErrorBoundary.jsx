import React from 'react';

/**
 * GlobalErrorBoundary — catches any unhandled React render errors.
 * Prevents the full-screen black crash from errors like:
 *   "DialogContent must be used within Dialog"
 *   "Cannot read properties of undefined"
 */
export default class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[GlobalErrorBoundary] Caught render error:', error, info?.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const isAdmin = window.location.pathname.startsWith('/admin');
    const backPath = isAdmin ? '/admin' : '/';
    const backLabel = isAdmin ? '← Back to Admin' : '← Back to Home';
    const errMsg = this.state.error?.message || 'An unexpected error occurred.';

    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#f0f0f0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
        padding: '2rem',
        textAlign: 'center',
        gap: '1rem',
      }}>
        <div style={{ fontSize: '2.5rem' }}>⚠️</div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>
          Something went wrong
        </h1>
        <p style={{
          fontSize: '0.875rem',
          color: '#888',
          maxWidth: '480px',
          background: '#111',
          border: '1px solid #222',
          borderRadius: '6px',
          padding: '0.75rem 1rem',
          fontFamily: 'monospace',
          wordBreak: 'break-word',
        }}>
          {errMsg}
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#c0273a',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '0.6rem 1.4rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reload Page
          </button>
          <button
            onClick={() => { window.location.href = backPath; }}
            style={{
              background: 'transparent',
              color: '#aaa',
              border: '1px solid #333',
              borderRadius: '6px',
              padding: '0.6rem 1.4rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {backLabel}
          </button>
        </div>
      </div>
    );
  }
}