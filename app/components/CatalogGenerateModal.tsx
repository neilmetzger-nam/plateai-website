"use client";

import { useState } from "react";

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

const STYLES = [
  { id: "enhanced", label: "Enhanced" },
  { id: "generated", label: "Generated" },
  { id: "michelin", label: "Michelin" },
  { id: "xray", label: "X-Ray" },
  { id: "slice", label: "The Slice" },
];

interface Props {
  item: CatalogItem;
  onClose: () => void;
  onGenerated: (item: CatalogItem, images: string[]) => void;
}

export default function CatalogGenerateModal({
  item,
  onClose,
  onGenerated,
}: Props) {
  const [style, setStyle] = useState("enhanced");
  const [variations, setVariations] = useState(2);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(false);

  const creditCost = variations * 2;

  async function handleGenerate() {
    setGenerating(true);
    setError("");
    setResults([]);

    try {
      const prompt = `Professional food photography of "${item.name}". ${item.description}. Style: ${style}. High-quality, restaurant-ready, studio lighting.`;

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          resolution: "1k",
          variations,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Generation failed. Please try again.");
      } else {
        setResults(data.images || []);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleUsePhoto(imageUrl: string) {
    setSyncing(true);
    setError("");

    try {
      const res = await fetch("/api/square/catalog/push-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          squareItemId: item.squareItemId,
          imageUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Failed to sync to Square.");
      } else {
        onGenerated({ ...item, plateaiImageUrl: imageUrl, status: "synced" }, results);
        onClose();
      }
    } catch {
      setError("Failed to sync. Please try again.");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 backdrop-blur-sm px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-white">{item.name}</h3>
            <p className="text-sm text-zinc-400">{item.description || "No description"}</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 transition hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {results.length === 0 ? (
            <>
              {/* Style picker */}
              <p className="mb-3 text-sm font-medium text-zinc-400">Style</p>
              <div className="flex flex-wrap gap-2">
                {STYLES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id)}
                    className={`rounded-full px-3 py-1.5 text-sm transition ${
                      style === s.id
                        ? "bg-orange-500 text-white"
                        : "border border-zinc-700 text-zinc-400 hover:border-zinc-500"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Variations */}
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-400">Variations</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setVariations(Math.max(1, variations - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 text-zinc-400 transition hover:border-zinc-500"
                  >
                    −
                  </button>
                  <span className="w-6 text-center font-semibold text-white">
                    {variations}
                  </span>
                  <button
                    onClick={() => setVariations(Math.min(4, variations + 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 text-zinc-400 transition hover:border-zinc-500"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Generate button */}
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="mt-6 w-full rounded-full bg-orange-500 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {generating
                  ? "Generating..."
                  : `Generate (${creditCost} credits) →`}
              </button>
            </>
          ) : (
            <>
              {/* Results */}
              <p className="mb-3 text-sm font-medium text-zinc-400">
                Choose a photo to use
              </p>
              <div className="grid grid-cols-2 gap-3">
                {results.map((img, idx) => (
                  <div key={idx} className="group relative">
                    <img
                      src={img}
                      alt={`Variation ${idx + 1}`}
                      className="w-full rounded-lg object-cover"
                    />
                    <button
                      onClick={() => handleUsePhoto(img)}
                      disabled={syncing}
                      className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/60 opacity-0 transition group-hover:opacity-100"
                    >
                      <span className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white">
                        {syncing ? "Syncing..." : "Use this photo"}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setResults([])}
                className="mt-4 w-full text-center text-sm text-zinc-500 transition hover:text-zinc-300"
              >
                ← Try different settings
              </button>
            </>
          )}

          {error && (
            <p className="mt-3 text-sm text-red-400">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
