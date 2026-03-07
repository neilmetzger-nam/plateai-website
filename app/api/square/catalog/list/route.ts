import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

async function kvGet(key: string): Promise<string | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = (await res.json()) as { result: string | null };
  return data.result;
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if Square is connected
    const oauthRaw = await kvGet(`user:${userId}:square_oauth`);
    if (!oauthRaw) {
      return NextResponse.json(
        { error: "Square not connected" },
        { status: 400 }
      );
    }

    // Get catalog from KV
    const catalogRaw = await kvGet(`user:${userId}:catalog`);
    const items = catalogRaw ? JSON.parse(catalogRaw) : [];

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Catalog list error:", error);
    return NextResponse.json(
      { error: "Failed to load catalog" },
      { status: 500 }
    );
  }
}
