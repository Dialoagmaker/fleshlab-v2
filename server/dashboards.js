import { HttpError } from './errors.js';

const emptyCommerce = Object.freeze({ subscriptions: [], payments: [], wallet: { available: 0, currency: 'USD' } });

function cleanProfile(row) {
  return {
    display_name: row?.display_name || null,
    preferences: row?.preferences || {},
    updated_at: row?.updated_at || null
  };
}

export class DashboardService {
  constructor(db) { this.db = db; }

  async profile(user) {
    const result = await this.db.query('SELECT display_name,preferences,updated_at FROM user_profiles WHERE user_id=$1', [user.id]);
    return { user, profile: cleanProfile(result.rows[0]) };
  }

  async updateProfile(user, input) {
    const displayName = input.display_name == null ? null : String(input.display_name).trim().slice(0, 120);
    const preferences = input.preferences && typeof input.preferences === 'object' && !Array.isArray(input.preferences) ? input.preferences : {};
    const result = await this.db.query(
      `INSERT INTO user_profiles(user_id,display_name,preferences,updated_at) VALUES($1,$2,$3,now())
       ON CONFLICT(user_id) DO UPDATE SET display_name=EXCLUDED.display_name,preferences=EXCLUDED.preferences,updated_at=now()
       RETURNING display_name,preferences,updated_at`,
      [user.id, displayName || null, preferences]
    );
    return { user, profile: cleanProfile(result.rows[0]) };
  }

  async customer(user) {
    const [profile, notifications] = await Promise.all([
      this.profile(user),
      this.db.query('SELECT id,kind,title,body,read_at,created_at FROM account_notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20', [user.id])
    ]);
    // Commerce, protected media and fan-production records are intentionally
    // empty until their dedicated migrations are complete. No Base44 fallback
    // and no synthetic balances are presented to a customer.
    return { ...profile, notifications: notifications.rows, ...emptyCommerce, migration: { commerce: 'not_migrated', media: 'not_migrated' } };
  }

  async performer(user) {
    if (user.role !== 'performer') throw new HttpError(403, 'FORBIDDEN', 'A performer account is required.');
    const result = await this.db.query(
      `SELECT p.id,p.status,p.created_at,a.full_name,a.country,a.status AS application_status,c.status AS contract_status,c.signed_at
       FROM performer_profiles p JOIN performer_applications a ON a.id=p.application_id
       LEFT JOIN performer_contracts c ON c.application_id=a.id
       WHERE p.user_id=$1`, [user.id]
    );
    const performer = result.rows[0] || null;
    return {
      user,
      performer,
      career_stats: { videos: null, earnings: null, followers: null, status: 'not_migrated' },
      migration: { earnings: 'not_migrated', catalog: 'not_migrated', payouts: 'not_migrated' }
    };
  }

  async admin(user) {
    if (!['staff', 'admin'].includes(user.role)) throw new HttpError(403, 'FORBIDDEN', 'An authorized staff role is required.');
    const result = await this.db.query(
      `SELECT
        (SELECT count(*)::int FROM performer_applications) AS applications_total,
        (SELECT count(*)::int FROM performer_applications WHERE status IN ('submitted','under_review')) AS applications_pending,
        (SELECT count(*)::int FROM performer_profiles WHERE status='active') AS active_performers,
        (SELECT count(*)::int FROM app_users WHERE account_status='active') AS active_accounts`
    );
    const recent = await this.db.query('SELECT id,full_name,country,status,created_at FROM performer_applications ORDER BY created_at DESC,id DESC LIMIT 12');
    return { user, metrics: result.rows[0], recent_applications: recent.rows, migration: { catalog: 'not_migrated', revenue: 'not_migrated', payments: 'not_migrated' } };
  }
}
