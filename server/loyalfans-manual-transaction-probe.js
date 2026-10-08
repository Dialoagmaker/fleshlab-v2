import { pathToFileURL } from 'node:url';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { Pool } from 'pg';
import { loadConfig } from './config.js';
import { LoyalFansProviderClient } from './loyalfans-provider-client.js';
import { matchLoyalFansTransactionToCatalogue, resolveLoyalFansTransactionToCatalogue } from './loyalfans-transactions.js';
import { V3ExternalContentMappingRepository } from './v3-external-content-mappings.js';

const DATE_FROM = '2026-08-22';
const DATE_TO = '2026-08-24';
const SESSION_FILE_NAME = 'loyalfans-probe-session.json';

function safeError(error) {
  return error?.code || 'LOYALFANS_MANUAL_PROBE_FAILED';
}

function safeDiagnosticText(value) {
  return String(value)
    .replace(/Bearer\s+[^\s,;]+/gi, 'Bearer [REDACTED]')
    .replace(/\b(NEXOSESSION|XSRF-TOKEN|loyalXlm3)(\s*[=:])\s*[^\s;,]+/gi, (_match, name, separator) => `${name}${separator}[REDACTED]`)
    .replace(/[\r\n\t]+/g, ' ')
    .slice(0, 240);
}

export function safeFailureDiagnostics(error) {
  const source = error?.diagnostics || {};
  const fields = ['failure_stage', 'request_url', 'request_path', 'request_method', 'http_status', 'http_status_text', 'response_content_type', 'provider_error_code', 'provider_error_message', 'network_error', 'validation_code', 'response_shape'];
  return Object.fromEntries(fields.filter(field => source[field] !== null && source[field] !== undefined && source[field] !== '').map(field => [field, source[field]]));
}

export function printSafeFailure(error, output = process.stderr) {
  output.write(`Probe failed: ${safeError(error)}\n`);
  const diagnostics = safeFailureDiagnostics(error);
  const labels = {
    failure_stage: 'Failure stage', request_url: 'Request URL', request_path: 'Request URL/path', request_method: 'Request method', http_status: 'HTTP status', http_status_text: 'HTTP status text', response_content_type: 'Response content type', provider_error_code: 'Provider error code', provider_error_message: 'Provider error message', network_error: 'Network error', validation_code: 'Validation code'
  };
  for (const [field, value] of Object.entries(diagnostics)) {
    if (field === 'response_shape') {
      output.write(`Response shape: ${JSON.stringify(value)}\n`);
    } else {
      output.write(`${labels[field]}: ${safeDiagnosticText(value)}\n`);
    }
  }
  if ([401, 403].includes(diagnostics.http_status)) {
    output.write('Saved local session may have expired. Run --setup again.\n');
  }
}

const BRACKETED_PASTE_START = '\u001b[200~';
const BRACKETED_PASTE_END = '\u001b[201~';

function requiredTty(input = process.stdin, output = process.stdout) {
  if (!input.isTTY || !output.isTTY) {
    const error = new Error('This local-only probe requires an interactive terminal.');
    error.code = 'INTERACTIVE_TTY_REQUIRED';
    throw error;
  }
}

export class HiddenInputBuffer {
  constructor() {
    this.value = '';
    this.pending = '';
  }

  consume(chunk) {
    this.pending += String(chunk);
    while (this.pending) {
      if (this.pending.startsWith(BRACKETED_PASTE_START)) {
        this.pending = this.pending.slice(BRACKETED_PASTE_START.length);
        continue;
      }
      if (this.pending.startsWith(BRACKETED_PASTE_END)) {
        this.pending = this.pending.slice(BRACKETED_PASTE_END.length);
        continue;
      }
      if (BRACKETED_PASTE_START.startsWith(this.pending) || BRACKETED_PASTE_END.startsWith(this.pending)) {
        return { value: this.value, cancelled: false, complete: false };
      }
      const csi = this.pending.match(/^\u001b\[[0-?]*[ -/]*[@-~]/);
      if (csi) {
        this.pending = this.pending.slice(csi[0].length);
        continue;
      }
      if (/^\u001b\[[0-?]*[ -/]*$/.test(this.pending)) {
        return { value: this.value, cancelled: false, complete: false };
      }
      const character = this.pending[0];
      this.pending = this.pending.slice(1);
      if (character === '\u0003') {
        this.pending = '';
        return { value: this.value, cancelled: true, complete: false };
      }
      if (character === '\r' || character === '\n') {
        this.pending = '';
        return { value: this.value, cancelled: false, complete: true };
      }
      if (character === '\u007f' || character === '\b') this.value = this.value.slice(0, -1);
      else if (character >= ' ') this.value += character;
    }
    return { value: this.value, cancelled: false, complete: false };
  }
}

export function readHidden(prompt, { input = process.stdin, output = process.stdout } = {}) {
  requiredTty(input, output);
  return new Promise((resolve, reject) => {
    const reader = new HiddenInputBuffer();
    const cleanup = () => {
      input.off('data', onData);
      input.setRawMode(false);
      input.pause();
    };
    const onData = chunk => {
      const state = reader.consume(chunk);
      if (state.cancelled) {
        cleanup();
        const error = new Error('Cancelled.');
        error.code = 'CANCELLED';
        reject(error);
      } else if (state.complete) {
        cleanup();
        output.write('\n');
        resolve(state.value);
      }
    };
    output.write(prompt);
    input.setRawMode(true);
    input.resume();
    input.setEncoding('utf8');
    input.on('data', onData);
  });
}

export function runtimeCredentialMetadata({ bearerToken, cookieHeader, xsrfToken }) {
  return {
    bearerPresent: String(bearerToken || '').length > 0,
    bearerLength: String(bearerToken || '').length,
    cookiePresent: String(cookieHeader || '').length > 0,
    cookieLength: String(cookieHeader || '').length,
    xsrfPresent: String(xsrfToken || '').length > 0,
    xsrfLength: String(xsrfToken || '').length
  };
}

export function loyalFansProbeSessionPath(homeDirectory = os.homedir()) {
  return path.join(homeDirectory, '.config', 'fleshlab', SESSION_FILE_NAME);
}

function sessionError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function assertCompleteCredentials(credentials) {
  const metadata = runtimeCredentialMetadata(credentials);
  if (!metadata.bearerPresent || !metadata.cookiePresent || !metadata.xsrfPresent) {
    throw sessionError('LOYALFANS_AUTH_NOT_CONFIGURED', 'The local LoyalFans probe credential bundle is incomplete.');
  }
}

async function assertExactMode(filePath, expectedMode, code) {
  const stat = await fs.stat(filePath);
  if ((stat.mode & 0o777) !== expectedMode) {
    throw sessionError(code, 'The local LoyalFans probe credential storage permissions are unsafe.');
  }
}

/** Local-only credential persistence. This is not used by production code. */
export async function saveLoyalFansProbeSession(credentials, { homeDirectory = os.homedir() } = {}) {
  assertCompleteCredentials(credentials);
  const filePath = loyalFansProbeSessionPath(homeDirectory);
  const directory = path.dirname(filePath);
  await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  await fs.chmod(directory, 0o700);
  await assertExactMode(directory, 0o700, 'INSECURE_LOYALFANS_SESSION_DIRECTORY');

  const payload = JSON.stringify({
    bearer: String(credentials.bearerToken),
    cookie: String(credentials.cookieHeader),
    xsrf: String(credentials.xsrfToken)
  });
  const temporaryPath = path.join(directory, `.${SESSION_FILE_NAME}.${process.pid}.${Date.now()}.tmp`);
  try {
    const handle = await fs.open(temporaryPath, 'wx', 0o600);
    try {
      await handle.writeFile(payload, 'utf8');
    } finally {
      await handle.close();
    }
    await fs.chmod(temporaryPath, 0o600);
    await fs.rename(temporaryPath, filePath);
    await fs.chmod(filePath, 0o600);
    await assertExactMode(filePath, 0o600, 'INSECURE_LOYALFANS_SESSION_FILE');
  } catch (error) {
    await fs.rm(temporaryPath, { force: true }).catch(() => {});
    throw error;
  }
}

export async function loadLoyalFansProbeSession({ homeDirectory = os.homedir() } = {}) {
  const filePath = loyalFansProbeSessionPath(homeDirectory);
  try {
    await assertExactMode(path.dirname(filePath), 0o700, 'INSECURE_LOYALFANS_SESSION_DIRECTORY');
    await assertExactMode(filePath, 0o600, 'INSECURE_LOYALFANS_SESSION_FILE');
  } catch (error) {
    if (error?.code === 'ENOENT') {
      throw sessionError('LOYALFANS_PROBE_SESSION_MISSING', 'No local LoyalFans probe session is configured. Run --setup first.');
    }
    throw error;
  }
  let parsed;
  try {
    parsed = JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch {
    throw sessionError('LOYALFANS_PROBE_SESSION_INVALID', 'The local LoyalFans probe session is invalid. Run --setup again.');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || Object.keys(parsed).length !== 3 || !['bearer', 'cookie', 'xsrf'].every(key => Object.hasOwn(parsed, key)) || !['bearer', 'cookie', 'xsrf'].every(key => typeof parsed[key] === 'string')) {
    throw sessionError('LOYALFANS_PROBE_SESSION_INVALID', 'The local LoyalFans probe session is invalid. Run --setup again.');
  }
  const credentials = { bearerToken: parsed.bearer, cookieHeader: parsed.cookie, xsrfToken: parsed.xsrf };
  try {
    assertCompleteCredentials(credentials);
  } catch {
    throw sessionError('LOYALFANS_PROBE_SESSION_INVALID', 'The local LoyalFans probe session is invalid. Run --setup again.');
  }
  return credentials;
}

export async function clearLoyalFansProbeSession({ homeDirectory = os.homedir() } = {}) {
  const filePath = loyalFansProbeSessionPath(homeDirectory);
  try {
    await fs.rm(filePath, { force: false });
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

export function removeFinalLineTerminator(value) {
  if (value.endsWith('\r\n')) return value.slice(0, -2);
  if (value.endsWith('\r') || value.endsWith('\n')) return value.slice(0, -1);
  return value;
}

export async function readAndDeleteCookieFile(filePath) {
  try {
    const stat = await fs.stat(filePath);
    if ((stat.mode & 0o077) !== 0) {
      const error = new Error('Cookie file permissions are not owner-only.');
      error.code = 'INSECURE_COOKIE_FILE';
      throw error;
    }
    return removeFinalLineTerminator(await fs.readFile(filePath, 'utf8'));
  } finally {
    await fs.rm(filePath, { force: true }).catch(() => {});
    await fs.rmdir(path.dirname(filePath)).catch(() => {});
  }
}

async function captureCookieFromSecureFile() {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'fleshlab-loyalfans-cookie-'));
  const filePath = path.join(directory, 'cookie.txt');
  await fs.chmod(directory, 0o700);
  const handle = await fs.open(filePath, 'wx', 0o600);
  await handle.close();
  await fs.chmod(filePath, 0o600);
  const editor = process.env.VISUAL || process.env.EDITOR || 'nano';
  if (!/^[A-Za-z0-9_./-]+$/.test(editor)) {
    const error = new Error('Configure VISUAL or EDITOR as a local editor executable without arguments.');
    error.code = 'COOKIE_EDITOR_INVALID';
    await fs.rm(filePath, { force: true }).catch(() => {});
    await fs.rmdir(directory).catch(() => {});
    throw error;
  }
  process.stdout.write(`A mode-0600 temporary cookie file was created at ${filePath}. Paste the complete Cookie header, save, and exit the editor.\n`);
  const editorResult = spawnSync(editor, [filePath], { stdio: 'inherit' });
  if (editorResult.error || editorResult.status !== 0) {
    await fs.rm(filePath, { force: true }).catch(() => {});
    await fs.rmdir(directory).catch(() => {});
    const error = new Error('Cookie editor did not complete successfully.');
    error.code = 'COOKIE_EDITOR_FAILED';
    throw error;
  }
  return readAndDeleteCookieFile(filePath);
}

export async function summarizeManualTransactionProbe(result, expectedTransactionId = '', mappingRepository = null) {
  const expected = String(expectedTransactionId || '').trim();
  const transaction = expected ? result.transactions.find(item => item.provider_transaction_id === expected) : result.transactions[0] || null;
  let catalogueMatch = null;
  if (transaction) {
    if (!mappingRepository) {
      catalogueMatch = matchLoyalFansTransactionToCatalogue(transaction, []);
    } else {
      try {
        catalogueMatch = await resolveLoyalFansTransactionToCatalogue(transaction, mappingRepository);
      } catch {
        catalogueMatch = { matched: false, reason: 'MAPPING_STORE_UNAVAILABLE' };
      }
    }
  }
  return {
    http_status: result.http_status,
    transaction_count: result.transactions.length,
    expected_transaction_found: expected ? Boolean(transaction) : null,
    transaction: transaction ? {
      provider_transaction_id: transaction.provider_transaction_id,
      transaction_type: transaction.transaction_type,
      buyer_member_uid: transaction.provider_member_uid,
      attached_content_uid: transaction.provider_content_uid,
      gross_amount: transaction.gross_amount,
      creator_payout: transaction.creator_payout,
      purchased_at: transaction.purchased_at
    } : null,
    catalogue_match: catalogueMatch?.matched ? { status: 'MATCHED', fleshlab_video_id: catalogueMatch.fleshlab_video_id } : { status: 'UNMAPPED', reason: catalogueMatch?.reason || 'NO_TRANSACTION_SELECTED' },
    entitlement: 'NOT_ATTEMPTED'
  };
}

function configuredMappingRepository() {
  const config = loadConfig();
  if (!config.databaseUrl) return { repository: null, close: async () => {} };
  const pool = new Pool({ connectionString: config.databaseUrl });
  return { repository: new V3ExternalContentMappingRepository(pool), close: async () => pool.end() };
}

async function configureSession() {
  requiredTty();
  process.stdout.write('FLESHLAB LoyalFans local-only probe credential setup. Credentials are saved only in owner-only local storage.\n');
  const confirmation = await readHidden('Type LOCAL-ONLY to continue: ');
  if (confirmation !== 'LOCAL-ONLY') {
    process.stdout.write('Cancelled.\n');
    process.exitCode = 1;
    return;
  }
  const bearerToken = await readHidden('Bearer JWT (hidden): ');
  const cookieHeader = await captureCookieFromSecureFile();
  const xsrfToken = await readHidden('XSRF token (hidden): ');
  await saveLoyalFansProbeSession({ bearerToken, cookieHeader, xsrfToken });
  process.stdout.write('Local-only LoyalFans probe credentials saved.\n');
}

async function runProbe() {
  requiredTty();
  process.stdout.write('FLESHLAB LoyalFans local one-shot transaction probe. Saved credentials are never displayed.\n');
  const { bearerToken, cookieHeader, xsrfToken } = await loadLoyalFansProbeSession();
  const expectedTransactionId = await readHidden('Expected transaction ID (optional, hidden; Enter to skip): ');
  try {
    const auth = runtimeCredentialMetadata({ bearerToken, cookieHeader, xsrfToken });
    process.stdout.write(`Runtime auth:\nbearerPresent=${auth.bearerPresent}\ncookiePresent=${auth.cookiePresent}\nxsrfPresent=${auth.xsrfPresent}\n`);
    if (!auth.bearerPresent || !auth.cookiePresent || !auth.xsrfPresent) {
      const error = new Error('Runtime authentication input is incomplete.');
      error.code = 'LOYALFANS_AUTH_NOT_CONFIGURED';
      throw error;
    }
    const client = new LoyalFansProviderClient({
      enabled: true,
      environment: 'manual-local-probe',
      bearerToken,
      cookieHeader,
      xsrfToken
    });
    const result = await client.listTransactions({ dateFrom: DATE_FROM, dateTo: DATE_TO, page: 1, limit: 10, withCalendarAddons: true });
    const mapping = configuredMappingRepository();
    let summary;
    try {
      summary = await summarizeManualTransactionProbe(result, expectedTransactionId, mapping.repository);
    } finally {
      await mapping.close();
    }
    process.stdout.write(`HTTP status: ${summary.http_status}\n`);
    process.stdout.write(`Transaction count: ${summary.transaction_count}\n`);
    process.stdout.write(`Expected transaction found: ${summary.expected_transaction_found === null ? 'NOT CHECKED' : summary.expected_transaction_found ? 'YES' : 'NO'}\n`);
    if (summary.transaction) {
      process.stdout.write(`Transaction ID: ${summary.transaction.provider_transaction_id}\n`);
      process.stdout.write(`Transaction type: ${summary.transaction.transaction_type}\n`);
      process.stdout.write(`Buyer UID: ${summary.transaction.buyer_member_uid}\n`);
      process.stdout.write(`Attached content UID: ${summary.transaction.attached_content_uid}\n`);
      process.stdout.write(`Gross amount: ${summary.transaction.gross_amount}\n`);
      process.stdout.write(`Payout/net amount: ${summary.transaction.creator_payout}\n`);
      process.stdout.write(`Timestamp: ${summary.transaction.purchased_at}\n`);
    }
    process.stdout.write(`FLESHLAB catalogue match: ${summary.catalogue_match.status}${summary.catalogue_match.reason ? ` (${summary.catalogue_match.reason})` : ''}\n`);
    process.stdout.write('Entitlement: NOT ATTEMPTED\n');
  } catch (error) {
    printSafeFailure(error);
    process.exitCode = 1;
  }
}

async function main(argumentsList = process.argv.slice(2)) {
  if (argumentsList.length > 1 || (argumentsList.length === 1 && !['--setup', '--clear-session'].includes(argumentsList[0]))) {
    throw sessionError('INVALID_LOYALFANS_PROBE_COMMAND', 'Use --setup, --clear-session, or no arguments.');
  }
  if (argumentsList[0] === '--setup') return configureSession();
  if (argumentsList[0] === '--clear-session') {
    const cleared = await clearLoyalFansProbeSession();
    process.stdout.write(cleared ? 'Local-only LoyalFans probe session cleared.\n' : 'No local LoyalFans probe session was present.\n');
    return;
  }
  return runProbe();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    printSafeFailure(error);
    process.exitCode = 1;
  });
}
