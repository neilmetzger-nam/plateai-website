"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface WebsiteStatus {
  profile: {
    name: string;
    slug: string;
  } | null;
  siteStatus: "draft" | "live";
  photoCount: number;
  siteUrl: string | null;
}

export default function WebsitePage() {
  const [status, setStatus] = useState<WebsiteStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");
  const [showDomainForm, setShowDomainForm] = useState(false);
  const [domainEmail, setDomainEmail] = useState("");
  const [domainSent, setDomainSent] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/website/status");
        const data = await res.json();
        setStatus(data);
        if (data.profile) {
          setName(data.profile.name);
          setSlug(data.profile.slug);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handlePublish() {
    if (!name.trim()) return;
    setPublishing(true);
    setError("");

    try {
      const res = await fetch("/api/website/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug: slug || undefined }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Failed to publish.");
      } else {
        setStatus((prev) =>
          prev
            ? {
                ...prev,
                siteStatus: "live",
                siteUrl: data.url,
                profile: { name, slug: data.slug },
              }
            : prev
        );
        setSlug(data.slug);
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setPublishing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-orange-500" />
      </div>
    );
  }

  const photoCount = status?.photoCount || 0;
  const isLive = status?.siteStatus === "live";
  const isLocked = photoCount < 3;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white md:text-3xl">
        Your Website
      </h1>

      {/* Locked state */}
      {isLocked && (
        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-12 text-center">
          <div className="mb-4 text-4xl">🔒</div>
          <p className="text-lg font-semibold text-white">
            Generate {3 - photoCount} more photo{3 - photoCount !== 1 ? "s" : ""} to
            unlock your free website
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            Once you have 3+ generated photos, we&apos;ll auto-build you a
            beautiful, SEO-optimized restaurant website.
          </p>
          <div className="mt-4">
            <div className="mx-auto h-2 w-48 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-orange-500 transition-all"
                style={{ width: `${(photoCount / 3) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              {photoCount} / 3 photos
            </p>
          </div>
          <Link
            href="/generate"
            className="mt-6 inline-block rounded-full bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            Generate Photos →
          </Link>
        </div>
      )}

      {/* Preview ready (not published yet) */}
      {!isLocked && !isLive && (
        <div className="mt-8">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-lg font-semibold text-white">
              Your website is ready to publish
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              {photoCount} photos will be featured on your auto-generated site.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-400">
                  Restaurant Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setSlug(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/^-|-$/g, "")
                    );
                  }}
                  placeholder="e.g. Red Bar Sushi"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-400">
                  URL
                </label>
                <div className="flex items-center rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5">
                  <span className="text-sm text-zinc-500">
                    getplateai.com/sites/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-white outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handlePublish}
              disabled={publishing || !name.trim()}
              className="mt-6 w-full rounded-full bg-orange-500 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
            >
              {publishing ? "Publishing..." : "Publish →"}
            </button>
            {error && (
              <p className="mt-3 text-sm text-red-400">{error}</p>
            )}
          </div>

          {/* Preview iframe */}
          {slug && (
            <div className="mt-6">
              <p className="mb-3 text-sm font-medium text-zinc-400">
                Preview
              </p>
              <div className="overflow-hidden rounded-2xl border border-zinc-800">
                <div className="bg-zinc-800 px-4 py-2">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-zinc-600" />
                    <div className="h-2.5 w-2.5 rounded-full bg-zinc-600" />
                    <div className="h-2.5 w-2.5 rounded-full bg-zinc-600" />
                    <div className="ml-3 flex-1 rounded bg-zinc-700 px-3 py-1 text-xs text-zinc-400">
                      getplateai.com/sites/{slug}
                    </div>
                  </div>
                </div>
                <iframe
                  src={`/sites/${slug}`}
                  className="h-[600px] w-full border-0"
                  title="Website preview"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Live state */}
      {isLive && (
        <div className="mt-8">
          <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-6">
            <div className="flex items-center gap-3">
              <span className="text-xl text-green-400">✅</span>
              <div className="flex-1">
                <p className="font-semibold text-white">
                  Your website is live
                </p>
                <p className="text-sm text-zinc-400">
                  getplateai.com{status?.siteUrl}
                </p>
              </div>
              <div className="flex gap-3">
                <a
                  href={status?.siteUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-zinc-700 px-4 py-2 text-sm font-semibold text-white transition hover:border-zinc-500"
                >
                  View
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `https://getplateai.com${status?.siteUrl}`
                    );
                  }}
                  className="rounded-full border border-zinc-700 px-4 py-2 text-sm font-semibold text-white transition hover:border-zinc-500"
                >
                  Share
                </button>
              </div>
            </div>
          </div>

          {/* Edit link */}
          <div className="mt-6">
            <Link
              href="/dashboard/website/edit"
              className="inline-block rounded-full border border-zinc-700 px-6 py-2.5 text-sm font-semibold text-white transition hover:border-zinc-500"
            >
              Edit Website →
            </Link>
          </div>

          {/* Preview */}
          {status?.siteUrl && (
            <div className="mt-6">
              <div className="overflow-hidden rounded-2xl border border-zinc-800">
                <div className="bg-zinc-800 px-4 py-2">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                    <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                    <div className="ml-3 flex-1 rounded bg-zinc-700 px-3 py-1 text-xs text-zinc-400">
                      getplateai.com{status.siteUrl}
                    </div>
                  </div>
                </div>
                <iframe
                  src={status.siteUrl}
                  className="h-[600px] w-full border-0"
                  title="Website preview"
                />
              </div>
            </div>
          )}

          {/* Custom domain upsell */}
          <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-start gap-4">
              <span className="text-2xl">🌐</span>
              <div className="flex-1">
                <p className="font-semibold text-white">
                  Connect your own domain
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  yourrestaurant.com → $9/mo add-on
                </p>
              </div>
            </div>

            {!showDomainForm ? (
              <button
                onClick={() => setShowDomainForm(true)}
                className="mt-4 text-sm text-orange-400 transition hover:text-orange-300"
              >
                I&apos;m interested →
              </button>
            ) : domainSent ? (
              <p className="mt-4 text-sm text-green-400">
                We&apos;ll reach out when custom domains are available.
              </p>
            ) : (
              <div className="mt-4 flex gap-2">
                <input
                  type="email"
                  value={domainEmail}
                  onChange={(e) => setDomainEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-orange-500"
                />
                <button
                  onClick={() => setDomainSent(true)}
                  className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
                >
                  Notify Me
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
