import { getRestaurantBySlug, getCatalogItems } from "@/lib/kv";
import type { Metadata } from "next";
import Link from "next/link";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getRestaurantBySlug(slug);
  if (!data) return { title: "Not Found" };
  const { profile } = data;

  const items = await getCatalogItems(data.userId);
  const photoItems = items.filter((i) => i.plateaiImageUrl);
  const ogImage = photoItems[0]?.plateaiImageUrl;

  return {
    title: `${profile.name} — ${profile.cuisine} Restaurant`,
    description:
      profile.aboutText ||
      `${profile.name} — ${profile.cuisine} restaurant. View our full menu with professional photos.`,
    openGraph: ogImage
      ? { images: [{ url: ogImage, width: 1200, height: 630 }] }
      : undefined,
  };
}

export default async function SiteHomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getRestaurantBySlug(slug);
  if (!data) return null;

  const { userId, profile } = data;
  const items = await getCatalogItems(userId);
  const photoItems = items.filter((i) => i.plateaiImageUrl);

  // Featured: first 6 with photos (or use profile.featuredItemIds if set)
  const featuredIds = profile.featuredItemIds || [];
  const featured =
    featuredIds.length > 0
      ? featuredIds
          .map((id) => photoItems.find((i) => i.squareItemId === id))
          .filter(Boolean)
      : photoItems.slice(0, 6);

  // Group by category for menu preview
  const categories = [
    ...new Set(items.map((i) => i.category).filter(Boolean)),
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: profile.name,
    description:
      profile.aboutText || `${profile.cuisine} restaurant`,
    image: photoItems.map((i) => i.plateaiImageUrl),
    address: profile.address || undefined,
    telephone: profile.phone || undefined,
    servesCuisine: profile.cuisine,
    hasMenu: {
      "@type": "Menu",
      hasMenuSection: categories.map((cat) => ({
        "@type": "MenuSection",
        name: cat,
        hasMenuItem: items
          .filter((i) => i.category === cat)
          .map((i) => ({
            "@type": "MenuItem",
            name: i.name,
            description: i.description,
            image: i.plateaiImageUrl || undefined,
            offers: i.price
              ? {
                  "@type": "Offer",
                  price: (i.price / 100).toFixed(2),
                  priceCurrency: "USD",
                }
              : undefined,
          })),
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="relative px-6 py-24 md:py-32">
        {profile.heroVideoUrl ? (
          <video
            src={profile.heroVideoUrl}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover opacity-30"
          />
        ) : photoItems[0]?.plateaiImageUrl ? (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{
              backgroundImage: `url(${photoItems[0].plateaiImageUrl})`,
            }}
          />
        ) : null}
        <div className="relative mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold text-white md:text-6xl">
            {profile.name}
          </h1>
          {profile.tagline && (
            <p className="mt-4 text-xl text-zinc-300">{profile.tagline}</p>
          )}
          <p className="mt-3 text-zinc-400">{profile.cuisine}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href={`/sites/${slug}/menu`}
              className="rounded-full bg-orange-500 px-8 py-3 text-base font-semibold text-white transition hover:bg-orange-600"
            >
              View Full Menu
            </Link>
            {profile.phone && (
              <a
                href={`tel:${profile.phone}`}
                className="rounded-full border border-zinc-700 px-8 py-3 text-base font-semibold text-zinc-300 transition hover:border-zinc-500"
              >
                Call to Order
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Featured dishes */}
      {featured.length > 0 && (
        <section className="bg-zinc-900 px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-2xl font-bold text-white md:text-3xl">
              Featured Dishes
            </h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((item) =>
                item ? (
                  <Link
                    key={item.squareItemId}
                    href={`/sites/${slug}/menu/${encodeURIComponent(item.squareItemId)}`}
                    className="group overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 transition hover:border-zinc-600"
                  >
                    {item.plateaiImageUrl && (
                      <div className="overflow-hidden">
                        <img
                          src={item.plateaiImageUrl}
                          alt={`${item.name} — ${profile.name}`}
                          className="h-48 w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <p className="font-semibold text-white">{item.name}</p>
                      {item.price > 0 && (
                        <p className="mt-1 text-sm text-orange-400">
                          ${(item.price / 100).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </Link>
                ) : null
              )}
            </div>
          </div>
        </section>
      )}

      {/* Menu preview — category scroll */}
      {categories.length > 0 && (
        <section className="px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-2xl font-bold text-white md:text-3xl">
              Our Menu
            </h2>
            <div className="mt-10 flex gap-3 overflow-x-auto pb-2">
              {categories.map((cat) => (
                <Link
                  key={cat}
                  href={`/sites/${slug}/menu?category=${encodeURIComponent(cat)}`}
                  className="shrink-0 rounded-full border border-zinc-700 px-5 py-2 text-sm text-zinc-300 transition hover:border-zinc-500 hover:text-white"
                >
                  {cat}
                </Link>
              ))}
            </div>
            <div className="mt-4 text-center">
              <Link
                href={`/sites/${slug}/menu`}
                className="text-sm text-orange-400 transition hover:text-orange-300"
              >
                View full menu →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* About */}
      {(profile.aboutText || profile.address) && (
        <section className="bg-zinc-900 px-6 py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold text-white md:text-3xl">
              About {profile.name}
            </h2>
            {profile.aboutText && (
              <p className="mt-4 text-zinc-400">{profile.aboutText}</p>
            )}
            {profile.address && (
              <p className="mt-4 text-sm text-zinc-500">{profile.address}</p>
            )}
          </div>
        </section>
      )}

      {/* Gallery preview */}
      {photoItems.length > 0 && (
        <section className="px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-10 text-center text-2xl font-bold text-white md:text-3xl">
              Gallery
            </h2>
            <div className="columns-2 gap-4 md:columns-3">
              {photoItems.slice(0, 9).map((item) => (
                <div
                  key={item.squareItemId}
                  className="mb-4 break-inside-avoid overflow-hidden rounded-xl"
                >
                  <img
                    src={item.plateaiImageUrl!}
                    alt={`${item.name} — ${profile.name}`}
                    className="w-full object-cover"
                  />
                </div>
              ))}
            </div>
            {photoItems.length > 9 && (
              <div className="mt-8 text-center">
                <Link
                  href={`/sites/${slug}/gallery`}
                  className="text-sm text-orange-400 transition hover:text-orange-300"
                >
                  View all {photoItems.length} photos →
                </Link>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
