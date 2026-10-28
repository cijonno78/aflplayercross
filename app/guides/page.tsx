import type { Metadata } from "next";
import Link from "next/link";
import ArticlePage from "@/components/ArticlePage";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `${SITE_NAME} guides`,
  description: `Tips, strategy and footy knowledge to help you solve ${SITE_NAME} puzzles.`,
};

const guides = [
  {
    href: "/guides/how-to-solve",
    title: `How to solve ${SITE_NAME} puzzles`,
    blurb: "Read the clubs and games, use the crossing letters, and know when to take a hint.",
  },
  {
    href: "/guides/club-names",
    title: "AFL club names every solver should know",
    blurb: "The 18 clubs, when they joined, and the old names behind them.",
  },
];

export default function GuidesPage() {
  return (
    <ArticlePage>
      <h1>Guides</h1>
      <p>Get better at {SITE_NAME} and learn a little more about the game along the way.</p>
      <ul className="list-none!">
        {guides.map((g) => (
          <li key={g.href} className="mt-4! rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <h2 className="mt-0!">
              <Link href={g.href}>{g.title}</Link>
            </h2>
            <p className="mt-1! text-sm">{g.blurb}</p>
          </li>
        ))}
      </ul>
    </ArticlePage>
  );
}
