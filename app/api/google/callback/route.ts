import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { exchangeCode, decodeState } from '@/lib/google-oauth';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  const error = req.nextUrl.searchParams.get('error');

  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

  if (error || !code || !state) {
    return NextResponse.redirect(`${baseUrl}/dashboard?google_error=${encodeURIComponent(error ?? 'missing_params')}`);
  }

  const decoded = decodeState(state);
  if (!decoded) {
    return NextResponse.redirect(`${baseUrl}/dashboard?google_error=invalid_state`);
  }

  try {
    const tokens = await exchangeCode(code);
    const scopes = tokens.scope ? tokens.scope.split(' ') : [];
    const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000);

    await db.googleIntegration.upsert({
      where: { userId: decoded.userId },
      create: {
        userId: decoded.userId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? null,
        tokenExpiry,
        grantedScopes: scopes,
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? undefined,
        tokenExpiry,
        grantedScopes: scopes,
      },
    });

    return NextResponse.redirect(`${baseUrl}${decoded.returnUrl}?google_connected=1`);
  } catch (err) {
    console.error('Google callback error:', err);
    return NextResponse.redirect(`${baseUrl}/dashboard?google_error=token_exchange_failed`);
  }
}
