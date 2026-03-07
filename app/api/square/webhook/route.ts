import { NextRequest, NextResponse } from "next/server";
import { PLANS } from "@/lib/plans";

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const type = body.type as string;

    console.log("Square webhook:", type);

    if (type === "subscription.updated") {
      const subscription = body.data?.object?.subscription;
      const customerId = subscription?.customer_id;
      if (!customerId) return NextResponse.json({ ok: true });

      // Find user by customer ID — look up reference
      // For now, log and handle
      console.log("Subscription updated for customer:", customerId);

      // Top up credits on renewal if we can find the user
      // This would need a reverse lookup from customerId to userId
    }

    if (
      type === "subscription.deleted" ||
      type === "subscription.deactivated"
    ) {
      const subscription = body.data?.object?.subscription;
      const customerId = subscription?.customer_id;
      console.log("Subscription cancelled for customer:", customerId);
      // Would need reverse lookup to set plan to "free"
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Square webhook error:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
