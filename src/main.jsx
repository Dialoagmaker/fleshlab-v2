import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Global safety net: the Base44 SDK fires User/me as a background side-effect
// on entity requests. On public routes the visitor is anonymous, so this always
// 401s. If the rejection goes unhandled it can prevent React hydration and leave
// a black screen. We intercept it here and suppress it gracefully.
window.addEventListener('unhandledrejection', (event) => {
  const msg = String(event?.reason?.message || event?.reason || '');
  const url = String(event?.reason?.config?.url || event?.reason?.request?.responseURL || '');
  if (url.includes('User/me') || msg.includes('User/me') || msg.includes('401')) {
    console.warn('USER_ME_FAILED_SAFE (global)', msg);
    event.preventDefault();
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)