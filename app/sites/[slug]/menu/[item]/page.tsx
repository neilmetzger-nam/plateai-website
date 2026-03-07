import { getRestaurantBySlug, getCatalogItems } from "@/lib/kv";
import type { Metadata } from "next";
import Link from "next/link";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; item: string }>;
}): Promise<Metadata> {
  const { slug, item: itemId } = await params;
  const data = await getRestaurantBySlug(slug);
  if (!data) return { title: "Not Found" };

  const items = await getCatalogItems(data.userId);
  const menuItem = items.find(
    (i) => i.squareItemId === decodeURIComponent(itemId)
  );
  if (!menuItem) return { title: "Item Not Found" };

  return {
    title: `${menuItem.name} — ${data.profile.name}`,
    description: `${menuItem.description || menuItem.name} at ${data.profile.name}. Order online or visit us.`,
    openGraph: menuItem.plateaiImageUrl
      ? {
          images: [
            { url: menuItem.plateaiImageUrl, width: 1200, height: 630 },
          ],
        }
      : undefined,
  };
}

export default async function MenuItemPage({
  params,
}: {
  params: Promise<{ slug: string; item: string }>;
}) {
  const { slug, item: itemId } = await params;
  const data = await getRestaurantBySlug(slug);
  if (!data) return null;

  const { userId, profile } = data;
  const items = await getCatalogItems(userId);
  const menuItem = items.find(
    (i) => i.squareItemId === decodeURIComponent(itemId)
  );

  if (!menuItem) {
    return (
      <div className="px-6 py-24 text-center">
        <h1 className="text-2xl font-bold text-white">Item not found</h1>
        <Link
          href={`/sites/${slug}/menu`}
          className="mt-4 inline-block text-orange-400"
        >
          ← Back to menu
        </Link>
      </div>
    );
  }

  // Find related items (same category)
  const related = items
    .filter(
      (i) =>
        i.squareItemId !== menuItem.squareItemId &&
        i.category === menuItem.category &&
        i.plateaiImageUrl
    )
    .slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MenuItem",
    name: menuItem.name,
    description: menuItem.description || menuItem.name,
    image: menuItem.plateaiImageUrl || undefined,
    offers: menuItem.price
      ? {
          "@type": "Offer",
          price: (menuItem.price / 100).toFixed(2),
          priceCurrency: "USD",
        }
      : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="px-6 py-12">
        <div className="mx-auto max-w-4xl">
          {/* Breadcrumb */}
          <nav className="mb-8 flex items-center gap-2 text-sm text-zinc-500">
            <Link
              href={`/sites/${slug}`}
              className="transition hover:text-zinc-300"
            >
              {profile.name}
            </Link>
            <span>›</span>
            <Link
              href={`/sites/${slug}/menu`}
              className="transition hover:text-zinc-300"
            >
              Menu
            </Link>
            <span>›</span>
            <span className="text-zinc-300">{menuItem.name}</span>
          </nav>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Image */}
            <div>
              {(menuItem.plateaiImageUrl || menuItem.existingImageUrl) ? (
                <img
                  src={(menuItem.plateaiImageUrl || menuItem.existingImageUrl)!}
                  alt={`${menuItem.name} — ${menuItem.description || profile.cuisine} at ${profile.name}`}
                  className="w-full rounded-2xl object-cover"
                />
              ) : (
                <div className="flex h-64 items-center justify-center rounded-2xl bg-zinc-800 text-6xl text-zinc-600">
                  🍽️
                </div>
              )}
            </div>

            {/* Details */}
            <div>
              <h1 className="text-3xl font-bold text-white">{menuItem.name}</h1>
              {menuItem.category && (
                <p className="mt-1 text-sm text-zinc-500">
                  {menuItem.category}
                </p>
              )}
              {menuItem.price > 0 && (
                <p className="mt-3 text-2xl font-bold text-orange-400">
                  ${(menuItem.price / 100).toFixed(2)}
                </p>
              )}
              {menuItem.description && (
                <p className="mt-4 text-zinc-300">{menuItem.description}</p>
              )}

              {profile.phone && (
                <div className="mt-8">
                  <a
                    href={`tel:${profile.phone}`}
                    className="inline-block rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
                  >
                    Call to Order
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Related items */}
          {related.length > 0 && (
            <div className="mt-16">
              <h2 className="text-xl font-bold text-white">
                More from {menuItem.category || "our menu"}
              </h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-3">
                {related.map((r) => (
                  <Link
                    key={r.squareItemId}
                    href={`/sites/${slug}/menu/${encodeURIComponent(r.squareItemId)}`}
                    className="group overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 transition hover:border-zinc-600"
                  >
                    <div className="overflow-hidden">
                      <img
                        src={r.plateaiImageUrl!}
                        alt={`${r.name} — ${profile.name}`}
                        className="h-32 w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-semibold text-white">
                        {r.name}
                      </p>
                      {r.price > 0 && (
                        <p className="text-xs text-orange-400">
                          ${(r.price / 100).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
