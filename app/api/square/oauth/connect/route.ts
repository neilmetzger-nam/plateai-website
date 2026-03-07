import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = process.env.SQUARE_OAUTH_CLIENT_ID;
  const redirectUri = process.env.SQUARE_OAUTH_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "Square OAuth not configured" },
      { status: 500 }
    );
  }

  const url = new URL("https://connect.squareup.com/oauth2/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("scope", "ITEMS_READ ITEMS_WRITE MERCHANT_PROFILE_READ");
  url.searchParams.set("session", "false");
  url.searchParams.set("state", userId);

  return NextResponse.redirect(url.toString());
}
