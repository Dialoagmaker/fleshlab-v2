import fs from 'node:fs';

const requiredInProduction = ['PUBLIC_ORIGIN'];

export function loadConfig(env = process.env) {
  if (env.NODE_ENV === 'production') {
    const missing = requiredInProduction.filter((name) => !env[name]);
    if (missing.length) throw new Error(`Missing required production configuration: ${missing.join(', ')}`);
  }

  const readSecret = (value, path) => value || (path ? fs.readFileSync(path, 'utf8').trim() : '');
  const databasePassword = readSecret(env.DATABASE_PASSWORD, env.POSTGRES_PASSWORD_FILE);
  const sessionSecret = readSecret(env.SESSION_SECRET, env.SESSION_SECRET_FILE);
  const databaseUrl = env.DATABASE_URL || (databasePassword ? `postgresql://${encodeURIComponent(env.POSTGRES_USER || 'fleshlab')}:${encodeURIComponent(databasePassword)}@${env.POSTGRES_HOST || '127.0.0.1'}:${env.POSTGRES_PORT || '5432'}/${env.POSTGRES_DB || 'fleshlab'}` : '');
  if (env.NODE_ENV === 'production' && (!databaseUrl || !sessionSecret)) throw new Error('Database and session secrets are required in production.');
  return {
    port: Number(env.PORT || 8787),
    databaseUrl,
    publicOrigin: env.PUBLIC_ORIGIN || 'http://localhost:5173',
    sessionSecret: sessionSecret || 'local-development-only-not-for-production',
    cookieSecure: env.COOKIE_SECURE === 'true',
    uploadContainer: env.PRIVATE_UPLOAD_CONTAINER || 'private-uploads',
    storageAccountUrl: env.AZURE_STORAGE_ACCOUNT_URL || '',
    mediaMigrationEnabled: env.FLESHLAB_MEDIA_MIGRATION_ENABLED === 'true',
    emailDeliveryUrl: env.EMAIL_DELIVERY_URL || ''
  };
}
