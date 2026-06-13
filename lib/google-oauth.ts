const STATE_SECRET = process.env.GOOGLE_OAUTH_STATE_SECRET ?? 'dev-state-secret-change-in-prod';
const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID ?? process.env.GOOGLE_CLIENT_ID ?? '';
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? process.env.GOOGLE_CLIENT_SECRET ?? '';
const REDIRECT_URI = process.env.NEXTAUTH_URL
  ? `${process.env.NEXTAUTH_URL}/api/google/callback`
  : 'http://localhost:3000/api/google/callback';

export function buildAuthUrl(userId: string, returnUrl = '/dashboard'): string {
  const state = Buffer.from(JSON.stringify({ userId, returnUrl, ts: Date.now() })).toString('base64url');
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email https://www.googleapis.com/auth/calendar.readonly',
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function decodeState(state: string): { userId: string; returnUrl: string } | null {
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString('utf-8')) as { userId: string; returnUrl: string; ts: number };
    // Reject states older than 10 minutes
    if (Date.now() - decoded.ts > 600_000) return null;
    return decoded;
  } catch {
    return null;
  }
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export async function exchangeCode(code: string): Promise<TokenResponse> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${err}`);
  }
  return res.json() as Promise<TokenResponse>;
}

export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; tokenExpiry: Date }> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token refresh failed: ${err}`);
  }
  const data = await res.json() as TokenResponse;
  return {
    accessToken: data.access_token,
    tokenExpiry: new Date(Date.now() + data.expires_in * 1000),
  };
}

export async function revokeToken(accessToken: string): Promise<void> {
  await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(accessToken)}`, { method: 'POST' });
}
