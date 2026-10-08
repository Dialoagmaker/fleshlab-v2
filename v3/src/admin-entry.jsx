import { createRoot } from 'react-dom/client';

const root = createRoot(document.getElementById('root'));
const params = new URLSearchParams(window.location.search);

if (params.get('legacy') === '1') {
  import('./main.jsx').then(({ App }) => root.render(<App />));
} else {
  import('./admin-approved.jsx').then(({ ApprovedAdminApp }) => root.render(<ApprovedAdminApp />));
}
