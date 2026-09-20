import crypto from 'node:crypto';
import { HttpError } from './errors.js';

const email = (value) => String(value || '').trim().toLowerCase();
const hashToken = (secret, value) => crypto.createHmac('sha256', secret).update(value).digest('hex');
const serializeUser = (user) => ({ id: user.id, email: user.email, role: user.role, account_status: user.account_status });

function passwordHash(password) {
  const salt = crypto.randomBytes(16).toString('base64url');
  const derived = crypto.scryptSync(password, salt, 64).toString('base64url');
  return `scrypt$${salt}$${derived}`;
}
function verifyPassword(password, stored) {
  const [kind, salt, expected] = String(stored).split('$');
  if (kind !== 'scrypt' || !salt || !expected) return false;
  const actual = crypto.scryptSync(password, salt, 64).toString('base64url');
  return actual.length === expected.length && crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}
function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map((item) => item.trim().split('=').map(decodeURIComponent)).filter(([key]) => key));
}
function sessionCookie(raw, secure) {
  return `fleshlab_session=${encodeURIComponent(raw)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 14}${secure ? '; Secure' : ''}`;
}
function expiredCookie(secure) { return `fleshlab_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? '; Secure' : ''}`; }

export class AuthService {
  constructor(db, config) { this.db = db; this.config = config; }

  async limit(key, maximum = 10) {
    const result = await this.db.query(
      `INSERT INTO auth_rate_limits(rate_key,window_start,attempts) VALUES($1,date_trunc('minute',now()),1)
       ON CONFLICT(rate_key,window_start) DO UPDATE SET attempts=auth_rate_limits.attempts+1
       RETURNING attempts`, [key]
    );
    if (result.rows[0].attempts > maximum) throw new HttpError(429, 'LOGIN_RATE_LIMITED', 'Too many attempts. Please wait before trying again.');
  }

  async register(input, remoteAddress) {
    const address = email(input.email);
    const password = String(input.password || '');
    if (!/^\S+@\S+\.\S+$/.test(address)) throw new HttpError(422, 'INVALID_EMAIL', 'A valid email is required.');
    if (password.length < 12) throw new HttpError(422, 'WEAK_PASSWORD', 'Password must be at least 12 characters.');
    if (!this.config.emailDeliveryUrl) throw new HttpError(503, 'EMAIL_DELIVERY_UNAVAILABLE', 'Account verification is not available until the self-hosted email delivery worker is configured.');
    await this.limit(`register:${remoteAddress}`, 5);
    try {
      const result = await this.db.query(`INSERT INTO app_users(email,password_hash,role,account_status) VALUES($1,$2,'customer','pending_reset') RETURNING *`, [address, passwordHash(password)]);
      const action = await this.issueAction(result.rows[0].id, 'verify_email', 24);
      await this.queueEmail(address, 'verify_email', { token: action, email: address });
      return { ...serializeUser(result.rows[0]), verificationRequired: true };
    } catch (error) {
      if (error.code === '23505') throw new HttpError(409, 'ACCOUNT_EXISTS', 'This email address is already registered.');
      throw error;
    }
  }

  async issueAction(userId, purpose, hours) {
    const raw = crypto.randomBytes(32).toString('base64url');
    await this.db.query(`INSERT INTO account_action_tokens(user_id,token_hash,purpose,expires_at) VALUES($1,$2,$3,now() + ($4 || ' hours')::interval)`, [userId, hashToken(this.config.sessionSecret, raw), purpose, String(hours)]);
    return raw;
  }

  async queueEmail(recipient, template, payload) {
    // Tokens live only in this protected queue until a configured delivery worker sends them.
    // They are never returned in HTTP responses, logs, browser storage, or test fixtures.
    await this.db.query(`INSERT INTO outbound_email_queue(recipient_email,template,payload) VALUES($1,$2,$3)`, [recipient, template, payload]);
  }

  async consumeAction(input, purpose) {
    const raw = String(input.token || '');
    if (!raw) throw new HttpError(400, 'ACTION_TOKEN_REQUIRED', 'A valid action token is required.');
    const result = await this.db.query(
      `SELECT t.*,u.email,u.role,u.account_status FROM account_action_tokens t JOIN app_users u ON u.id=t.user_id
       WHERE t.token_hash=$1 AND t.purpose=$2 AND t.consumed_at IS NULL AND t.expires_at > now() FOR UPDATE`,
      [hashToken(this.config.sessionSecret, raw), purpose]
    );
    if (!result.rowCount) throw new HttpError(400, 'INVALID_ACTION_TOKEN', 'This link is invalid or expired.');
    await this.db.query('UPDATE account_action_tokens SET consumed_at=now() WHERE id=$1', [result.rows[0].id]);
    return result.rows[0];
  }

  async verifyEmail(input) {
    const token = await this.consumeAction(input, 'verify_email');
    const result = await this.db.query(`UPDATE app_users SET account_status='active',updated_at=now() WHERE id=$1 RETURNING *`, [token.user_id]);
    return serializeUser(result.rows[0]);
  }

  async requestPasswordReset(input, remoteAddress) {
    const address = email(input.email);
    await this.limit(`reset:${remoteAddress}`, 5);
    const result = this.config.emailDeliveryUrl ? await this.db.query(`SELECT id,email FROM app_users WHERE email=$1 AND account_status='active'`, [address]) : { rowCount: 0, rows: [] };
    if (result.rowCount) {
      const action = await this.issueAction(result.rows[0].id, 'reset_password', 1);
      await this.queueEmail(result.rows[0].email, 'reset_password', { token: action, email: result.rows[0].email });
    }
    return { accepted: true };
  }

  async resetPassword(input) {
    const password = String(input.newPassword || input.password || '');
    if (password.length < 12) throw new HttpError(422, 'WEAK_PASSWORD', 'Password must be at least 12 characters.');
    const token = await this.consumeAction(input, 'reset_password');
    await this.db.query(`UPDATE app_users SET password_hash=$2,updated_at=now() WHERE id=$1`, [token.user_id, passwordHash(password)]);
    await this.db.query(`UPDATE web_sessions SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL`, [token.user_id]);
    return { reset: true };
  }

  async login(input, remoteAddress) {
    const address = email(input.email);
    const password = String(input.password || '');
    await this.limit(`login:${remoteAddress}`, 10);
    const result = await this.db.query('SELECT * FROM app_users WHERE email=$1', [address]);
    const user = result.rows[0];
    if (!user || !verifyPassword(password, user.password_hash) || user.account_status !== 'active') throw new HttpError(401, 'INVALID_LOGIN', 'Email or password is incorrect.');
    const raw = crypto.randomBytes(32).toString('base64url');
    await this.db.query(`INSERT INTO web_sessions(user_id,token_hash,expires_at) VALUES($1,$2,now() + interval '14 days')`, [user.id, hashToken(this.config.sessionSecret, raw)]);
    return { user: serializeUser(user), cookie: sessionCookie(raw, this.config.cookieSecure) };
  }

  async current(req) {
    const raw = parseCookies(req.headers.cookie).fleshlab_session;
    if (!raw) throw new HttpError(401, 'UNAUTHENTICATED', 'Authentication is required.');
    const result = await this.db.query(
      `SELECT u.* FROM web_sessions s JOIN app_users u ON u.id=s.user_id
       WHERE s.token_hash=$1 AND s.revoked_at IS NULL AND s.expires_at > now() AND u.account_status='active'`,
      [hashToken(this.config.sessionSecret, raw)]
    );
    if (!result.rowCount) throw new HttpError(401, 'UNAUTHENTICATED', 'Session is invalid or expired.');
    return serializeUser(result.rows[0]);
  }

  async requireRole(req, roles) {
    const user = await this.current(req);
    if (!roles.includes(user.role)) throw new HttpError(403, 'FORBIDDEN', 'This action requires an authorized staff role.');
    return user;
  }

  async logout(req) {
    const raw = parseCookies(req.headers.cookie).fleshlab_session;
    if (raw) await this.db.query('UPDATE web_sessions SET revoked_at=now() WHERE token_hash=$1 AND revoked_at IS NULL', [hashToken(this.config.sessionSecret, raw)]);
    return expiredCookie(this.config.cookieSecure);
  }
}

export function requireSameOrigin(req, config) {
  const origin = req.headers.origin;
  if (origin && origin !== config.publicOrigin) throw new HttpError(403, 'ORIGIN_REJECTED', 'Cross-origin state changes are not allowed.');
}
