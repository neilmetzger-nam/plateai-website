import type { Metadata } from "next";
import { getRestaurantBySlug } from "@/lib/kv";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getRestaurantBySlug(slug);
  if (!data) return { title: "Restaurant Not Found" };

  const { profile } = data;
  return {
    title: `${profile.name} — Menu & Photos`,
    description: `${profile.cuisine} restaurant. View our full menu with photos. ${profile.address}`,
  };
}

const ACCENT_MAP = {
  orange: { primary: "text-orange-500", bg: "bg-orange-500", bgLight: "bg-orange-500/10", border: "border-orange-500" },
  green: { primary: "text-emerald-500", bg: "bg-emerald-500", bgLight: "bg-emerald-500/10", border: "border-emerald-500" },
  purple: { primary: "text-violet-500", bg: "bg-violet-500", bgLight: "bg-violet-500/10", border: "border-violet-500" },
} as const;

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getRestaurantBySlug(slug);

  if (!data) {
    return (
      <html lang="en">
        <body className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Restaurant not found</h1>
            <p className="mt-2 text-zinc-400">This site doesn&apos;t exist yet.</p>
          </div>
        </body>
      </html>
    );
  }

  const { profile } = data;
  const accent = ACCENT_MAP[profile.accentColor || "orange"];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href={`/sites/${slug}`} className="text-xl font-bold text-white">
            {profile.name}
          </a>
          <div className="flex items-center gap-6">
            <a
              href={`/sites/${slug}/menu`}
              className="text-sm text-zinc-400 transition hover:text-white"
            >
              Menu
            </a>
            <a
              href={`/sites/${slug}/gallery`}
              className="text-sm text-zinc-400 transition hover:text-white"
            >
              Gallery
            </a>
            {profile.phone && (
              <a
                href={`tel:${profile.phone}`}
                className={`rounded-full ${accent.bg} px-4 py-1.5 text-sm font-semibold text-white`}
              >
                Call Us
              </a>
            )}
          </div>
        </div>
      </nav>

      {children}

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-10">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-lg font-bold text-white">{profile.name}</p>
          {profile.address && (
            <p className="mt-1 text-sm text-zinc-400">{profile.address}</p>
          )}
          {profile.phone && (
            <p className="mt-1 text-sm text-zinc-400">{profile.phone}</p>
          )}
          <div className="mt-4 flex justify-center gap-4">
            {profile.socialLinks?.instagram && (
              <a
                href={profile.socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-zinc-500 transition hover:text-white"
              >
                Instagram
              </a>
            )}
            {profile.socialLinks?.tiktok && (
              <a
                href={profile.socialLinks.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-zinc-500 transition hover:text-white"
              >
                TikTok
              </a>
            )}
            {profile.socialLinks?.googleMaps && (
              <a
                href={profile.socialLinks.googleMaps}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-zinc-500 transition hover:text-white"
              >
                Directions
              </a>
            )}
          </div>
          <p className="mt-6 text-xs text-zinc-600">
            Powered by{" "}
            <a href="/" className="text-zinc-500 transition hover:text-white">
              PlateAI
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
