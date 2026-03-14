"use client";

import { useState } from "react";
import Link from "next/link";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import IntakeForm from "./components/IntakeForm";
import CheckoutModal from "./components/CheckoutModal";
import type { PlanKey } from "@/lib/plans";

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();
  const [showForm, setShowForm] = useState(false);
  const [baFilter, setBaFilter] = useState("All");
  const [checkoutPlan, setCheckoutPlan] = useState<PlanKey | null>(null);

  function handlePricingClick(plan: PlanKey) {
    if (!isSignedIn) {
      window.location.href = "/sign-up";
    } else {
      setCheckoutPlan(plan);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {showForm && <IntakeForm onClose={() => setShowForm(false)} />}
      {checkoutPlan && (
        <CheckoutModal
          plan={checkoutPlan}
          onClose={() => setCheckoutPlan(null)}
        />
      )}

      {/* NAV */}
      <nav className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="#" className="text-2xl font-bold">
            <span className="text-white">Plate</span><span className="text-orange-500">AI</span>
          </a>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#how-it-works" className="text-sm text-zinc-400 transition hover:text-white">How It Works</a>
            <a href="#pricing" className="text-sm text-zinc-400 transition hover:text-white">Pricing</a>
            <a href="#examples" className="text-sm text-zinc-400 transition hover:text-white">Examples</a>
            <Link href="/generate" className="text-sm text-zinc-400 transition hover:text-white">Generate a Photo</Link>
            {isLoaded && isSignedIn ? (
              <div className="flex items-center gap-4">
                <Link href="/dashboard" className="text-sm text-zinc-400 transition hover:text-white">Dashboard</Link>
                <UserButton />
              </div>
            ) : (
              <SignInButton mode="modal">
                <button className="rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-600">
                  Start Free Trial
                </button>
              </SignInButton>
            )}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="px-6 pb-20 pt-24 md:pt-32">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white md:text-6xl lg:text-7xl">44% more sales starts with a better photo.</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400 md:text-xl">Text us your food photo. We enhance it, show you 3 styles, and deliver it sized perfectly for your menu, DoorDash, or Instagram. No photographer. No resizing errors. $29.95/month.</p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/generate" className="rounded-full bg-orange-500 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-orange-600">Generate Your First Photo →</Link>
            <a href="#examples" className="rounded-full border border-zinc-700 px-8 py-3.5 text-base font-semibold text-zinc-300 transition hover:border-zinc-500 hover:text-white">See Examples</a>
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            <span className="rounded-full bg-zinc-900 px-4 py-2 text-sm text-zinc-400">32 photos generated tonight</span>
            <span className="rounded-full bg-zinc-900 px-4 py-2 text-sm text-zinc-400">&lt; 2 min per image</span>
            <span className="rounded-full bg-zinc-900 px-4 py-2 text-sm text-zinc-400">Starting at $49/mo</span>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="bg-zinc-900 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-white md:text-4xl">How It Works</h2>
          <div className="mt-16 grid gap-12 md:grid-cols-3">
            <div className="text-center md:text-left">
              <div className="mb-4 text-4xl font-bold text-orange-500">01</div>
              <h3 className="mb-3 text-xl font-semibold text-white">Tell us your dish</h3>
              <p className="text-zinc-400">Enter your dish name, description, and cuisine style. Our AI knows how Thai curry should look different from wagyu tartare.</p>
            </div>
            <div className="text-center md:text-left">
              <div className="mb-4 text-4xl font-bold text-orange-500">02</div>
              <h3 className="mb-3 text-xl font-semibold text-white">We generate your photos</h3>
              <p className="text-zinc-400">Our AI creates multiple studio-quality images optimized for your website, DoorDash, UberEats, and Google — all in the right dimensions.</p>
            </div>
            <div className="text-center md:text-left">
              <div className="mb-4 text-4xl font-bold text-orange-500">03</div>
              <h3 className="mb-3 text-xl font-semibold text-white">Publish everywhere instantly</h3>
              <p className="text-zinc-400">Download platform-ready exports or connect your delivery accounts. Your menu photos update automatically.</p>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-white md:text-4xl">What You Get</h2>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: "🍽️", title: "Menu Photography", desc: "AI-generated food photos for every dish. Optimized for web, print, and delivery platforms." },
              { icon: "🎬", title: "Hero Videos", desc: "30–60 second cinematic films of your signature dishes. Perfect for your website homepage." },
              { icon: "📱", title: "Social Content", desc: "4 Reels, TikToks, and Stories per week. Scheduled and posted automatically." },
              { icon: "📦", title: "Delivery Platform Exports", desc: "Auto-sized images for DoorDash (1400×800), UberEats (5:4), and Google — no manual cropping." },
              { icon: "🌐", title: "Website Integration", desc: "Your photos live on your website and update instantly when you add or change a dish." },
              { icon: "🤖", title: "AI Concierge", desc: "An AI voice agent answers calls, describes your menu with the photos in mind, and takes reservations." },
            ].map((feature) => (
              <div key={feature.title} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 transition hover:border-zinc-700">
                <div className="mb-4 text-3xl">{feature.icon}</div>
                <h3 className="mb-2 text-lg font-semibold text-white">{feature.title}</h3>
                <p className="text-sm text-zinc-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REAL PHOTO GALLERY */}
      <section id="examples" className="bg-zinc-900 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-white md:text-4xl">Real AI-Generated Food Photos</h2>
          <p className="mt-4 text-center text-zinc-400">Generated for Ember &amp; Azure — a real restaurant opening in Leesburg, VA. No photographer. No studio.</p>
          <div className="mt-16 columns-1 gap-6 sm:columns-2 lg:columns-3">
            <div className="mb-6 break-inside-avoid">
              <div className="relative overflow-hidden rounded-xl">
                <img src="/images/wagyu-ribeye-1.webp" alt="A5 Wagyu Ribeye" className="w-full object-cover" />
                <span className="absolute bottom-3 left-3 rounded-full bg-orange-500 px-2.5 py-0.5 text-xs font-semibold text-white">AI Generated</span>
              </div>
              <p className="mt-2 text-sm text-zinc-400">A5 Wagyu Ribeye — Wood-fired</p>
            </div>
            <div className="mb-6 break-inside-avoid">
              <div className="relative overflow-hidden rounded-xl">
                <img src="/images/seafood-tower-1.webp" alt="Seafood Tower" className="w-full object-cover" />
                <span className="absolute bottom-3 left-3 rounded-full bg-orange-500 px-2.5 py-0.5 text-xs font-semibold text-white">AI Generated</span>
              </div>
              <p className="mt-2 text-sm text-zinc-400">Seafood Tower — Raw bar</p>
            </div>
            <div className="mb-6 break-inside-avoid">
              <div className="relative overflow-hidden rounded-xl">
                <img src="/images/massaman-curry-1.webp" alt="Massaman Curry" className="w-full object-cover" />
                <span className="absolute bottom-3 left-3 rounded-full bg-orange-500 px-2.5 py-0.5 text-xs font-semibold text-white">AI Generated</span>
              </div>
              <p className="mt-2 text-sm text-zinc-400">Massaman Curry — Thai</p>
            </div>
            <div className="mb-6 break-inside-avoid">
              <div className="relative overflow-hidden rounded-xl">
                <img src="/images/tuna-tartare-1.webp" alt="Tuna Tartare" className="w-full object-cover" />
                <span className="absolute bottom-3 left-3 rounded-full bg-orange-500 px-2.5 py-0.5 text-xs font-semibold text-white">AI Generated</span>
              </div>
              <p className="mt-2 text-sm text-zinc-400">Tuna Tartare — Japanese</p>
            </div>
            <div className="mb-6 break-inside-avoid">
              <div className="relative overflow-hidden rounded-xl">
                <img src="/images/omakase-bowl-1.webp" alt="Omakase Bowl" className="w-full object-cover" />
                <span className="absolute bottom-3 left-3 rounded-full bg-orange-500 px-2.5 py-0.5 text-xs font-semibold text-white">AI Generated</span>
              </div>
              <p className="mt-2 text-sm text-zinc-400">Omakase Bowl — Japanese</p>
            </div>
            <div className="mb-6 break-inside-avoid">
              <div className="relative overflow-hidden rounded-xl">
                <img src="/images/whole-fish-1.webp" alt="Whole Bronzino" className="w-full object-cover" />
                <span className="absolute bottom-3 left-3 rounded-full bg-orange-500 px-2.5 py-0.5 text-xs font-semibold text-white">AI Generated</span>
              </div>
              <p className="mt-2 text-sm text-zinc-400">Whole Bronzino — Wood-fired</p>
            </div>
            <div className="mb-6 break-inside-avoid">
              <div className="relative overflow-hidden rounded-xl">
                <img src="/images/yakitori-skewers-1.webp" alt="Yakitori Skewers" className="w-full object-cover" />
                <span className="absolute bottom-3 left-3 rounded-full bg-orange-500 px-2.5 py-0.5 text-xs font-semibold text-white">AI Generated</span>
              </div>
              <p className="mt-2 text-sm text-zinc-400">Yakitori Skewers — Japanese</p>
            </div>
            <div className="mb-6 break-inside-avoid">
              <div className="relative overflow-hidden rounded-xl">
                <img src="/images/raw-bar-tower-1.webp" alt="Raw Bar Tower" className="w-full object-cover" />
                <span className="absolute bottom-3 left-3 rounded-full bg-orange-500 px-2.5 py-0.5 text-xs font-semibold text-white">AI Generated</span>
              </div>
              <p className="mt-2 text-sm text-zinc-400">Raw Bar Tower — Seafood</p>
            </div>
          </div>
        </div>
      </section>

      {/* VIDEO REEL */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-white md:text-4xl">See It In Motion</h2>
          <p className="mt-4 text-center text-zinc-400">Cinematic hero videos generated in minutes — ready for your website, social, and ads.</p>
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
              <video src="/videos/pork-ribs-on-grill.mp4" autoPlay muted loop playsInline className="w-full object-cover" />
              <p className="px-4 py-3 text-sm text-zinc-400">Pork Ribs — Wood-fired grill</p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
              <video src="/videos/whole-fish-grill.mp4" autoPlay muted loop playsInline className="w-full object-cover" />
              <p className="px-4 py-3 text-sm text-zinc-400">Whole Fish — Thai herb crust</p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
              <video src="/videos/ember-azure-hero.mp4" autoPlay muted loop playsInline className="w-full object-cover" />
              <p className="px-4 py-3 text-sm text-zinc-400">Ember &amp; Azure — Hero reel</p>
            </div>
          </div>
        </div>
      </section>


      {/* BEFORE / AFTER GALLERY */}
      <section className="bg-zinc-950 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-white md:text-4xl">Already have photos? We make them extraordinary.</h2>
          <p className="mt-4 text-center text-zinc-400">Real restaurants. Real dishes. No photographers.</p>

          {/* Restaurant filter tabs */}
          <div className="mt-10 flex justify-center gap-6">
            {["All", "Red Bar Sushi", "Best Thai Kitchen"].map((tab) => (
              <button
                key={tab}
                onClick={() => setBaFilter(tab)}
                className={`border-b-2 pb-2 text-sm font-medium transition ${
                  baFilter === tab
                    ? "border-orange-500 text-white"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {[
              { dish: "Wonton Soup", restaurant: "Red Bar Sushi", cuisine: "Thai / Japanese", mode: "Enhanced", before: "/before-after/wonton-before.png", after: "/before-after/wonton-after.webp" },
              { dish: "Tonkotsu Ramen", restaurant: "Red Bar Sushi", cuisine: "Japanese", mode: "Enhanced", before: "/before-after/tonkotsu-ramen-before.png", after: "/before-after/tonkotsu-ramen-after.webp" },
              { dish: "Ka Praw", restaurant: "Best Thai Kitchen", cuisine: "Thai", mode: "Enhanced", before: "/before-after/ka-praw-before.png", after: "/before-after/ka-praw-after-v2.webp" },
              { dish: "Miso Soup", restaurant: "Red Bar Sushi", cuisine: "Japanese", mode: "Lifestyle Scene", before: "/before-after/miso-soup-before.png", after: "/before-after/miso-soup-lifestyle-after.webp" },
              { dish: "Salmon Carpaccio", restaurant: "Red Bar Sushi", cuisine: "Japanese", mode: "Michelin", before: "/before-after/salmon-carpaccio-before.png", after: "/before-after/salmon-carpaccio-after.webp" },
              { dish: "Gyoza Soup", restaurant: "Red Bar Sushi", cuisine: "Japanese", mode: "Enhanced", before: "/before-after/gyoza-soup-before.png", after: "/before-after/gyoza-soup-after-v2.webp" },
            ]
              .filter((p) => baFilter === "All" || p.restaurant === baFilter)
              .map((pair) => (
                <div key={pair.dish} className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
                  <div className="relative grid grid-cols-2">
                    <div className="overflow-hidden">
                      <img src={pair.before} alt={`${pair.dish} — Before`} className="h-full w-full object-cover" />
                    </div>
                    <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-950 px-2 py-0.5 text-xs font-bold text-zinc-400 ring-2 ring-zinc-700">VS</div>
                    <div className="group overflow-hidden">
                      <img src={pair.after} alt={`${pair.dish} — After`} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{pair.dish}</p>
                      <p className="text-xs text-zinc-400">{pair.restaurant}</p>
                    </div>
                    <span className="rounded-full bg-orange-500/20 px-2.5 py-0.5 text-xs font-semibold text-orange-400">{pair.mode}</span>
                  </div>
                </div>
              ))}
          </div>

          <div className="mt-12 text-center">
            <button onClick={() => setShowForm(true)} className="rounded-full bg-orange-500 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-orange-600">Enhance My Photos →</button>
          </div>
        </div>
      </section>

      {/* CONTENT LIFECYCLE */}
      <section className="px-6 py-24">
        <style jsx>{`
          @keyframes arrowPulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 1; }
          }
        `}</style>
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-white md:text-4xl">From one photo to a full content library</h2>
          <p className="mt-4 text-center text-zinc-400">Every dish you generate becomes a complete content asset — ready for your menu, your social, and your ads.</p>

          <div className="mt-16 grid gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] md:items-center">
            {/* Step 1 — Photo */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
              <div className="mb-3 text-2xl">📸</div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Menu &amp; Delivery</p>
              <h3 className="mt-1 text-base font-semibold text-white">The Photo</h3>
              <div className="mt-3 overflow-hidden rounded-lg">
                <img src="/images/wagyu-ribeye-1.webp" alt="Menu photo" className="h-32 w-full object-cover" />
              </div>
              <p className="mt-3 text-xs text-zinc-400">Enhanced or AI-generated. DoorDash, UberEats, website.</p>
              <span className="mt-3 inline-block rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-400">Starter · $49/mo</span>
            </div>

            {/* Arrow 1 */}
            <div className="hidden text-2xl text-orange-500 md:block" style={{ animation: "arrowPulse 2s ease-in-out infinite" }}>→</div>

            {/* Step 2 — Hero Video */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
              <div className="mb-3 text-2xl">🎬</div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Website &amp; Reels</p>
              <h3 className="mt-1 text-base font-semibold text-white">The Hero Video</h3>
              <div className="mt-3 overflow-hidden rounded-lg">
                <video src="/videos/pork-ribs-on-grill.mp4" autoPlay muted loop playsInline className="h-32 w-full object-cover" />
              </div>
              <p className="mt-3 text-xs text-zinc-400">Your best photo, animated. Steam, motion, drama.</p>
              <span className="mt-3 inline-block rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-400">Pro · $99/mo</span>
            </div>

            {/* Arrow 2 */}
            <div className="hidden text-2xl text-orange-500 md:block" style={{ animation: "arrowPulse 2s ease-in-out infinite 0.5s" }}>→</div>

            {/* Step 3 — Social Clips */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
              <div className="mb-3 text-2xl">📱</div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">TikTok · Instagram · Stories</p>
              <h3 className="mt-1 text-base font-semibold text-white">Social Clips</h3>
              <div className="mt-3 flex justify-center gap-2">
                {[
                  { label: "TikTok 15s", h: "h-20" },
                  { label: "Reel 30s", h: "h-20" },
                  { label: "Story 9:16", h: "h-20" },
                ].map((f) => (
                  <div key={f.label} className={`${f.h} flex w-12 flex-col items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-orange-500"><path d="M8 5v14l11-7z"/></svg>
                    <span className="mt-1 text-[8px] text-zinc-500">{f.label}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-zinc-400">Platform-optimized cuts. Vertical. Ready to post.</p>
              <span className="mt-3 inline-block rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-400">Pro · $99/mo</span>
            </div>

            {/* Arrow 3 */}
            <div className="hidden text-2xl text-orange-500 md:block" style={{ animation: "arrowPulse 2s ease-in-out infinite 1s" }}>→</div>

            {/* Step 4 — Ad Creative */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
              <div className="mb-3 text-2xl">📺</div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Facebook · Google · YouTube</p>
              <h3 className="mt-1 text-base font-semibold text-white">Ad Creative</h3>
              <div className="mt-3 flex justify-center gap-2">
                <div className="flex h-12 w-20 items-center justify-center rounded border border-zinc-700 bg-zinc-800 text-[8px] text-zinc-500">YouTube Pre-roll</div>
                <div className="flex h-14 w-14 items-center justify-center rounded border border-zinc-700 bg-zinc-800 text-[8px] text-zinc-500">Facebook Ad</div>
                <div className="flex h-16 w-10 items-center justify-center rounded border border-zinc-700 bg-zinc-800 text-[8px] text-zinc-500">Google Display</div>
              </div>
              <p className="mt-3 text-xs text-zinc-400">Ad-ready assets with copy. Just set your budget and launch.</p>
              <span className="mt-3 inline-block rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-400">Studio · $199/mo</span>
            </div>
          </div>

          <div className="mt-16 text-center">
            <p className="mb-6 text-lg text-zinc-400">Start with a photo. We&apos;ll handle the rest.</p>
            <button onClick={() => setShowForm(true)} className="rounded-full bg-orange-500 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-orange-600">Generate My First Photo →</button>
          </div>
        </div>
      </section>

      {/* TEXT US A PHOTO */}
      <section className="bg-zinc-900 px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-center">
            <div className="mb-4 text-4xl">📱</div>
            <p className="text-sm font-semibold uppercase tracking-wider text-orange-500">Try it right now — no signup needed</p>
            <p className="mt-4 text-2xl font-bold text-white md:text-3xl">(833) 324-7207</p>
            <p className="mt-4 text-zinc-400">Text a photo of any dish to the number above. We&apos;ll send back an enhanced version in under 3 minutes. Free.</p>
          </div>
        </div>
      </section>

      {/* SMS CTA */}
      <section className="bg-zinc-950 px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 text-5xl">📱</div>
          <h2 className="mb-3 text-3xl font-bold text-white md:text-4xl">Try it right now — no signup needed</h2>
          <p className="mb-8 text-lg text-zinc-400">Text any food photo to our number. We&apos;ll send back an AI-enhanced version in under 3 minutes. Free.</p>
          <a href="sms:+18333247207" className="inline-block rounded-xl bg-orange-500 px-10 py-5 text-2xl font-bold text-white shadow-lg transition hover:bg-orange-400">
            Text (833) 324-7207
          </a>
          <p className="mt-4 text-sm text-zinc-500">Works on iPhone &amp; Android · No app · No account · Just text a photo</p>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="bg-zinc-900 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-white md:text-4xl">Pricing</h2>
          <p className="mt-4 text-center text-zinc-400">No contracts. Cancel anytime. First 5 photos free.</p>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8">
              <h3 className="text-lg font-semibold text-white">Starter</h3>
              <div className="mt-4"><span className="text-4xl font-bold text-white">$49</span><span className="text-zinc-400">/mo</span></div>
              <ul className="mt-8 space-y-3 text-sm text-zinc-400">
                <li className="flex items-start gap-2"><span className="mt-0.5 text-orange-500">✓</span> 10 dish photos/mo</li>
                <li className="flex items-start gap-2"><span className="mt-0.5 text-orange-500">✓</span> Delivery platform exports (DD + UE)</li>
                <li className="flex items-start gap-2"><span className="mt-0.5 text-orange-500">✓</span> Website integration</li>
                <li className="flex items-start gap-2"><span className="mt-0.5 text-orange-500">✓</span> Email support</li>
              </ul>
              <button onClick={() => handlePricingClick("starter")} className="mt-8 block w-full rounded-full border border-zinc-700 py-3 text-center text-sm font-semibold text-white transition hover:border-zinc-500">Get Started</button>
            </div>
            <div className="relative rounded-2xl border-2 border-orange-500 bg-zinc-950 p-8">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-orange-500 px-4 py-1 text-xs font-semibold text-white">Most Popular</div>
              <h3 className="text-lg font-semibold text-white">Pro</h3>
              <div className="mt-4"><span className="text-4xl font-bold text-white">$99</span><span className="text-zinc-400">/mo</span></div>
              <ul className="mt-8 space-y-3 text-sm text-zinc-400">
                <li className="flex items-start gap-2"><span className="mt-0.5 text-orange-500">✓</span> 30 dish photos/mo</li>
                <li className="flex items-start gap-2"><span className="mt-0.5 text-orange-500">✓</span> 1 hero video/mo</li>
                <li className="flex items-start gap-2"><span className="mt-0.5 text-orange-500">✓</span> Social pack (4 posts/wk)</li>
                <li className="flex items-start gap-2"><span className="mt-0.5 text-orange-500">✓</span> All platform exports</li>
                <li className="flex items-start gap-2"><span className="mt-0.5 text-orange-500">✓</span> Priority support</li>
              </ul>
              <button onClick={() => handlePricingClick("pro")} className="mt-8 block w-full rounded-full bg-orange-500 py-3 text-center text-sm font-semibold text-white transition hover:bg-orange-600">Get Started</button>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8">
              <h3 className="text-lg font-semibold text-white">Studio</h3>
              <div className="mt-4"><span className="text-4xl font-bold text-white">$199</span><span className="text-zinc-400">/mo</span></div>
              <ul className="mt-8 space-y-3 text-sm text-zinc-400">
                <li className="flex items-start gap-2"><span className="mt-0.5 text-orange-500">✓</span> Unlimited photos</li>
                <li className="flex items-start gap-2"><span className="mt-0.5 text-orange-500">✓</span> 4 hero videos/mo</li>
                <li className="flex items-start gap-2"><span className="mt-0.5 text-orange-500">✓</span> Full social management</li>
                <li className="flex items-start gap-2"><span className="mt-0.5 text-orange-500">✓</span> AI phone concierge included</li>
                <li className="flex items-start gap-2"><span className="mt-0.5 text-orange-500">✓</span> Dedicated account manager</li>
              </ul>
              <button onClick={() => handlePricingClick("studio")} className="mt-8 block w-full rounded-full border border-zinc-700 py-3 text-center text-sm font-semibold text-white transition hover:border-zinc-500">Get Started</button>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-white md:text-4xl">What Restaurants Say</h2>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <p className="text-sm leading-relaxed text-zinc-300">&ldquo;We used to pay $2,000 for a quarterly photoshoot. PlateAI generates better photos in 2 minutes for less than our monthly coffee budget.&rdquo;</p>
              <div className="mt-6"><p className="text-sm font-semibold text-white">Maria T.</p><p className="text-xs text-zinc-500">Owner, Coastal Kitchen</p></div>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <p className="text-sm leading-relaxed text-zinc-300">&ldquo;Our DoorDash orders went up 34% after we replaced our phone photos with PlateAI images. The platform-optimized exports made all the difference.&rdquo;</p>
              <div className="mt-6"><p className="text-sm font-semibold text-white">James R.</p><p className="text-xs text-zinc-500">GM, The Urban Table</p></div>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <p className="text-sm leading-relaxed text-zinc-300">&ldquo;The hero video alone was worth it. We sent it to our landlord and they gave us 6 months free rent on our new location.&rdquo;</p>
              <div className="mt-6"><p className="text-sm font-semibold text-white">Neil M.</p><p className="text-xs text-zinc-500">Founder, Ember &amp; Azure</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="bg-orange-500 px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-white md:text-4xl">Your first 5 photos are free.</h2>
          <p className="mt-4 text-lg text-orange-100">No credit card required. See what your menu could look like.</p>
          <button onClick={() => setShowForm(true)} className="mt-10 inline-block rounded-full bg-white px-10 py-4 text-base font-semibold text-orange-500 transition hover:bg-zinc-100">Generate My First Photo →</button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-800 bg-zinc-950 px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div>
              <a href="#" className="text-xl font-bold"><span className="text-white">Plate</span><span className="text-orange-500">AI</span></a>
              <p className="mt-1 text-sm text-zinc-500">Restaurant-quality food photos and video. No photographer required.</p>
            </div>
            <div className="flex gap-6 text-sm text-zinc-500">
              <a href="#" className="transition hover:text-zinc-300">Privacy</a>
              <a href="#" className="transition hover:text-zinc-300">Terms</a>
              <a href="#" className="transition hover:text-zinc-300">Contact</a>
            </div>
          </div>
          <p className="mt-8 text-center text-xs text-zinc-600">© 2026 PlateAI. Built for restaurants that give a damn.</p>
        </div>
      </footer>
    </div>
  );
}
