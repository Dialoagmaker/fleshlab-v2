import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// ── STEP 1: Confirm bundle is executing ─────────────────────────────────────
window.__FLESHLAB_BUILD_MARKER__ = "ROOT_BOOTSTRAP_FIX_2026_06_02";
console.log(window.__FLESHLAB_BUILD_MARKER__);
console.log("MAIN_BOOTSTRAP_LOADED");
console.log("WINDOW_LOCATION_HREF", window.location.href);
console.log("WINDOW_LOCATION_PATHNAME", window.location.pathname);

// ── STEP 2: Static fallback so #root is never empty even if React crashes ───
const rootEl = document.getElementById("root");
if (rootEl) {
  rootEl.innerHTML = '<div style="color:white;background:#0a0a0a;padding:40px;font-family:Arial;font-size:16px">FLESHLAB loading...</div>';
}

// ── STEP 3: Global unhandledrejection guard ──────────────────────────────────
// The Base44 SDK fires User/me as a side-effect. On public routes the visitor
// is anonymous, so this 401s. We suppress it so it cannot crash React hydration.
window.addEventListener('unhandledrejection', (event) => {
  const msg = String(event?.reason?.message || event?.reason || '');
  const url = String(event?.reason?.config?.url || event?.reason?.request?.responseURL || '');
  if (url.includes('User/me') || msg.includes('User/me') || msg.includes('401')) {
    console.warn('USER_ME_FAILED_SAFE (global)', msg);
    event.preventDefault();
  }
});

// ── STEP 4: Root ErrorBoundary ───────────────────────────────────────────────
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

// ── STEP 5: Mount React ──────────────────────────────────────────────────────
console.log("ABOUT_TO_RENDER_REACT_APP");
console.log("=== PATH DIAGNOSTIC main.jsx ===");
console.log("WINDOW_LOCATION_HREF", window.location.href);
console.log("WINDOW_LOCATION_PATHNAME", window.location.pathname);
console.log("WINDOW_LOCATION_HASH", window.location.hash);
console.log("WINDOW_LOCATION_SEARCH", window.location.search);
console.log("==============================");
ReactDOM.createRoot(rootEl).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);
console.log("REACT_RENDER_CALLED");