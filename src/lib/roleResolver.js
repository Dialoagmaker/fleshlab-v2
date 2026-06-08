/**
 * Role-based dashboard path resolver
 * Priority: admin > performer > client/customer > fallback
 */

/**
 * Get the appropriate dashboard path based on user role and linked entities
 * @param {Object} user - User object with role, performer_profile_id, etc.
 * @returns {string} Dashboard path
 */
export function getDashboardPath(user) {
  if (!user) {
    return '/login';
  }

  // Debug logging (remove in production)
  console.log('[RoleResolver] Resolving dashboard path:', {
    email: user.email,
    role: user.role,
    has_performer_profile: !!user.performer_profile_id,
    has_performer_id: !!user.performer_id,
  });

  // Priority 1: Admin users
  if (user.role === 'admin' || user.role === 'super_admin') {
    console.log('[RoleResolver] Admin detected → /admin/dashboard');
    return '/admin/dashboard';
  }

  // Priority 2: Performer-linked users
  if (user.role === 'performer' || user.performer_profile_id || user.performer_id) {
    console.log('[RoleResolver] Performer detected → /performer/dashboard');
    return '/performer/dashboard';
  }

  // Priority 3: Client/Customer users (if you have client entity tracking)
  // For now, fallback to client dashboard for any authenticated user
  console.log('[RoleResolver] Client/Fallback → /client/dashboard');
  return '/client/dashboard';
}

/**
 * Check if user is admin
 * @param {Object} user - User object
 * @returns {boolean}
 */
export function isAdmin(user) {
  return user?.role === 'admin' || user?.role === 'super_admin';
}

/**
 * Check if user is performer
 * @param {Object} user - User object
 * @returns {boolean}
 */
export function isPerformer(user) {
  return user?.role === 'performer' || !!user?.performer_profile_id || !!user?.performer_id;
}

/**
 * Get user's primary role label
 * @param {Object} user - User object
 * @returns {string} Role label
 */
export function getUserRoleLabel(user) {
  if (!user) return 'guest';
  if (isAdmin(user)) return 'admin';
  if (isPerformer(user)) return 'performer';
  return 'client';
}