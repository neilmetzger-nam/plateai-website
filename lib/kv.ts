const KV_URL = process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export async function kvGet(key: string): Promise<string | null> {
  if (!KV_URL || !KV_TOKEN) return null;
  const res = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
    cache: "no-store",
  });
  const data = (await res.json()) as { result: string | null };
  return data.result;
}

export async function kvSet(key: string, value: string): Promise<void> {
  if (!KV_URL || !KV_TOKEN) return;
  await fetch(
    `${KV_URL}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}`,
    { method: "POST", headers: { Authorization: `Bearer ${KV_TOKEN}` } }
  );
}

export async function kvDel(key: string): Promise<void> {
  if (!KV_URL || !KV_TOKEN) return;
  await fetch(`${KV_URL}/del/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
}

// Type-safe JSON helpers
export async function kvGetJSON<T>(key: string): Promise<T | null> {
  const raw = await kvGet(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function kvSetJSON(key: string, value: unknown): Promise<void> {
  await kvSet(key, JSON.stringify(value));
}

// Restaurant-specific types
export interface RestaurantProfile {
  name: string;
  slug: string;
  cuisine: string;
  address: string;
  phone: string;
  heroVideoUrl: string | null;
  logoUrl: string | null;
  squareMerchantId: string | null;
  tagline: string;
  aboutText: string;
  accentColor: "orange" | "green" | "purple";
  socialLinks: {
    instagram: string;
    tiktok: string;
    googleMaps: string;
  };
  featuredItemIds: string[];
}

export interface CatalogItem {
  squareItemId: string;
  name: string;
  description: string;
  category: string;
  price: number;
  existingImageUrl: string | null;
  plateaiImageUrl: string | null;
  status: "pending" | "generated" | "synced";
}

export async function getRestaurantBySlug(slug: string) {
  const userId = await kvGet(`site:slug:${slug}`);
  if (!userId) return null;
  const profile = await kvGetJSON<RestaurantProfile>(
    `restaurant:${userId}:profile`
  );
  if (!profile) return null;
  return { userId, profile };
}

export async function getCatalogItems(userId: string) {
  return (
    (await kvGetJSON<CatalogItem[]>(`user:${userId}:catalog`)) || []
  );
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
