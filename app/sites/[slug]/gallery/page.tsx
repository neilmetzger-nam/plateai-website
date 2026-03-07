import { getRestaurantBySlug, getCatalogItems } from "@/lib/kv";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getRestaurantBySlug(slug);
  if (!data) return { title: "Not Found" };
  return {
    title: `Gallery — ${data.profile.name}`,
    description: `Photo gallery for ${data.profile.name}. Professional food photography by PlateAI.`,
  };
}

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getRestaurantBySlug(slug);
  if (!data) return null;

  const { userId, profile } = data;
  const items = await getCatalogItems(userId);
  const photoItems = items.filter(
    (i) => i.plateaiImageUrl || i.existingImageUrl
  );

  return (
    <div className="px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold text-white md:text-4xl">Gallery</h1>
        <p className="mt-2 text-zinc-400">
          {profile.name} — {photoItems.length} photos
        </p>

        {photoItems.length > 0 ? (
          <div className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3">
            {photoItems.map((item) => (
              <div
                key={item.squareItemId}
                className="mb-4 break-inside-avoid overflow-hidden rounded-xl"
              >
                <img
                  src={(item.plateaiImageUrl || item.existingImageUrl)!}
                  alt={`${item.name} — ${item.description || profile.cuisine} at ${profile.name}`}
                  className="w-full object-cover"
                />
                <div className="bg-zinc-900 px-3 py-2">
                  <p className="text-sm font-semibold text-white">
                    {item.name}
                  </p>
                  {item.description && (
                    <p className="mt-0.5 text-xs text-zinc-500 line-clamp-1">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-12 text-center">
            <p className="text-zinc-500">No photos yet.</p>
          </div>
        )}

        {/* Hero video if available */}
        {profile.heroVideoUrl && (
          <div className="mt-16">
            <h2 className="mb-6 text-xl font-bold text-white">Video</h2>
            <div className="overflow-hidden rounded-2xl">
              <video
                src={profile.heroVideoUrl}
                controls
                playsInline
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
