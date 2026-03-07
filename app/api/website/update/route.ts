import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { kvGetJSON, kvSetJSON } from "@/lib/kv";
import type { RestaurantProfile } from "@/lib/kv";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updates = (await req.json()) as Partial<RestaurantProfile>;

    const profile = await kvGetJSON<RestaurantProfile>(
      `restaurant:${userId}:profile`
    );

    if (!profile) {
      return NextResponse.json(
        { error: "No restaurant profile found. Publish your site first." },
        { status: 404 }
      );
    }

    // Apply allowed updates
    if (updates.name !== undefined) profile.name = updates.name;
    if (updates.tagline !== undefined) profile.tagline = updates.tagline;
    if (updates.aboutText !== undefined) profile.aboutText = updates.aboutText;
    if (updates.accentColor !== undefined) profile.accentColor = updates.accentColor;
    if (updates.heroVideoUrl !== undefined) profile.heroVideoUrl = updates.heroVideoUrl;
    if (updates.featuredItemIds !== undefined) profile.featuredItemIds = updates.featuredItemIds;
    if (updates.socialLinks !== undefined) {
      profile.socialLinks = { ...profile.socialLinks, ...updates.socialLinks };
    }
    if (updates.phone !== undefined) profile.phone = updates.phone;
    if (updates.address !== undefined) profile.address = updates.address;
    if (updates.cuisine !== undefined) profile.cuisine = updates.cuisine;

    await kvSetJSON(`restaurant:${userId}:profile`, profile);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Website update error:", error);
    return NextResponse.json(
      { error: "Failed to update" },
      { status: 500 }
    );
  }
}
