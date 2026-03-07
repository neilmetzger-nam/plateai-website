"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  CUISINE_OPTIONS,
  getTemplatesForCuisine,
  type CuisineTemplate,
  type CuisineQuestion,
} from "@/lib/cuisine-templates";
import { buildPrompt } from "@/lib/prompt-builder";

const TOTAL_STEPS = 8;

const STYLES = [
  {
    id: "enhanced" as const,
    title: "Enhanced",
    desc: "Your real photo, artistically perfected. Colors deepened, lighting improved, background cleaned.",
    badge: "Starter+",
    color: "bg-amber-900/40",
  },
  {
    id: "generated" as const,
    title: "Generated",
    desc: "Full AI creation from your ingredient list. Accurate, photorealistic, platform-ready.",
    badge: "Starter+",
    color: "bg-orange-900/40",
  },
  {
    id: "michelin" as const,
    title: "Michelin",
    desc: "Same ingredients, plated like a fine-dining masterpiece. Architectural, precise, aspirational.",
    badge: "Pro+",
    color: "bg-rose-900/40",
  },
  {
    id: "xray" as const,
    title: "X-Ray / Transparent",
    desc: "3D cutaway view showing every layer inside the dish. Stunning for soups, curries, ramen.",
    badge: "Pro+",
    color: "bg-cyan-900/40",
  },
  {
    id: "slice" as const,
    title: "The Slice",
    desc: "A wedge removed to reveal the interior cross-section. Viral on social media.",
    badge: "Pro+",
    color: "bg-violet-900/40",
  },
];

const PLATFORMS = [
  { id: "doordash", label: "DoorDash", spec: "1400×800px · 16:9" },
  { id: "ubereats", label: "UberEats", spec: "1200×900px · 4:3" },
  { id: "grubhub", label: "Grubhub", spec: "1024×768px · 4:3" },
  { id: "google", label: "Google", spec: "1024×1024px · 1:1" },
  { id: "website", label: "Website / Menu", spec: "1920×1080px · 16:9" },
  { id: "instagram", label: "Instagram / Social", spec: "1080×1080px · 1:1" },
  { id: "print", label: "Print Menu", spec: "3000×2000px · 3:2" },
];

const RESOLUTIONS = [
  {
    id: "1k" as const,
    title: "1K",
    desc: "1024×1024px · Web & delivery apps · Starter plan",
    badge: null,
  },
  {
    id: "2k" as const,
    title: "2K",
    desc: "2048×2048px · Website hero & menus · Pro plan",
    badge: "Most Popular",
  },
  {
    id: "4k" as const,
    title: "4K",
    desc: "4096×4096px · Large format print & ads · Studio plan",
    badge: null,
  },
];

type Style = "enhanced" | "generated" | "michelin" | "xray" | "slice";
type Resolution = "1k" | "2k" | "4k";
type DescSource = "text" | "url" | null;

function parseIngredients(raw: string): string[] {
  if (!raw.trim()) return [];
  const items = raw
    .split(/[,\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return [...new Set(items)];
}

export default function GenerateWizard() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  // State
  const [dishName, setDishName] = useState("");
  const [hasExistingPhoto, setHasExistingPhoto] = useState<boolean | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [descriptionSource, setDescriptionSource] = useState<DescSource>(null);
  const [descriptionRaw, setDescriptionRaw] = useState("");
  const [descriptionUrl, setDescriptionUrl] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState("");
  const [showAddIngredient, setShowAddIngredient] = useState(false);
  const [style, setStyle] = useState<Style | null>(null);
  const [platforms, setPlatforms] = useState<string[]>(PLATFORMS.map((p) => p.id));
  const [resolution, setResolution] = useState<Resolution | null>(null);
  const [variations, setVariations] = useState(2);
  const [addVideo, setAddVideo] = useState(false);
  const [videoBannerDismissed, setVideoBannerDismissed] = useState(false);
  const [cuisine, setCuisine] = useState("");
  const [cuisineContext, setCuisineContext] = useState<Record<string, string | string[] | boolean>>({});
  const [selectedTemplate, setSelectedTemplate] = useState<CuisineTemplate | null>(null);
  const [showCuisineSuggestions, setShowCuisineSuggestions] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [generateError, setGenerateError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  const goForward = useCallback(
    (to?: number) => {
      setDirection("forward");
      setStep(to ?? step + 1);
    },
    [step]
  );

  const goBack = useCallback(() => {
    if (step > 0) {
      setDirection("back");
      setStep(step - 1);
    }
  }, [step]);

  // Keyboard nav
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && step > 0) goBack();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step, goBack]);

  // Parse ingredients when moving to step 3
  useEffect(() => {
    if (step === 3) {
      const raw = descriptionSource === "text" ? descriptionRaw : "";
      if (ingredients.length === 0 && raw) {
        setIngredients(parseIngredients(raw));
      }
    }
  }, [step, descriptionSource, descriptionRaw, ingredients.length]);

  function handleFileUpload(file: File) {
    if (file.size > 20 * 1024 * 1024) return;
    if (!file.type.match(/^image\/(png|jpeg|webp)$/)) return;
    setUploadedFile(file);
    const url = URL.createObjectURL(file);
    setUploadPreview(url);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }

  async function handleGenerate() {
    const config = {
      dishName,
      hasExistingPhoto: hasExistingPhoto ?? false,
      uploadedFile,
      descriptionSource: descriptionSource as "text" | "url",
      descriptionRaw: descriptionSource === "text" ? descriptionRaw : descriptionUrl,
      ingredients,
      style,
      platforms,
      resolution,
      variations,
      addVideo,
      cuisine,
      cuisineContext,
      selectedTemplate: selectedTemplate?.id,
    };
    const prompt = buildPrompt(config);
    setGenerating(true);
    setGenerateError("");
    setGeneratedImages([]);
    setGeneratedPrompt(prompt);

    try {
      // Compress image before sending if we have one
      let imageDataUri: string | undefined;
      if (uploadPreview && style === "enhanced") {
        // Compress to max 800px and 0.7 quality to stay under Vercel 4.5MB limit
        imageDataUri = await new Promise<string>((resolve) => {
          const img = new window.Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const max = 800;
            const scale = Math.min(1, max / Math.max(img.width, img.height));
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            const ctx = canvas.getContext("2d")!;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL("image/jpeg", 0.7));
          };
          img.src = uploadPreview;
        });
      }

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, imageDataUri, resolution: resolution ?? "1k", variations }),
      });
      let data: { images?: string[]; error?: string } = {};
      try {
        data = await res.json();
      } catch {
        setGenerateError("Server error. Please try again.");
        return;
      }
      if (!res.ok || data.error) {
        setGenerateError(data.error ?? "Generation failed. Please try again.");
      } else {
        setGeneratedImages(data.images ?? []);
        setStep(8); // move to results step
      }
    } catch {
      setGenerateError("Something went wrong. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  function handleCuisineAnswer(questionId: string, value: string | string[] | boolean) {
    setCuisineContext((prev) => ({ ...prev, [questionId]: value }));
  }

  function toggleCuisineMulti(questionId: string, option: string) {
    setCuisineContext((prev) => {
      const current = (prev[questionId] as string[]) || [];
      const next = current.includes(option)
        ? current.filter((v) => v !== option)
        : [...current, option];
      return { ...prev, [questionId]: next };
    });
  }

  function togglePlatform(id: string) {
    setPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  function removeIngredient(idx: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== idx));
  }

  function addIngredientTag() {
    const trimmed = newIngredient.trim();
    if (trimmed && !ingredients.includes(trimmed)) {
      setIngredients((prev) => [...prev, trimmed]);
    }
    setNewIngredient("");
    setShowAddIngredient(false);
  }

  const animClass =
    direction === "forward"
      ? "animate-[fadeSlideUp_0.3s_ease-out]"
      : "animate-[fadeSlideDown_0.3s_ease-out]";

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      <style jsx global>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeSlideDown {
          from {
            opacity: 0;
            transform: translateY(-16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Progress bar */}
      <div className="fixed left-0 right-0 top-0 z-50 h-1 bg-zinc-800">
        <div
          className="h-full bg-orange-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6">
        <Link href="/" className="text-xl font-bold">
          <span className="text-white">Plate</span>
          <span className="text-orange-500">AI</span>
        </Link>
        <span className="text-sm text-zinc-500">
          {step + 1} / {TOTAL_STEPS}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className={`w-full max-w-2xl ${animClass}`} key={step}>
          {/* Step 1 — Dish Name */}
          {step === 0 && (
            <div>
              <h1 className="text-3xl font-bold text-white md:text-4xl">
                What dish are we photographing?
              </h1>
              <p className="mt-3 text-zinc-400">
                Enter the name exactly as it appears on your menu.
              </p>
              <input
                autoFocus
                type="text"
                value={dishName}
                onChange={(e) => setDishName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && dishName.trim() && goForward()}
                placeholder="e.g. Wonton Soup"
                className="mt-10 w-full border-b-2 border-zinc-600 bg-transparent pb-3 text-xl text-white placeholder-zinc-600 outline-none transition focus:border-orange-500"
              />
              <button
                onClick={() => goForward()}
                disabled={!dishName.trim()}
                className="mt-8 rounded-full bg-orange-500 px-7 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-40"
              >
                Continue →
              </button>
            </div>
          )}

          {/* Step 2 — Existing Photo */}
          {step === 1 && (
            <div>
              <h1 className="text-3xl font-bold text-white md:text-4xl">
                Do you have an existing photo of this dish?
              </h1>
              <p className="mt-3 text-zinc-400">
                We can enhance your real photo, or generate from scratch.
              </p>
              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                <button
                  onClick={() => setHasExistingPhoto(true)}
                  className={`rounded-xl border p-6 text-left transition ${
                    hasExistingPhoto === true
                      ? "border-orange-500 bg-orange-500/10"
                      : "border-zinc-800 bg-zinc-900 hover:border-zinc-600"
                  }`}
                >
                  <p className="text-lg font-semibold text-white">Yes, I have a photo</p>
                  <p className="mt-1 text-sm text-zinc-400">We&apos;ll enhance it</p>
                </button>
                <button
                  onClick={() => {
                    setHasExistingPhoto(false);
                    setUploadedFile(null);
                    setUploadPreview(null);
                    setTimeout(() => goForward(), 150);
                  }}
                  className={`rounded-xl border p-6 text-left transition ${
                    hasExistingPhoto === false
                      ? "border-orange-500 bg-orange-500/10"
                      : "border-zinc-800 bg-zinc-900 hover:border-zinc-600"
                  }`}
                >
                  <p className="text-lg font-semibold text-white">No, start from scratch</p>
                  <p className="mt-1 text-sm text-zinc-400">We&apos;ll generate from description</p>
                </button>
              </div>

              {/* File upload area (slides in when Yes) */}
              {hasExistingPhoto === true && (
                <div className="mt-8 animate-[fadeSlideUp_0.3s_ease-out]">
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-900 p-8 transition hover:border-zinc-500"
                  >
                    {uploadPreview ? (
                      <img
                        src={uploadPreview}
                        alt="Upload preview"
                        className="max-h-48 rounded-lg object-contain"
                      />
                    ) : (
                      <>
                        <p className="text-lg text-zinc-400">
                          Drag & drop your photo here
                        </p>
                        <p className="mt-2 text-sm text-zinc-600">
                          or click to browse · PNG, JPG, WebP · Max 20MB
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                  {uploadedFile && (
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-sm text-zinc-400">{uploadedFile.name}</p>
                      <button
                        onClick={() => goForward()}
                        className="rounded-full bg-orange-500 px-7 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
                      >
                        Continue →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3 — Menu Description */}
          {step === 2 && (
            <div>
              <h1 className="text-3xl font-bold text-white md:text-4xl">
                Where can we find your menu description?
              </h1>
              <p className="mt-3 text-zinc-400">
                We use this to make sure every ingredient is accurate — nothing added, nothing
                missing.
              </p>
              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                <button
                  onClick={() => setDescriptionSource("text")}
                  className={`rounded-xl border p-6 text-left transition ${
                    descriptionSource === "text"
                      ? "border-orange-500 bg-orange-500/10"
                      : "border-zinc-800 bg-zinc-900 hover:border-zinc-600"
                  }`}
                >
                  <p className="text-lg font-semibold text-white">I&apos;ll paste it</p>
                </button>
                <button
                  onClick={() => setDescriptionSource("url")}
                  className={`rounded-xl border p-6 text-left transition ${
                    descriptionSource === "url"
                      ? "border-orange-500 bg-orange-500/10"
                      : "border-zinc-800 bg-zinc-900 hover:border-zinc-600"
                  }`}
                >
                  <p className="text-lg font-semibold text-white">Here&apos;s a link</p>
                </button>
              </div>

              {descriptionSource === "text" && (
                <div className="mt-8 animate-[fadeSlideUp_0.3s_ease-out]">
                  <textarea
                    autoFocus
                    rows={4}
                    value={descriptionRaw}
                    onChange={(e) => setDescriptionRaw(e.target.value)}
                    placeholder="e.g. Clear broth, house-made wontons filled with chicken and pork, bean sprouts, carrots, scallions, cilantro"
                    className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-900 p-4 text-white placeholder-zinc-600 outline-none transition focus:border-orange-500"
                  />
                  <button
                    onClick={() => {
                      setIngredients(parseIngredients(descriptionRaw));
                      goForward();
                    }}
                    disabled={!descriptionRaw.trim()}
                    className="mt-4 rounded-full bg-orange-500 px-7 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-40"
                  >
                    Continue →
                  </button>
                </div>
              )}

              {descriptionSource === "url" && (
                <div className="mt-8 animate-[fadeSlideUp_0.3s_ease-out]">
                  <input
                    autoFocus
                    type="url"
                    value={descriptionUrl}
                    onChange={(e) => setDescriptionUrl(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && descriptionUrl.trim() && goForward()
                    }
                    placeholder="https://www.doordash.com/store/your-restaurant/..."
                    className="w-full border-b-2 border-zinc-600 bg-transparent pb-3 text-xl text-white placeholder-zinc-600 outline-none transition focus:border-orange-500"
                  />
                  <button
                    onClick={() => goForward()}
                    disabled={!descriptionUrl.trim()}
                    className="mt-8 rounded-full bg-orange-500 px-7 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-40"
                  >
                    Continue →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 4 — Confirm Ingredients */}
          {step === 3 && (
            <div>
              <h1 className="text-3xl font-bold text-white md:text-4xl">
                Confirm your ingredients
              </h1>
              <p className="mt-3 text-zinc-400">
                We pulled these from your description. Add or remove anything before we generate.
              </p>

              <div className="mt-6 flex items-start gap-3 rounded-xl border border-yellow-600/40 bg-yellow-500/10 px-4 py-3">
                <span className="mt-0.5 text-yellow-400">⚠️</span>
                <p className="text-sm text-yellow-200">
                  Our AI will only include ingredients shown here. Nothing will be added or
                  removed.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-2">
                {ingredients.map((ing, idx) => (
                  <span
                    key={idx}
                    className="flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200"
                  >
                    {ing}
                    <button
                      onClick={() => removeIngredient(idx)}
                      className="ml-1 text-zinc-500 transition hover:text-red-400"
                    >
                      ×
                    </button>
                  </span>
                ))}

                {showAddIngredient ? (
                  <span className="flex items-center gap-1 rounded-full border border-orange-500 bg-zinc-900 px-3 py-1">
                    <input
                      autoFocus
                      value={newIngredient}
                      onChange={(e) => setNewIngredient(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addIngredientTag();
                        if (e.key === "Escape") {
                          setShowAddIngredient(false);
                          setNewIngredient("");
                        }
                      }}
                      className="w-24 bg-transparent text-sm text-white outline-none placeholder-zinc-500"
                      placeholder="ingredient"
                    />
                    <button
                      onClick={addIngredientTag}
                      className="text-sm text-orange-500 hover:text-orange-400"
                    >
                      ✓
                    </button>
                  </span>
                ) : (
                  <button
                    onClick={() => setShowAddIngredient(true)}
                    className="rounded-full border border-dashed border-zinc-600 px-3 py-1.5 text-sm text-zinc-500 transition hover:border-zinc-400 hover:text-zinc-300"
                  >
                    + Add ingredient
                  </button>
                )}
              </div>

              {/* Cuisine selector */}
              <div className="mt-8">
                <p className="mb-3 text-sm font-medium text-zinc-400">
                  What cuisine is this dish?
                </p>
                <div className="flex flex-wrap gap-2">
                  {CUISINE_OPTIONS.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setCuisine(c);
                        const templates = getTemplatesForCuisine(c);
                        setSelectedTemplate(templates[0] || null);
                        setCuisineContext({});
                        setShowCuisineSuggestions(true);
                      }}
                      className={`rounded-full px-3 py-1.5 text-sm transition ${
                        cuisine === c
                          ? "bg-orange-500 text-white"
                          : "border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Smart suggestions */}
              {cuisine && selectedTemplate && showCuisineSuggestions && (
                <div className="mt-8 animate-[fadeSlideUp_0.3s_ease-out]">
                  <button
                    onClick={() => setShowCuisineSuggestions((v) => !v)}
                    className="mb-4 flex items-center gap-2 text-sm font-semibold text-orange-400"
                  >
                    🍽️ Smart suggestions for {cuisine}
                    <span className="text-xs text-zinc-500">▼</span>
                  </button>

                  {/* Template picker if multiple */}
                  {getTemplatesForCuisine(cuisine).length > 1 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {getTemplatesForCuisine(cuisine).map((t) => (
                        <button
                          key={t.id}
                          onClick={() => {
                            setSelectedTemplate(t);
                            setCuisineContext({});
                          }}
                          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                            selectedTemplate.id === t.id
                              ? "bg-orange-500/20 text-orange-400 border border-orange-500/40"
                              : "border border-zinc-700 text-zinc-500 hover:text-zinc-300"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                    {selectedTemplate.questions.map((q) => (
                      <CuisineQuestionField
                        key={`${selectedTemplate.id}-${q.id}`}
                        question={q}
                        value={cuisineContext[q.id]}
                        onAnswer={(val) => handleCuisineAnswer(q.id, val)}
                        onToggleMulti={(opt) => toggleCuisineMulti(q.id, opt)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {cuisine && selectedTemplate && !showCuisineSuggestions && (
                <button
                  onClick={() => setShowCuisineSuggestions(true)}
                  className="mt-6 text-sm text-zinc-500 transition hover:text-orange-400"
                >
                  🍽️ Show smart suggestions for {cuisine} ▶
                </button>
              )}

              <button
                onClick={() => goForward()}
                disabled={ingredients.length === 0}
                className="mt-10 rounded-full bg-orange-500 px-7 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-40"
              >
                Looks good, continue →
              </button>
            </div>
          )}

          {/* Step 5 — Photo Style */}
          {step === 4 && (
            <div>
              <h1 className="text-3xl font-bold text-white md:text-4xl">
                Choose your photo style
              </h1>
              <p className="mt-3 text-zinc-400">Each style tells a different story.</p>
              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                {STYLES.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setStyle(s.id);
                      setTimeout(() => goForward(), 150);
                    }}
                    className={`rounded-xl border p-5 text-left transition ${
                      idx === STYLES.length - 1 ? "sm:col-span-2" : ""
                    } ${
                      style === s.id
                        ? "border-orange-500 bg-orange-500/10"
                        : "border-zinc-800 bg-zinc-900 hover:border-zinc-600"
                    }`}
                  >
                    <div
                      className={`mb-3 h-16 w-full rounded-lg ${s.color}`}
                    />
                    <div className="flex items-center gap-2">
                      <p className="text-base font-semibold text-white">{s.title}</p>
                      <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                        {s.badge}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-400">{s.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 6 — Platform Destinations */}
          {step === 5 && (
            <div>
              <h1 className="text-3xl font-bold text-white md:text-4xl">
                Where will you use these photos?
              </h1>
              <p className="mt-3 text-zinc-400">
                We&apos;ll export the right size and ratio for each platform automatically.
              </p>
              <div className="mt-10 grid gap-3 sm:grid-cols-2">
                {PLATFORMS.map((p) => {
                  const checked = platforms.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => togglePlatform(p.id)}
                      className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                        checked
                          ? "border-orange-500 bg-orange-500/10"
                          : "border-zinc-800 bg-zinc-900 hover:border-zinc-600"
                      }`}
                    >
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                          checked
                            ? "border-orange-500 bg-orange-500 text-white"
                            : "border-zinc-600"
                        }`}
                      >
                        {checked && <span className="text-xs">✓</span>}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{p.label}</p>
                        <p className="text-xs text-zinc-500">{p.spec}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => goForward()}
                disabled={platforms.length === 0}
                className="mt-8 rounded-full bg-orange-500 px-7 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-40"
              >
                Continue →
              </button>
            </div>
          )}

          {/* Step 7 — Resolution */}
          {step === 6 && (
            <div>
              <h1 className="text-3xl font-bold text-white md:text-4xl">
                What resolution do you need?
              </h1>
              <p className="mt-3 text-zinc-400">
                Higher resolution = sharper on large screens and print.
              </p>
              <div className="mt-10 flex flex-col gap-4">
                {RESOLUTIONS.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setResolution(r.id);
                      setTimeout(() => goForward(), 150);
                    }}
                    className={`relative rounded-xl border p-5 text-left transition ${
                      resolution === r.id
                        ? "border-orange-500 bg-orange-500/10"
                        : "border-zinc-800 bg-zinc-900 hover:border-zinc-600"
                    }`}
                  >
                    {r.badge && (
                      <span className="absolute -top-2.5 right-4 rounded-full bg-orange-500 px-3 py-0.5 text-xs font-semibold text-white">
                        {r.badge}
                      </span>
                    )}
                    <p className="text-2xl font-bold text-white">{r.title}</p>
                    <p className="mt-1 text-sm text-zinc-400">{r.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 8 — Review & Generate */}
          {step === 7 && (
            <div>
              <h1 className="text-3xl font-bold text-white md:text-4xl">Ready to generate</h1>

              <div className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <span className="text-sm text-zinc-500">Dish</span>
                    <span className="font-semibold text-white">{dishName}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <span className="text-sm text-zinc-500">Mode</span>
                    <span className="font-semibold text-white capitalize">
                      {style === "xray" ? "X-Ray / Transparent" : style}
                    </span>
                  </div>
                  <div className="border-b border-zinc-800 pb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-500">Ingredients</span>
                      <span className="text-sm text-zinc-400">{ingredients.length} items</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {ingredients.map((ing, idx) => (
                        <span
                          key={idx}
                          className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-300"
                        >
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <span className="text-sm text-zinc-500">Platforms</span>
                    <span className="text-sm text-zinc-300">
                      {platforms
                        .map((id) => PLATFORMS.find((p) => p.id === id)?.label)
                        .join(", ")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <span className="text-sm text-zinc-500">Resolution</span>
                    <span className="font-semibold text-white uppercase">{resolution}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-500">Variations</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setVariations(Math.max(1, variations - 1))}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 text-zinc-400 transition hover:border-zinc-500 hover:text-white"
                      >
                        −
                      </button>
                      <span className="w-6 text-center font-semibold text-white">
                        {variations}
                      </span>
                      <button
                        onClick={() => setVariations(Math.min(8, variations + 1))}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 text-zinc-400 transition hover:border-zinc-500 hover:text-white"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Video upsell */}
              {!videoBannerDismissed && (
                <div className="mt-6 flex items-center justify-between rounded-xl bg-orange-500/20 border border-orange-500/40 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🎬</span>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Add a hero video for this dish
                      </p>
                      <p className="text-xs text-orange-200">
                        Cinematic 8s clip · +1 video credit
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAddVideo(!addVideo)}
                      className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                        addVideo
                          ? "bg-white text-orange-500"
                          : "bg-orange-500 text-white hover:bg-orange-600"
                      }`}
                    >
                      {addVideo ? "Added ✓" : "Add Video"}
                    </button>
                    <button
                      onClick={() => setVideoBannerDismissed(true)}
                      className="text-orange-300 transition hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="mt-8 w-full rounded-full bg-orange-500 py-4 text-base font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {generating ? "Generating... ✨" : "Generate My Photos →"}
              </button>
              {generateError && <p className="mt-4 text-center text-sm text-red-400">{generateError}</p>}
              <p className="mt-3 text-center text-sm text-zinc-500">
                This will use {variations} credit{variations !== 1 ? "s" : ""} from your plan
                {addVideo ? " + 1 video credit" : ""}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Back button */}
      {step > 0 && (
        <div className="px-6 pb-8">
          <button
            onClick={goBack}
            className="text-sm text-zinc-500 transition hover:text-zinc-300"
          >
            ← Back
          </button>
        </div>
      )}
    </div>
  );
}

function CuisineQuestionField({
  question,
  value,
  onAnswer,
  onToggleMulti,
}: {
  question: CuisineQuestion;
  value: string | string[] | boolean | undefined;
  onAnswer: (val: string | string[] | boolean) => void;
  onToggleMulti: (option: string) => void;
}) {
  if (question.type === "boolean") {
    const checked = value === true;
    return (
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-300">{question.question}</span>
        <button
          onClick={() => onAnswer(!checked)}
          className={`relative h-6 w-11 rounded-full transition ${
            checked ? "bg-orange-500" : "bg-zinc-700"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
              checked ? "left-5.5" : "left-0.5"
            }`}
          />
        </button>
      </div>
    );
  }

  if (question.type === "select") {
    return (
      <div>
        <p className="mb-2 text-sm text-zinc-300">{question.question}</p>
        <div className="flex flex-wrap gap-2">
          {question.options?.map((opt) => (
            <button
              key={opt}
              onClick={() => onAnswer(opt)}
              className={`rounded-full px-3 py-1 text-xs transition ${
                value === opt
                  ? "bg-orange-500 text-white"
                  : "border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (question.type === "multi") {
    const selected = (value as string[]) || [];
    return (
      <div>
        <p className="mb-2 text-sm text-zinc-300">{question.question}</p>
        <div className="flex flex-wrap gap-2">
          {question.options?.map((opt) => {
            const active = selected.includes(opt);
            return (
              <button
                key={opt}
                onClick={() => onToggleMulti(opt)}
                className={`rounded-full px-3 py-1 text-xs transition ${
                  active
                    ? "bg-orange-500 text-white"
                    : "border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
