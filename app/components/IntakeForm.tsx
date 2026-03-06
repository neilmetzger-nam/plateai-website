"use client";

import { useState } from "react";

interface IntakeFormProps {
  onClose: () => void;
}

const STEPS = [
  {
    id: "restaurant",
    question: "What's your restaurant called?",
    subtext: "We'll personalize your first photos to match your brand.",
    field: "restaurantName",
    type: "text",
    placeholder: "e.g. The Urban Table",
    options: [] as string[],
  },
  {
    id: "name",
    question: "And your name?",
    subtext: "So we know who we're talking to.",
    field: "contactName",
    type: "text",
    placeholder: "e.g. Maria",
    options: [] as string[],
  },
  {
    id: "email",
    question: "Where should we send your photos?",
    subtext: "Your first 5 AI-generated photos, delivered within 24 hours.",
    field: "email",
    type: "email",
    placeholder: "you@restaurant.com",
    options: [] as string[],
  },
  {
    id: "cuisine",
    question: "What type of cuisine do you serve?",
    subtext: "Our AI knows Thai curry should look different from wagyu tartare.",
    field: "cuisine",
    type: "select",
    placeholder: "",
    options: [
      "American / Comfort Food",
      "Italian / Mediterranean",
      "Asian / Japanese / Sushi",
      "Thai / Vietnamese / Southeast Asian",
      "Mexican / Latin",
      "Seafood / Raw Bar",
      "Steakhouse / Wood-fired",
      "Bakery / Café",
      "Other",
    ],
  },
  {
    id: "dishes",
    question: "How many dishes need photos?",
    subtext: "Just a rough idea — no commitment.",
    field: "dishCount",
    type: "select",
    placeholder: "",
    options: ["Under 20", "20–50", "50–100", "100+", "Not sure yet"],
  },
];

export default function IntakeForm({ onClose }: IntakeFormProps) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const current = STEPS[step];
  const value = values[current?.field] ?? "";
  const progress = (step / STEPS.length) * 100;

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleNext();
  }

  function handleNext() {
    if (!value.trim()) return;
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("https://formspree.io/f/mpqyzprz", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          restaurantName: values.restaurantName,
          contactName: values.contactName,
          email: values.email,
          cuisine: values.cuisine,
          dishCount: values.dishCount,
          _subject: `PlateAI Lead: ${values.restaurantName}`,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function selectOption(opt: string) {
    setValues({ ...values, [current.field]: opt });
    setTimeout(() => {
      if (step < STEPS.length - 1) setStep(step + 1);
      else handleSubmit();
    }, 150);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/95 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative flex h-full w-full max-w-2xl flex-col px-6 py-12 md:h-auto md:rounded-2xl md:border md:border-zinc-800 md:bg-zinc-900 md:py-16">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-zinc-500 transition hover:text-white"
        >
          ✕
        </button>

        {!submitted ? (
          <>
            <div className="mb-10 h-1 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-orange-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
              {step + 1} / {STEPS.length}
            </p>

            <h2 className="text-2xl font-bold text-white md:text-3xl">{current.question}</h2>
            <p className="mt-2 text-sm text-zinc-400">{current.subtext}</p>

            <div className="mt-10">
              {current.type === "select" ? (
                <div className="flex flex-col gap-3">
                  {current.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => selectOption(opt)}
                      className={`rounded-xl border px-5 py-3.5 text-left text-sm font-medium transition ${
                        value === opt
                          ? "border-orange-500 bg-orange-500/10 text-white"
                          : "border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <div>
                  <input
                    autoFocus
                    type={current.type}
                    value={value}
                    placeholder={current.placeholder}
                    onChange={(e) => setValues({ ...values, [current.field]: e.target.value })}
                    onKeyDown={handleKey}
                    className="w-full border-b-2 border-zinc-600 bg-transparent pb-3 text-xl text-white placeholder-zinc-600 outline-none transition focus:border-orange-500"
                  />
                  <button
                    onClick={handleNext}
                    disabled={!value.trim()}
                    className="mt-8 flex items-center gap-2 rounded-full bg-orange-500 px-7 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-40"
                  >
                    {step === STEPS.length - 1 ? "Generate My Photos →" : "Continue →"}
                  </button>
                </div>
              )}
            </div>

            {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
            {loading && <p className="mt-4 text-sm text-zinc-400">Submitting…</p>}

            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="mt-6 text-xs text-zinc-500 transition hover:text-zinc-300"
              >
                ← Back
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-8">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/20 text-3xl">
              🍽️
            </div>
            <h2 className="text-3xl font-bold text-white">You&apos;re on the list!</h2>
            <p className="mt-4 max-w-md text-zinc-400">
              We&apos;ll generate your first 5 photos for{" "}
              <span className="font-semibold text-white">{values.restaurantName}</span> and send
              them to <span className="font-semibold text-white">{values.email}</span> within 24
              hours.
            </p>
            <p className="mt-3 text-sm text-zinc-500">No credit card. No commitment.</p>
            <button
              onClick={onClose}
              className="mt-10 rounded-full bg-orange-500 px-8 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              Back to PlateAI
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
