"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function DashboardPage() {
  const [squareConnected, setSquareConnected] = useState<boolean | null>(null);
  const [catalogCount, setCatalogCount] = useState(0);

  useEffect(() => {
    async function checkSquare() {
      try {
        const res = await fetch("/api/square/catalog/list");
        if (res.ok) {
          const data = await res.json();
          setSquareConnected(true);
          setCatalogCount(data.items?.length || 0);
        } else {
          setSquareConnected(false);
        }
      } catch {
        setSquareConnected(false);
      }
    }
    checkSquare();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white md:text-3xl">Dashboard</h1>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {/* Credits widget */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-zinc-400">Free Tier</p>
            <Link
              href="#"
              className="text-xs text-orange-400 transition hover:text-orange-300"
            >
              Upgrade Plan →
            </Link>
          </div>
          <p className="mt-3 text-2xl font-bold text-white">
            10 <span className="text-sm font-normal text-zinc-500">credits remaining / 10 total</span>
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
            <div className="h-full w-full rounded-full bg-orange-500" />
          </div>
        </div>

        {/* Quick generate */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 p-6 md:col-span-2">
          <Link
            href="/generate"
            className="rounded-full bg-orange-500 px-8 py-4 text-lg font-semibold text-white transition hover:bg-orange-600"
          >
            Generate a New Photo →
          </Link>
          <p className="mt-3 text-sm text-zinc-500">10 credits remaining</p>
        </div>
      </div>

      {/* Connect Square card */}
      <div className="mt-8">
        {squareConnected === false && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-start gap-4">
              <span className="text-3xl">📷</span>
              <div className="flex-1">
                <p className="text-lg font-semibold text-white">
                  Connect your Square account
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  Import your full menu and generate photos for every item in one click.
                </p>
              </div>
              <Link
                href="/api/square/oauth/connect"
                className="shrink-0 rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
              >
                Connect Square →
              </Link>
            </div>
          </div>
        )}

        {squareConnected === true && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-center gap-4">
              <span className="text-xl text-green-400">✅</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">
                  Square connected · {catalogCount} items
                </p>
              </div>
              <Link
                href="/dashboard/catalog"
                className="text-sm text-orange-400 transition hover:text-orange-300"
              >
                View Catalog →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Recent generations */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-white">Recent Generations</h2>
        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-12 text-center">
          <p className="text-zinc-500">No photos yet.</p>
          <Link
            href="/generate"
            className="mt-4 inline-block rounded-full bg-orange-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            Generate your first →
          </Link>
        </div>
      </div>
    </div>
  );
}
