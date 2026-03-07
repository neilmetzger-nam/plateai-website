"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { PLANS, type PlanKey } from "@/lib/plans";

interface CheckoutModalProps {
  plan: PlanKey;
  onClose: () => void;
}

declare global {
  interface Window {
    Square: {
      payments: (appId: string, locationId: string) => {
        card: () => Promise<{
          attach: (selector: string) => Promise<void>;
          tokenize: () => Promise<{
            status: string;
            token?: string;
            errors?: { message: string }[];
          }>;
        }>;
      };
    };
  }
}

export default function CheckoutModal({ plan, onClose }: CheckoutModalProps) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cardReady, setCardReady] = useState(false);
  const cardRef = useRef<Awaited<ReturnType<ReturnType<typeof window.Square.payments>["card"]>> | null>(null);

  const planData = PLANS[plan];

  useEffect(() => {
    async function initSquare() {
      try {
        const appId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID;
        const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;
        if (!appId || !locationId || !window.Square) return;

        const payments = window.Square.payments(appId, locationId);
        const card = await payments.card();
        await card.attach("#card-container");
        cardRef.current = card;
        setCardReady(true);
      } catch (err) {
        console.error("Square init error:", err);
        setError("Failed to load payment form. Please refresh.");
      }
    }
    initSquare();
  }, []);

  async function handleSubmit() {
    if (!cardRef.current || !user) return;
    setLoading(true);
    setError("");

    try {
      const result = await cardRef.current.tokenize();
      if (result.status !== "OK" || !result.token) {
        setError(result.errors?.[0]?.message || "Payment failed. Please try again.");
        return;
      }

      const res = await fetch("/api/square/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          sourceId: result.token,
          email: user.primaryEmailAddress?.emailAddress || "",
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Subscription failed. Please try again.");
        return;
      }

      window.location.href = "/dashboard?upgraded=1";
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 backdrop-blur-sm px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-0 overflow-hidden md:max-w-2xl">
        <div className="flex flex-col md:flex-row">
          {/* Plan summary */}
          <div className="border-b border-zinc-800 p-6 md:w-1/2 md:border-b-0 md:border-r">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-white">{planData.name}</h3>
              <span className="rounded-full bg-orange-500 px-3 py-0.5 text-sm font-semibold text-white">
                ${planData.price}/mo
              </span>
            </div>
            {"popular" in planData && planData.popular && (
              <span className="mt-2 inline-block rounded-full bg-orange-500/20 px-2.5 py-0.5 text-xs font-semibold text-orange-400">
                Most Popular
              </span>
            )}
            <ul className="mt-6 space-y-2">
              {planData.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-zinc-400">
                  <span className="mt-0.5 text-orange-500">✓</span> {f}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-xs text-zinc-500">Cancel anytime. No contracts.</p>
          </div>

          {/* Payment form */}
          <div className="p-6 md:w-1/2">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-white">Card details</p>
              <button onClick={onClose} className="text-zinc-500 transition hover:text-white">✕</button>
            </div>
            <div id="card-container" className="min-h-[60px] rounded-lg" />
            <button
              onClick={handleSubmit}
              disabled={loading || !cardReady}
              className="mt-6 w-full rounded-full bg-orange-500 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Processing..." : "Start Subscription →"}
            </button>
            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
            <p className="mt-4 text-center text-xs text-zinc-500">
              🔒 Secured by Square · Your card is charged today. Next billing in 30 days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
