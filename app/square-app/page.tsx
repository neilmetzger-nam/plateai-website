import Link from "next/link";

export default function SquareAppPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 text-zinc-100">
      <div className="w-full max-w-xl text-center">
        {/* Logo */}
        <div className="mb-8 text-3xl font-bold">
          <span className="text-white">Plate</span>
          <span className="text-orange-500">AI</span>
        </div>

        <h1 className="text-3xl font-bold text-white md:text-4xl">
          Professional food photos for every item in your Square catalog
        </h1>
        <p className="mt-4 text-lg text-zinc-400">
          PlateAI generates professional photos for every item in your Square catalog — and builds you a free SEO-optimized website from your menu automatically. Most restaurants see Google traffic within 2 weeks of publishing.
        </p>

        {/* Features */}
        <div className="mt-12 space-y-4 text-left">
          <div className="flex items-start gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <span className="mt-0.5 text-2xl">📸</span>
            <div>
              <p className="font-semibold text-white">
                One-click menu import
              </p>
              <p className="mt-1 text-sm text-zinc-400">
                Import your entire Square catalog — names, descriptions,
                categories, and prices. No manual entry.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <span className="mt-0.5 text-2xl">✨</span>
            <div>
              <p className="font-semibold text-white">
                AI-generated food photos
              </p>
              <p className="mt-1 text-sm text-zinc-400">
                Professional, studio-quality photos generated from your dish
                descriptions. 5 styles including Enhanced, Michelin, and X-Ray.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <span className="mt-0.5 text-2xl">🔄</span>
            <div>
              <p className="font-semibold text-white">
                Auto-sync back to Square
              </p>
              <p className="mt-1 text-sm text-zinc-400">
                Generated photos sync directly to your Square items. They appear
                in your POS, Square Online, DoorDash, and more.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/api/square/oauth/connect"
          className="mt-10 inline-block rounded-full bg-orange-500 px-8 py-4 text-base font-semibold text-white transition hover:bg-orange-600"
        >
          Connect with Square →
        </Link>

        <p className="mt-4 text-sm text-zinc-500">
          Free to try · No credit card required · Cancel anytime
        </p>

        {/* Footer */}
        <div className="mt-16 border-t border-zinc-800 pt-8">
          <Link href="/" className="text-sm text-zinc-500 transition hover:text-zinc-300">
            ← Back to PlateAI
          </Link>
        </div>
      </div>
    </div>
  );
}
