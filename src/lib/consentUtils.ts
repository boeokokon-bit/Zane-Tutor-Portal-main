/**
 * Consent persistence utility.
 * 
 * For authenticated users: consent is stored in the user profile (synced to WP API).
 * For guest users (lead forms): consent is stored in localStorage keyed by email hash.
 */

const CONSENT_PREFIX = 'zane_consent_';

function hashEmail(email: string): string {
  // Simple hash - sufficient for consent tracking, not for security
  let hash = 0;
  const normalized = email.toLowerCase().trim();
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Check if a guest user has consented (via localStorage).
 */
export function hasGuestConsented(email: string): boolean {
  if (!email) return false;
  const key = CONSENT_PREFIX + hashEmail(email);
  return localStorage.getItem(key) === 'true';
}

/**
 * Record consent for a guest user (persists in localStorage).
 */
export function recordGuestConsent(email: string): void {
  if (!email) return;
  const key = CONSENT_PREFIX + hashEmail(email);
  localStorage.setItem(key, 'true');
}

/**
 * Check if an authenticated user has consented (from their profile).
 */
export function hasUserConsented(user: { privacyConsentDate?: string } | null | undefined): boolean {
  return !!user?.privacyConsentDate;
}