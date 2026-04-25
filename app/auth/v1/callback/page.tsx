"use client";

import { useEffect } from "react";

export default function LegacyAuthCallbackPage() {
  useEffect(() => {
    const nextUrl = `/auth/callback${window.location.search}${window.location.hash}`;
    window.location.replace(nextUrl);
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-(--accent-blue) border-t-transparent" />
        <p className="text-sm uppercase tracking-[0.26em] text-(--text-secondary)">Completing sign in...</p>
      </div>
    </main>
  );
}
