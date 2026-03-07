"use client";

import { UserProfile } from "@clerk/nextjs";

export default function SettingsPage() {
  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold text-white md:text-3xl">
        Settings
      </h1>
      <UserProfile />
    </div>
  );
}
