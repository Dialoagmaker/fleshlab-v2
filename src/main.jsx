import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx';
import { initAnalytics } from '@/lib/analytics';
import '@/index.css'
import { I18nProvider } from '@/i18n/i18n.jsx'

// Static fallback so #root is never empty even if React crashes
const rootEl = document.getElementById("root");
if (rootEl) {
  rootEl.innerHTML = '<div style="color:white;background:#0a0a0a;padding:40px;font-family:Arial;font-size:16px">FLESHLAB loading...</div>';
}

// Global unhandledrejection guard - suppress 401s on public routes
window.addEventListener('unhandledrejection', (event) => {
  const msg = String(event?.reason?.message || event?.reason || '');
  const url = String(event?.reason?.config?.url || event?.reason?.request?.responseURL || '');
  if (url.includes('User/me') || msg.includes('User/me') || msg.includes('401')) {
    event.preventDefault();
  }
});

// Root ErrorBoundary
class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("GLOBAL_RENDER_ERROR", error, info?.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: 'white', background: '#0a0a0a', padding: '40px', fontFamily: 'Arial', minHeight: '100vh' }}>
          <h1 style={{ color: '#c0392b' }}>FLESHLAB could not load this page</h1>
          <p style={{ color: '#aaa', marginTop: '12px' }}>
            {String(this.state.error?.message || this.state.error || 'Unknown error')}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: '20px', padding: '10px 24px', background: '#c0392b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Mount React
ReactDOM.createRoot(rootEl).render(
  <RootErrorBoundary>
    <I18nProvider>
      <App />
    </I18nProvider>
  </RootErrorBoundary>
);

// Initialize analytics on app startup
initAnalytics();