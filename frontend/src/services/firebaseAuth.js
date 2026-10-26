const API_KEY = import.meta.env.VITE_FIREBASE_API_KEY || '';

const AUTH_BASE = 'https://identitytoolkit.googleapis.com/v1';
const SECURE_TOKEN_URL = 'https://securetoken.googleapis.com/v1/token';

function ensureConfigured() {
  if (!API_KEY) {
    throw new Error('Firebase is not configured yet. Add VITE_FIREBASE_API_KEY to frontend/.env.');
  }
}

async function firebaseRequest(endpoint, body) {
  ensureConfigured();
  const response = await fetch(`${AUTH_BASE}/${endpoint}?key=${encodeURIComponent(API_KEY)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const code = data?.error?.message || 'AUTH_ERROR';
    const messages = {
      EMAIL_EXISTS: 'An account already exists for this email.',
      INVALID_EMAIL: 'Enter a valid email address.',
      INVALID_PASSWORD: 'The password is incorrect or does not meet the requirements.',
      WEAK_PASSWORD: 'Choose a stronger password (at least 6 characters).',
      EMAIL_NOT_FOUND: 'No account was found for this email.',
      INVALID_LOGIN_CREDENTIALS: 'The email or password is incorrect.',
      USER_DISABLED: 'This account has been disabled.',
      TOO_MANY_ATTEMPTS_TRY_LATER: 'Too many attempts. Please try again later.',
      OPERATION_NOT_ALLOWED: 'Email/password sign-in is not enabled in Firebase.',
      TOKEN_EXPIRED: 'Your session expired. Please sign in again.'
    };
    throw new Error(messages[code] || `Authentication failed: ${code.replaceAll('_', ' ').toLowerCase()}`);
  }
  return data;
}

export async function registerWithEmail(email, password, displayName) {
  const account = await firebaseRequest('accounts:signUp', {
    email, password, returnSecureToken: true
  });
  await firebaseRequest('accounts:update', {
    idToken: account.idToken, displayName, returnSecureToken: true
  });
  await firebaseRequest('accounts:sendOobCode', {
    requestType: 'VERIFY_EMAIL', idToken: account.idToken
  });
  return { email: account.email, idToken: account.idToken, refreshToken: account.refreshToken, localId: account.localId, emailVerified: false, displayName };
}

export async function signInWithEmail(email, password) {
  const account = await firebaseRequest('accounts:signInWithPassword', {
    email, password, returnSecureToken: true
  });
  const profile = await firebaseRequest('accounts:lookup', { idToken: account.idToken });
  const user = profile.users?.[0];
  if (!user?.emailVerified) {
    await firebaseRequest('accounts:sendOobCode', { requestType: 'VERIFY_EMAIL', idToken: account.idToken });
    throw new Error('Your email is not verified yet. A new verification email has been sent. Open it, verify your email, then sign in again.');
  }
  return {
    email: account.email, idToken: account.idToken, refreshToken: account.refreshToken,
    localId: account.localId, emailVerified: true, displayName: user.displayName || ''
  };
}

export async function resendVerification(idToken) {
  await firebaseRequest('accounts:sendOobCode', { requestType: 'VERIFY_EMAIL', idToken });
}

export async function sendPasswordReset(email) {
  await firebaseRequest('accounts:sendOobCode', { requestType: 'PASSWORD_RESET', email });
}

export async function refreshSession(refreshToken) {
  ensureConfigured();
  const response = await fetch(`${SECURE_TOKEN_URL}?key=${encodeURIComponent(API_KEY)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error('Your session expired. Please sign in again.');
  const idToken = data.id_token;
  const profile = await firebaseRequest('accounts:lookup', { idToken });
  const user = profile.users?.[0];
  if (!user?.emailVerified) throw new Error('Please verify your email before continuing.');
  return {
    email: user.email, idToken, refreshToken: data.refresh_token,
    localId: user.localId, emailVerified: true, displayName: user.displayName || ''
  };
}
