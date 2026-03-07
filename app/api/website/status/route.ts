import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { kvGet, kvGetJSON } from "@/lib/kv";
import type { RestaurantProfile, CatalogItem } from "@/lib/kv";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await kvGetJSON<RestaurantProfile>(
      `restaurant:${userId}:profile`
    );
    const siteStatus = await kvGet(`restaurant:${userId}:site_status`);
    const catalog =
      (await kvGetJSON<CatalogItem[]>(`user:${userId}:catalog`)) || [];
    const photoCount = catalog.filter((i) => i.plateaiImageUrl).length;

    return NextResponse.json({
      profile,
      siteStatus: siteStatus || "draft",
      photoCount,
      siteUrl: profile?.slug ? `/sites/${profile.slug}` : null,
    });
  } catch (error) {
    console.error("Website status error:", error);
    return NextResponse.json(
      { error: "Failed to load status" },
      { status: 500 }
    );
  }
}
