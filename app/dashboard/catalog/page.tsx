"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import CatalogGenerateModal from "@/app/components/CatalogGenerateModal";

interface CatalogItem {
  squareItemId: string;
  name: string;
  description: string;
  category: string;
  price: number;
  existingImageUrl: string | null;
  plateaiImageUrl: string | null;
  status: "pending" | "generated" | "synced";
}

export default function CatalogPage() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [generateItem, setGenerateItem] = useState<CatalogItem | null>(null);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [bulkSyncing, setBulkSyncing] = useState(false);

  const fetchCatalog = useCallback(async () => {
    try {
      const res = await fetch("/api/square/catalog/list");
      if (res.status === 400) {
        setConnected(false);
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.items) {
        setItems(data.items);
        setConnected(true);
      } else {
        setConnected(false);
      }
    } catch {
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/square/catalog/sync", { method: "POST" });
      const data = await res.json();
      if (data.imported !== undefined) {
        await fetchCatalog();
      }
    } catch {
      // silent
    } finally {
      setSyncing(false);
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === items.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map((i) => i.squareItemId)));
    }
  }

  async function handleBulkGenerate() {
    const pending = items.filter(
      (i) => selected.has(i.squareItemId) && i.status === "pending"
    );
    if (pending.length === 0) return;

    setBulkGenerating(true);
    for (const item of pending) {
      try {
        const prompt = `Professional food photography of "${item.name}". ${item.description}. Style: enhanced. High-quality, restaurant-ready, studio lighting.`;
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, resolution: "1k", variations: 1 }),
        });
        const data = await res.json();
        if (data.images?.[0]) {
          setItems((prev) =>
            prev.map((i) =>
              i.squareItemId === item.squareItemId
                ? { ...i, plateaiImageUrl: data.images[0], status: "generated" as const }
                : i
            )
          );
        }
      } catch {
        // continue with next item
      }
    }
    setBulkGenerating(false);
    setSelected(new Set());
  }

  async function handleBulkSync() {
    const generated = items.filter(
      (i) => i.status === "generated" && i.plateaiImageUrl
    );
    if (generated.length === 0) return;

    setBulkSyncing(true);
    for (const item of generated) {
      try {
        const res = await fetch("/api/square/catalog/push-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            squareItemId: item.squareItemId,
            imageUrl: item.plateaiImageUrl,
          }),
        });
        if (res.ok) {
          setItems((prev) =>
            prev.map((i) =>
              i.squareItemId === item.squareItemId
                ? { ...i, status: "synced" as const }
                : i
            )
          );
        }
      } catch {
        // continue
      }
    }
    setBulkSyncing(false);
  }

  function handleGenerated(updatedItem: CatalogItem) {
    setItems((prev) =>
      prev.map((i) =>
        i.squareItemId === updatedItem.squareItemId ? updatedItem : i
      )
    );
  }

  function formatPrice(cents: number) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  const selectedPendingCount = items.filter(
    (i) => selected.has(i.squareItemId) && i.status === "pending"
  ).length;
  const generatedCount = items.filter((i) => i.status === "generated").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-orange-500" />
      </div>
    );
  }

  // Not connected — empty state
  if (connected === false) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-white md:text-3xl">
          Your Square Menu
        </h1>
        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-12 text-center">
          <div className="mb-4 text-4xl">📷</div>
          <p className="text-lg font-semibold text-white">
            No catalog connected.
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            Connect your Square account to import your full menu and generate
            photos for every item.
          </p>
          <Link
            href="/api/square/oauth/connect"
            className="mt-6 inline-block rounded-full bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            Connect your Square account →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {generateItem && (
        <CatalogGenerateModal
          item={generateItem}
          onClose={() => setGenerateItem(null)}
          onGenerated={handleGenerated}
        />
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white md:text-3xl">
            Your Square Menu
          </h1>
          <span className="rounded-full bg-zinc-800 px-3 py-0.5 text-sm text-zinc-400">
            {items.length} items
          </span>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="rounded-full border border-zinc-700 px-5 py-2 text-sm font-semibold text-white transition hover:border-zinc-500 disabled:opacity-50"
        >
          {syncing ? "Syncing..." : "Sync Catalog"}
        </button>
      </div>

      {/* Catalog grid */}
      <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
        {/* Table header */}
        <div className="hidden border-b border-zinc-800 px-4 py-3 sm:grid sm:grid-cols-[40px_64px_1fr_100px_80px_120px] sm:items-center sm:gap-4">
          <div>
            <input
              type="checkbox"
              checked={selected.size === items.length && items.length > 0}
              onChange={toggleAll}
              className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-orange-500 focus:ring-orange-500"
            />
          </div>
          <div className="text-xs font-medium uppercase text-zinc-500">
            Photo
          </div>
          <div className="text-xs font-medium uppercase text-zinc-500">
            Item
          </div>
          <div className="text-xs font-medium uppercase text-zinc-500">
            Price
          </div>
          <div className="text-xs font-medium uppercase text-zinc-500">
            Status
          </div>
          <div className="text-xs font-medium uppercase text-zinc-500">
            Actions
          </div>
        </div>

        {/* Rows */}
        {items.map((item) => (
          <div
            key={item.squareItemId}
            className="flex flex-col gap-3 border-b border-zinc-800 px-4 py-4 last:border-b-0 sm:grid sm:grid-cols-[40px_64px_1fr_100px_80px_120px] sm:items-center sm:gap-4"
          >
            <div>
              <input
                type="checkbox"
                checked={selected.has(item.squareItemId)}
                onChange={() => toggleSelect(item.squareItemId)}
                className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-orange-500 focus:ring-orange-500"
              />
            </div>
            <div className="h-14 w-14 overflow-hidden rounded-lg bg-zinc-800">
              {(item.plateaiImageUrl || item.existingImageUrl) ? (
                <img
                  src={item.plateaiImageUrl || item.existingImageUrl || ""}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-zinc-600 text-lg">
                  📷
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{item.name}</p>
              {item.description && (
                <p className="mt-0.5 text-xs text-zinc-500 line-clamp-1">
                  {item.description}
                </p>
              )}
            </div>
            <div className="text-sm text-zinc-400">
              {item.price > 0 ? formatPrice(item.price) : "—"}
            </div>
            <div>
              {item.status === "pending" && (
                <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-400">
                  No Photo
                </span>
              )}
              {item.status === "generated" && (
                <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs text-blue-400">
                  Generated
                </span>
              )}
              {item.status === "synced" && (
                <span className="rounded-full bg-green-500/20 px-2.5 py-0.5 text-xs text-green-400">
                  Live
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {item.status === "pending" && (
                <button
                  onClick={() => setGenerateItem(item)}
                  className="rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-orange-600"
                >
                  Generate
                </button>
              )}
              {item.status === "generated" && (
                <button
                  onClick={() => {
                    if (item.plateaiImageUrl) {
                      fetch("/api/square/catalog/push-image", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          squareItemId: item.squareItemId,
                          imageUrl: item.plateaiImageUrl,
                        }),
                      }).then(() => {
                        setItems((prev) =>
                          prev.map((i) =>
                            i.squareItemId === item.squareItemId
                              ? { ...i, status: "synced" as const }
                              : i
                          )
                        );
                      });
                    }
                  }}
                  className="rounded-full border border-green-500/40 bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-400 transition hover:bg-green-500/20"
                >
                  Sync
                </button>
              )}
              {item.status === "synced" && (
                <span className="px-3 py-1 text-xs text-green-400">✓ Live</span>
              )}
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-zinc-500">
              No items found. Click &ldquo;Sync Catalog&rdquo; to import from
              Square.
            </p>
          </div>
        )}
      </div>

      {/* Bulk actions bar */}
      {(selected.size > 0 || generatedCount > 0) && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-800 bg-zinc-900/95 px-6 py-4 backdrop-blur-sm md:left-64">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <p className="text-sm text-zinc-400">
              {selected.size} item{selected.size !== 1 ? "s" : ""} selected
            </p>
            <div className="flex gap-3">
              {selectedPendingCount > 0 && (
                <button
                  onClick={handleBulkGenerate}
                  disabled={bulkGenerating}
                  className="rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
                >
                  {bulkGenerating
                    ? "Generating..."
                    : `Generate Selected (${selectedPendingCount * 2} credits)`}
                </button>
              )}
              {generatedCount > 0 && (
                <button
                  onClick={handleBulkSync}
                  disabled={bulkSyncing}
                  className="rounded-full border border-green-500/40 bg-green-500/10 px-5 py-2 text-sm font-semibold text-green-400 transition hover:bg-green-500/20 disabled:opacity-50"
                >
                  {bulkSyncing
                    ? "Syncing..."
                    : `Sync All to Square (${generatedCount})`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
