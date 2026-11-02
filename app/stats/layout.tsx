import type { Metadata } from "next";

// Personal, device-only stats: nothing for search engines to index.
export const metadata: Metadata = { title: "Your stats — AFL Player Cross", robots: { index: false } };

export default function StatsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
