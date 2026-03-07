import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { CREDIT_COST } from "@/lib/credits";

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

async function kvSet(key: string, value: string): Promise<void> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return;
  await fetch(
    `${url}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}`,
    { method: "POST", headers: { Authorization: `Bearer ${token}` } }
  );
}

async function kvLpush(key: string, value: string): Promise<void> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return;
  await fetch(`${url}/lpush/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([value]),
  });
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { images, dishName, style } = (await req.json()) as {
      images: string[];
      dishName: string;
      style: string;
    };

    // Get current credits
    const creditsKey = `user:${userId}:credits`;
    const creditsRaw = await kvGet(creditsKey);
    let credits = creditsRaw !== null ? parseInt(creditsRaw) : 10; // Free tier seed

    // Deduct credits
    const cost = images.length * CREDIT_COST.photo;
    credits = Math.max(0, credits - cost);
    await kvSet(creditsKey, String(credits));

    // Save photo entry
    const entry = JSON.stringify({
      images,
      dishName,
      style,
      timestamp: new Date().toISOString(),
    });
    await kvLpush(`user:${userId}:photos`, entry);

    return NextResponse.json({ saved: true, creditsRemaining: credits });
  } catch (error) {
    console.error("Photo save error:", error);
    return NextResponse.json(
      { error: "Failed to save photos" },
      { status: 500 }
    );
  }
}
