import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { kvGet, kvSet, kvGetJSON, kvSetJSON, slugify } from "@/lib/kv";
import type { RestaurantProfile } from "@/lib/kv";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, slug: requestedSlug } = (await req.json()) as {
      name: string;
      slug?: string;
    };

    const finalSlug = slugify(requestedSlug || name);
    if (!finalSlug) {
      return NextResponse.json(
        { error: "Invalid restaurant name" },
        { status: 400 }
      );
    }

    // Check slug availability
    const existingOwner = await kvGet(`site:slug:${finalSlug}`);
    if (existingOwner && existingOwner !== userId) {
      return NextResponse.json(
        { error: "This URL is already taken. Try a different name." },
        { status: 409 }
      );
    }

    // Get or create profile
    let profile = await kvGetJSON<RestaurantProfile>(
      `restaurant:${userId}:profile`
    );

    if (!profile) {
      profile = {
        name,
        slug: finalSlug,
        cuisine: "",
        address: "",
        phone: "",
        heroVideoUrl: null,
        logoUrl: null,
        squareMerchantId: null,
        tagline: "",
        aboutText: "",
        accentColor: "orange",
        socialLinks: { instagram: "", tiktok: "", googleMaps: "" },
        featuredItemIds: [],
      };
    } else {
      profile.name = name;
      profile.slug = finalSlug;
    }

    await kvSetJSON(`restaurant:${userId}:profile`, profile);
    await kvSet(`site:slug:${finalSlug}`, userId);
    await kvSet(`restaurant:${userId}:site_status`, "live");

    const siteUrl = `/sites/${finalSlug}`;
    await kvSet(`restaurant:${userId}:site_url`, siteUrl);

    return NextResponse.json({ success: true, slug: finalSlug, url: siteUrl });
  } catch (error) {
    console.error("Publish error:", error);
    return NextResponse.json(
      { error: "Failed to publish" },
      { status: 500 }
    );
  }
}
