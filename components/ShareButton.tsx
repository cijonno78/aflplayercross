"use client";

import { useState } from "react";

export default function ShareButton({
  title,
  text,
  url,
  className,
  children,
}: {
  title: string;
  text: string;
  url: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleShare() {
    const resolvedUrl = url.startsWith("/") ? new URL(url, window.location.origin).toString() : url;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: resolvedUrl });
      } catch (err) {
        // AbortError just means the user closed the share sheet -- not an error.
        if (err instanceof Error && err.name !== "AbortError") {
          console.error("Share failed", err);
        }
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(`${text} ${resolvedUrl}`);
      setFeedback("Copied to clipboard!");
    } catch {
      setFeedback("Couldn't copy — copy the link manually.");
    }
    setTimeout(() => setFeedback(null), 2500);
  }

  return (
    <span className="relative inline-flex">
      <button type="button" onClick={handleShare} className={className}>
        {children}
      </button>
      {feedback && (
        <span className="absolute top-full left-1/2 mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-zinc-900 px-2 py-1 text-xs text-white dark:bg-zinc-100 dark:text-zinc-900">
          {feedback}
        </span>
      )}
    </span>
  );
}
