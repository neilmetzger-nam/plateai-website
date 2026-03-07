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

async function kvSet(key: string, value: string): Promise<void> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return;
  await fetch(
    `${url}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}`,
    { method: "POST", headers: { Authorization: `Bearer ${token}` } }
  );
}

interface CatalogItem {
  squareItemId: string;
  name: string;
  description: string;
  category: string;
  price: number;
  existingImageUrl: string | null;
  plateaiImageUrl: string | null;
  status: "pending" | "generated" | "synced";
}

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's Square OAuth token
    const oauthRaw = await kvGet(`user:${userId}:square_oauth`);
    if (!oauthRaw) {
      return NextResponse.json(
        { error: "Square not connected. Please connect your Square account first." },
        { status: 400 }
      );
    }

    const oauth = JSON.parse(oauthRaw);
    const accessToken = oauth.accessToken;

    // Fetch catalog items from Square
    const items: CatalogItem[] = [];
    let cursor: string | undefined;

    do {
      const url = new URL("https://connect.squareup.com/v2/catalog/list");
      url.searchParams.set("types", "ITEM");
      if (cursor) url.searchParams.set("cursor", cursor);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();

      if (!res.ok) {
        console.error("Square catalog list error:", data);
        return NextResponse.json(
          { error: "Failed to fetch catalog from Square" },
          { status: 502 }
        );
      }

      for (const obj of data.objects || []) {
        const itemData = obj.item_data;
        if (!itemData) continue;

        // Get price from first variation
        let price = 0;
        if (itemData.variations?.[0]?.item_variation_data?.price_money) {
          price = itemData.variations[0].item_variation_data.price_money.amount || 0;
        }

        // Get existing image URL if available
        let existingImageUrl: string | null = null;
        if (itemData.image_ids?.length) {
          try {
            const imgRes = await fetch(
              `https://connect.squareup.com/v2/catalog/object/${itemData.image_ids[0]}`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            const imgData = await imgRes.json();
            existingImageUrl = imgData.object?.image_data?.url || null;
          } catch {
            // Skip image fetch errors
          }
        }

        items.push({
          squareItemId: obj.id,
          name: itemData.name || "Unnamed Item",
          description: itemData.description || "",
          category: itemData.category_id || "",
          price,
          existingImageUrl,
          plateaiImageUrl: null,
          status: "pending",
        });
      }

      cursor = data.cursor;
    } while (cursor);

    // Merge with existing catalog (preserve generated/synced status)
    const existingRaw = await kvGet(`user:${userId}:catalog`);
    const existing: CatalogItem[] = existingRaw ? JSON.parse(existingRaw) : [];
    const existingMap = new Map(existing.map((e) => [e.squareItemId, e]));

    const merged = items.map((item) => {
      const prev = existingMap.get(item.squareItemId);
      if (prev && prev.plateaiImageUrl) {
        return {
          ...item,
          plateaiImageUrl: prev.plateaiImageUrl,
          status: prev.status,
        };
      }
      return item;
    });

    // Store in KV
    await kvSet(`user:${userId}:catalog`, JSON.stringify(merged));

    return NextResponse.json({ imported: merged.length });
  } catch (error) {
    console.error("Catalog sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync catalog" },
      { status: 500 }
    );
  }
}
