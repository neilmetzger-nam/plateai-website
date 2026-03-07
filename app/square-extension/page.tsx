"use client";

import { useState, useEffect } from "react";

interface SquareItem {
  id: string;
  name: string;
  description: string;
  categoryName: string;
}

const STYLES = [
  { id: "enhanced", label: "Enhanced" },
  { id: "generated", label: "Generated" },
  { id: "michelin", label: "Michelin" },
  { id: "xray", label: "X-Ray" },
  { id: "slice", label: "Slice" },
];

export default function SquareExtensionPage() {
  const [item, setItem] = useState<SquareItem | null>(null);
  const [style, setStyle] = useState("enhanced");
  const [variations, setVariations] = useState(2);
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "SQUARE_ITEM_CONTEXT") {
        setItem(event.data.item);
        setResults([]);
        setSent(false);
        setError("");
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  async function handleGenerate() {
    if (!item) return;
    setGenerating(true);
    setError("");
    setResults([]);

    try {
      const prompt = `Professional food photography of "${item.name}". ${item.description}. Style: ${style}. High-quality, restaurant-ready, studio lighting.`;
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, resolution: "1k", variations }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Generation failed.");
      } else {
        setResults(data.images || []);
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setGenerating(false);
    }
  }

  function handleUseThis(imageUrl: string) {
    if (!item) return;
    window.parent.postMessage(
      {
        type: "SQUARE_SET_ITEM_IMAGE",
        itemId: item.id,
        imageUrl,
      },
      "*"
    );
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-4 text-zinc-100" style={{ maxWidth: 360 }}>
      {/* Logo */}
      <div className="mb-4 text-lg font-bold">
        <span className="text-white">Plate</span>
        <span className="text-orange-500">AI</span>
      </div>

      {!item ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center">
          <p className="text-sm text-zinc-400">
            Select an item in Square to generate photos.
          </p>
        </div>
      ) : (
        <>
          {/* Item name */}
          <div className="mb-4">
            <p className="text-base font-semibold text-white">{item.name}</p>
            {item.categoryName && (
              <p className="text-xs text-zinc-500">{item.categoryName}</p>
            )}
          </div>

          {results.length === 0 && !sent ? (
            <>
              {/* Style picker */}
              <p className="mb-2 text-xs font-medium text-zinc-400">Style</p>
              <div className="mb-4 flex flex-wrap gap-1.5">
                {STYLES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id)}
                    className={`rounded-full px-2.5 py-1 text-xs transition ${
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
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs font-medium text-zinc-400">Variations</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setVariations(Math.max(1, variations - 1))}
                    className="flex h-6 w-6 items-center justify-center rounded border border-zinc-700 text-xs text-zinc-400"
                  >
                    −
                  </button>
                  <span className="w-4 text-center text-sm font-semibold text-white">
                    {variations}
                  </span>
                  <button
                    onClick={() => setVariations(Math.min(4, variations + 1))}
                    className="flex h-6 w-6 items-center justify-center rounded border border-zinc-700 text-xs text-zinc-400"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Generate button */}
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full rounded-full bg-orange-500 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
              >
                {generating ? "Generating..." : "Generate Photo"}
              </button>
            </>
          ) : sent ? (
            <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-center">
              <p className="text-sm font-semibold text-green-400">
                Photo sent to Square
              </p>
              <button
                onClick={() => {
                  setSent(false);
                  setResults([]);
                }}
                className="mt-3 text-xs text-zinc-400 transition hover:text-zinc-200"
              >
                Generate more →
              </button>
            </div>
          ) : (
            <>
              {/* Results grid */}
              <div className="grid grid-cols-2 gap-2">
                {results.map((img, idx) => (
                  <div key={idx} className="group relative">
                    <img
                      src={img}
                      alt={`${item.name} variation ${idx + 1}`}
                      className="w-full rounded-lg object-cover"
                    />
                    <button
                      onClick={() => handleUseThis(img)}
                      className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/60 opacity-0 transition group-hover:opacity-100"
                    >
                      <span className="rounded-full bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white">
                        Use This
                      </span>
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setResults([])}
                className="mt-3 w-full text-center text-xs text-zinc-500 transition hover:text-zinc-300"
              >
                ← Try different settings
              </button>
            </>
          )}

          {error && (
            <p className="mt-3 text-xs text-red-400">{error}</p>
          )}
        </>
      )}
    </div>
  );
}
