import fs from 'node:fs';
import { LOYALFANS_OBSERVED_STORE_DEFAULT_LIMIT } from './loyalfans-request-contracts.js';

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
    reviewOrigin: env.V3_REVIEW_ORIGIN || '',
    adminOrigin: env.ADMIN_ORIGIN || 'https://admin.fleshlab.online',
    performerOrigin: env.PERFORMER_ORIGIN || 'https://performer.fleshlab.online',
    earnOrigin: env.EARN_ORIGIN || 'https://earn.fleshlab.online',
    publicOrigins: [
      env.PUBLIC_ORIGIN || 'http://localhost:5173',
      env.ADMIN_ORIGIN || 'https://admin.fleshlab.online',
      env.PERFORMER_ORIGIN || 'https://performer.fleshlab.online',
      env.EARN_ORIGIN || 'https://earn.fleshlab.online'
    ].filter(Boolean),
    sessionSecret: sessionSecret || 'local-development-only-not-for-production',
    cookieSecure: env.COOKIE_SECURE === 'true',
    uploadContainer: env.PRIVATE_UPLOAD_CONTAINER || 'private-uploads',
    storageAccountUrl: env.AZURE_STORAGE_ACCOUNT_URL || '',
    providerMedia: {
      enabled: env.PROVIDER_MEDIA_ENABLED === 'true',
      allowedHosts: String(env.PROVIDER_MEDIA_ALLOWED_HOSTS || '').split(',').map(value => value.trim().toLowerCase()).filter(Boolean),
      allowedSubdomains: String(env.PROVIDER_MEDIA_ALLOWED_SUBDOMAIN_ROOTS || '').split(',').map(value => value.trim().toLowerCase()).filter(Boolean),
      maxBytes: Number(env.PROVIDER_MEDIA_MAX_BYTES || 20 * 1024 ** 3),
      timeoutMs: Number(env.PROVIDER_MEDIA_TIMEOUT_MS || 30 * 60_000)
    },
    payoutKeyVaultUrl: env.PAYOUT_KEY_VAULT_URL || '',
    payoutKeyVaultSecretName: env.PAYOUT_KEY_VAULT_SECRET_NAME || 'fleshlab-payout-encryption-key',
    mediaMigrationEnabled: env.FLESHLAB_MEDIA_MIGRATION_ENABLED === 'true',
    emailDeliveryUrl: env.EMAIL_DELIVERY_URL || '',
    recruitingWhatsappRecipient: String(env.RECRUITING_WHATSAPP_RECIPIENT || '886958679186').replace(/\D/g, ''),
    whatsappProviderUrl: env.WHATSAPP_PROVIDER_URL || '',
    whatsappProviderToken: readSecret(env.WHATSAPP_PROVIDER_TOKEN, env.WHATSAPP_PROVIDER_TOKEN_FILE),
    whatsappSenderId: env.WHATSAPP_SENDER_ID || '',
    chain2payApiBase: String(env.CHAIN2PAY_API_BASE || 'https://chain2pay.is/api/v2').replace(/\/$/, ''),
    chain2payEnv: String(env.CHAIN2PAY_ENV || 'sandbox').toLowerCase() === 'live' ? 'live' : 'sandbox',
    chain2payApiKey: readSecret(env.CHAIN2PAY_API_KEY, env.CHAIN2PAY_API_KEY_FILE),
    chain2paySandboxApiKey: readSecret(env.CHAIN2PAY_SANDBOX_API_KEY, env.CHAIN2PAY_SANDBOX_API_KEY_FILE),
    chain2payWebhookSecret: readSecret(env.CHAIN2PAY_WEBHOOK_SECRET, env.CHAIN2PAY_WEBHOOK_SECRET_FILE),
    chain2payProviderMode: String(env.CHAIN2PAY_PROVIDER_MODE || 'AUTO').toUpperCase() === 'ALLOWLIST' ? 'ALLOWLIST' : 'AUTO',
    chain2payAllowedProviders: String(env.CHAIN2PAY_ALLOWED_PROVIDERS || '').split(',').map(value => value.trim().toLowerCase()).filter(Boolean),
    chain2payBlockedProviders: [...new Set(['paypal', 'stripe', ...String(env.CHAIN2PAY_BLOCKED_PROVIDERS || '').split(',').map(value => value.trim().toLowerCase()).filter(Boolean)])],
    chain2payCallbackUrl: env.CHAIN2PAY_CALLBACK_URL || `${String(env.PUBLIC_ORIGIN || 'http://localhost:5173').replace(/\/$/, '')}/api/v3/payments/chain2pay/webhook`,
    loyalFans: {
      enabled: env.LOYALFANS_PROVIDER_CLIENT_ENABLED === 'true',
      mediaFulfillmentEnabled:env.LOYALFANS_MEDIA_FULFILLMENT_ENABLED === 'true',
      ledgerPostedConfirmed:env.LOYALFANS_CREATOR_LEDGER_POSTED_CONFIRMED === 'true',
      bearerToken: readSecret(env.LOYALFANS_CREATOR_BEARER_TOKEN, env.LOYALFANS_CREATOR_BEARER_TOKEN_FILE),
      cookieHeader: readSecret(env.LOYALFANS_CREATOR_COOKIE_HEADER, env.LOYALFANS_CREATOR_COOKIE_HEADER_FILE),
      xsrfToken: readSecret(env.LOYALFANS_XSRF_TOKEN, env.LOYALFANS_XSRF_TOKEN_FILE),
      userAgent: readSecret(env.LOYALFANS_CREATOR_USER_AGENT, env.LOYALFANS_CREATOR_USER_AGENT_FILE),
      commentsPathTemplate: env.LOYALFANS_CREATOR_COMMENTS_PATH_TEMPLATE || '',
      commentsRequestContract:env.LOYALFANS_CREATOR_COMMENTS_REQUEST_CONTRACT_JSON || null,
      catalogueRequestContract:env.LOYALFANS_CREATOR_CATALOGUE_REQUEST_CONTRACT_JSON || null,
      catalogueCreatorSlug:env.LOYALFANS_CREATOR_CATALOGUE_SLUG || '',
      catalogueLimit:env.LOYALFANS_CREATOR_CATALOGUE_LIMIT?Number(env.LOYALFANS_CREATOR_CATALOGUE_LIMIT):LOYALFANS_OBSERVED_STORE_DEFAULT_LIMIT,
      settlementCurrency: String(env.LOYALFANS_CREATOR_SETTLEMENT_CURRENCY || '').toUpperCase(),
      cataloguePath: env.LOYALFANS_CREATOR_CATALOGUE_PATH || '',
      cataloguePageParameter: env.LOYALFANS_CREATOR_CATALOGUE_PAGE_PARAMETER || '',
      catalogueSyncEnabled: env.LOYALFANS_CATALOGUE_SYNC_ENABLED === 'true',
      fullVideoIngestionEnabled: env.LOYALFANS_CATALOGUE_FULL_VIDEO_INGESTION_ENABLED === 'true',
      catalogueMediaHosts: String(env.LOYALFANS_CREATOR_MEDIA_HOSTS || '').split(',').map(value => value.trim().toLowerCase()).filter(Boolean),
      catalogueTrailerIngestionEnabled: env.LOYALFANS_CATALOGUE_TRAILER_INGESTION_ENABLED === 'true'
    }
  };
}
