"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface SiteProfile {
  name: string;
  slug: string;
  tagline: string;
  aboutText: string;
  cuisine: string;
  address: string;
  phone: string;
  accentColor: "orange" | "green" | "purple";
  heroVideoUrl: string | null;
  socialLinks: {
    instagram: string;
    tiktok: string;
    googleMaps: string;
  };
  featuredItemIds: string[];
}

interface CatalogItem {
  squareItemId: string;
  name: string;
  plateaiImageUrl: string | null;
}

const ACCENT_OPTIONS = [
  { id: "orange" as const, label: "Orange", color: "bg-orange-500" },
  { id: "green" as const, label: "Green", color: "bg-emerald-500" },
  { id: "purple" as const, label: "Purple", color: "bg-violet-500" },
];

export default function WebsiteEditPage() {
  const [profile, setProfile] = useState<SiteProfile | null>(null);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [statusRes, catalogRes] = await Promise.all([
          fetch("/api/website/status"),
          fetch("/api/square/catalog/list"),
        ]);
        const statusData = await statusRes.json();
        if (statusData.profile) {
          setProfile(statusData.profile);
        }
        if (catalogRes.ok) {
          const catalogData = await catalogRes.json();
          setItems(
            (catalogData.items || []).filter(
              (i: CatalogItem) => i.plateaiImageUrl
            )
          );
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch("/api/website/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  function toggleFeatured(itemId: string) {
    if (!profile) return;
    const current = profile.featuredItemIds || [];
    const next = current.includes(itemId)
      ? current.filter((id) => id !== itemId)
      : [...current, itemId];
    setProfile({ ...profile, featuredItemIds: next });
  }

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-orange-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white md:text-3xl">
          Edit Website
        </h1>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-sm text-green-400">Saved!</span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="mt-8 space-y-8">
        {/* Restaurant name + tagline */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Basics</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-400">
                Restaurant Name
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) =>
                  setProfile({ ...profile, name: e.target.value })
                }
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-400">
                Tagline
              </label>
              <input
                type="text"
                value={profile.tagline}
                onChange={(e) =>
                  setProfile({ ...profile, tagline: e.target.value })
                }
                placeholder="e.g. Fresh sushi in the heart of downtown"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-400">
                About (max 200 chars)
              </label>
              <textarea
                value={profile.aboutText}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    aboutText: e.target.value.slice(0, 200),
                  })
                }
                rows={3}
                maxLength={200}
                className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white outline-none focus:border-orange-500"
              />
              <p className="mt-1 text-xs text-zinc-500">
                {profile.aboutText.length}/200
              </p>
            </div>
          </div>
        </div>

        {/* Featured dishes */}
        {items.length > 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">
              Featured Dishes
            </h2>
            <p className="mb-4 text-sm text-zinc-400">
              Select which dishes to feature on your homepage.
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {items.map((item) => {
                const isFeatured = (
                  profile.featuredItemIds || []
                ).includes(item.squareItemId);
                return (
                  <button
                    key={item.squareItemId}
                    onClick={() => toggleFeatured(item.squareItemId)}
                    className={`overflow-hidden rounded-xl border-2 transition ${
                      isFeatured
                        ? "border-orange-500"
                        : "border-transparent hover:border-zinc-600"
                    }`}
                  >
                    {item.plateaiImageUrl && (
                      <img
                        src={item.plateaiImageUrl}
                        alt={item.name}
                        className="h-24 w-full object-cover"
                      />
                    )}
                    <div className="bg-zinc-800 px-2 py-1.5">
                      <p className="text-xs font-medium text-white truncate">
                        {item.name}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Color accent */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Accent Color
          </h2>
          <div className="flex gap-3">
            {ACCENT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() =>
                  setProfile({ ...profile, accentColor: opt.id })
                }
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                  profile.accentColor === opt.id
                    ? "border-white text-white"
                    : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                }`}
              >
                <div className={`h-3 w-3 rounded-full ${opt.color}`} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Social links */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Social Links
          </h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-400">
                Instagram
              </label>
              <input
                type="url"
                value={profile.socialLinks?.instagram || ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    socialLinks: {
                      ...profile.socialLinks,
                      instagram: e.target.value,
                    },
                  })
                }
                placeholder="https://instagram.com/yourrestaurant"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-400">
                TikTok
              </label>
              <input
                type="url"
                value={profile.socialLinks?.tiktok || ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    socialLinks: {
                      ...profile.socialLinks,
                      tiktok: e.target.value,
                    },
                  })
                }
                placeholder="https://tiktok.com/@yourrestaurant"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-400">
                Google Maps
              </label>
              <input
                type="url"
                value={profile.socialLinks?.googleMaps || ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    socialLinks: {
                      ...profile.socialLinks,
                      googleMaps: e.target.value,
                    },
                  })
                }
                placeholder="https://maps.google.com/..."
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Contact info */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Contact Info
          </h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-400">
                Phone
              </label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) =>
                  setProfile({ ...profile, phone: e.target.value })
                }
                placeholder="(555) 123-4567"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-400">
                Address
              </label>
              <input
                type="text"
                value={profile.address}
                onChange={(e) =>
                  setProfile({ ...profile, address: e.target.value })
                }
                placeholder="123 Main St, City, State"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="sticky bottom-0 mt-8 flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/95 p-4 backdrop-blur-sm">
        <Link
          href="/dashboard/website"
          className="text-sm text-zinc-400 transition hover:text-zinc-200"
        >
          ← Back to website
        </Link>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-full bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
        >
          {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
