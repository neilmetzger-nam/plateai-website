"use client";

import Link from "next/link";

export default function PhotosPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white md:text-3xl">My Photos</h1>
      <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-12 text-center">
        <p className="text-zinc-500">No photos saved yet.</p>
        <p className="mt-2 text-sm text-zinc-600">
          Generate photos and save them to see them here.
        </p>
        <Link
          href="/generate"
          className="mt-6 inline-block rounded-full bg-orange-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
        >
          Generate your first photo →
        </Link>
      </div>
    </div>
  );
}
