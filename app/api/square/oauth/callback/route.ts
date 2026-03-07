import { NextRequest, NextResponse } from "next/server";

async function kvSet(key: string, value: string): Promise<void> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return;
  await fetch(
    `${url}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}`,
    { method: "POST", headers: { Authorization: `Bearer ${token}` } }
  );
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const userId = req.nextUrl.searchParams.get("state");

  if (!code || !userId) {
    return NextResponse.redirect(new URL("/dashboard?square_error=missing_params", req.url));
  }

  const clientId = process.env.SQUARE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.SQUARE_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.SQUARE_OAUTH_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(new URL("/dashboard?square_error=config", req.url));
  }

  try {
    const tokenRes = await fetch("https://connect.squareup.com/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    const result = await tokenRes.json();

    if (!tokenRes.ok || !result.access_token) {
      console.error("Square OAuth token error:", result);
      return NextResponse.redirect(new URL("/dashboard?square_error=token", req.url));
    }

    // Store OAuth credentials in KV
    await kvSet(
      `user:${userId}:square_oauth`,
      JSON.stringify({
        accessToken: result.access_token,
        refreshToken: result.refresh_token,
        merchantId: result.merchant_id,
        expiresAt: result.expires_at,
      })
    );

    return NextResponse.redirect(new URL("/dashboard/catalog", req.url));
  } catch (error) {
    console.error("Square OAuth callback error:", error);
    return NextResponse.redirect(new URL("/dashboard?square_error=unknown", req.url));
  }
}
