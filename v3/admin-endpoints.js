export const SYSTEM_TAB_ENDPOINTS = Object.freeze({
  Overview: '/admin/system/overview',
  Users: '/admin/system/users',
  'Roles & Permissions': '/admin/system/roles',
  Sessions: '/admin/system/sessions',
  Settings: '/admin/system/settings',
  'Feature Flags': '/admin/system/flags',
  Integrations: '/admin/system/integrations',
  Health: '/admin/system/health',
  Migrations: '/admin/system/migrations',
  Audit: '/admin/system/audit',
  Diagnostics: '/admin/system/diagnostics',
  Backups: '/admin/system/backups'
});

export function systemEndpointForTab(tab) {
  const endpoint = SYSTEM_TAB_ENDPOINTS[tab];
  if (!endpoint) throw new Error(`SYSTEM_TAB_NOT_CONFIGURED: ${String(tab)}`);
  return endpoint;
}
