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
  return {
    title: `Menu — ${data.profile.name}`,
    description: `Full menu for ${data.profile.name}. ${data.profile.cuisine} restaurant with professional food photos.`,
  };
}

export default async function MenuPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { slug } = await params;
  const { category: filterCategory } = await searchParams;
  const data = await getRestaurantBySlug(slug);
  if (!data) return null;

  const { userId, profile } = data;
  const items = await getCatalogItems(userId);
  const categories = [
    ...new Set(items.map((i) => i.category).filter(Boolean)),
  ];

  const filtered = filterCategory
    ? items.filter((i) => i.category === filterCategory)
    : items;

  return (
    <div className="px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold text-white md:text-4xl">
          Our Menu
        </h1>
        <p className="mt-2 text-zinc-400">
          {profile.name} — {profile.cuisine}
        </p>

        {/* Category filter */}
        {categories.length > 1 && (
          <div className="mt-8 flex flex-wrap gap-2">
            <Link
              href={`/sites/${slug}/menu`}
              className={`rounded-full px-4 py-1.5 text-sm transition ${
                !filterCategory
                  ? "bg-orange-500 text-white"
                  : "border border-zinc-700 text-zinc-400 hover:border-zinc-500"
              }`}
            >
              All
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat}
                href={`/sites/${slug}/menu?category=${encodeURIComponent(cat)}`}
                className={`rounded-full px-4 py-1.5 text-sm transition ${
                  filterCategory === cat
                    ? "bg-orange-500 text-white"
                    : "border border-zinc-700 text-zinc-400 hover:border-zinc-500"
                }`}
              >
                {cat}
              </Link>
            ))}
          </div>
        )}

        {/* Menu grid */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <Link
              key={item.squareItemId}
              href={`/sites/${slug}/menu/${encodeURIComponent(item.squareItemId)}`}
              className="group overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 transition hover:border-zinc-600"
            >
              {(item.plateaiImageUrl || item.existingImageUrl) ? (
                <div className="overflow-hidden">
                  <img
                    src={(item.plateaiImageUrl || item.existingImageUrl)!}
                    alt={`${item.name} — ${profile.name}`}
                    className="h-48 w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="flex h-48 items-center justify-center bg-zinc-800 text-4xl text-zinc-600">
                  🍽️
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-white">{item.name}</p>
                  {item.price > 0 && (
                    <p className="text-sm font-semibold text-orange-400">
                      ${(item.price / 100).toFixed(2)}
                    </p>
                  )}
                </div>
                {item.description && (
                  <p className="mt-1 text-sm text-zinc-400 line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="mt-12 text-center">
            <p className="text-zinc-500">No items found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
