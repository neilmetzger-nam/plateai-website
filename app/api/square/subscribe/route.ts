import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { PLANS, type PlanKey } from "@/lib/plans";

const SQUARE_BASE = "https://connect.squareup.com/v2";

async function squareFetch(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${SQUARE_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

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
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    const { plan, sourceId, email } = (await req.json()) as {
      plan: PlanKey;
      sourceId: string;
      email: string;
    };

    if (!PLANS[plan]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Get or create Square customer
    let customerId = await kvGet(`user:${userId}:square_customer_id`);

    if (!customerId) {
      const createResult = await squareFetch("/customers", {
        email_address: email || user?.primaryEmailAddress?.emailAddress || "",
        reference_id: userId,
        given_name: user?.firstName || undefined,
        family_name: user?.lastName || undefined,
      });
      customerId = createResult.customer?.id || "";
      if (customerId) {
        await kvSet(`user:${userId}:square_customer_id`, customerId);
      }
    }

    if (!customerId) {
      return NextResponse.json(
        { error: "Failed to create customer" },
        { status: 500 }
      );
    }

    // Create card on file
    const cardResult = await squareFetch("/cards", {
      idempotency_key: `card-${userId}-${Date.now()}`,
      source_id: sourceId,
      card: { customer_id: customerId },
    });
    const cardId = cardResult.card?.id;

    if (!cardId) {
      return NextResponse.json(
        { error: "Failed to save card" },
        { status: 402 }
      );
    }

    // Create subscription
    await squareFetch("/subscriptions", {
      idempotency_key: `sub-${userId}-${Date.now()}`,
      location_id: process.env.SQUARE_LOCATION_ID!,
      plan_variation_id: process.env.SQUARE_PLAN_VARIATION_ID!,
      customer_id: customerId,
      card_id: cardId,
      start_date: new Date().toISOString().split("T")[0],
    });

    // Store plan + credits
    await kvSet(`user:${userId}:plan`, plan);
    await kvSet(`user:${userId}:credits`, String(PLANS[plan].credits));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Square subscribe error:", error);
    return NextResponse.json(
      { error: "Payment processing failed. Please try again." },
      { status: 402 }
    );
  }
}
