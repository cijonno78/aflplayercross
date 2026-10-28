import type { Metadata } from "next";
import Link from "next/link";
import ArticlePage from "@/components/ArticlePage";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "AFL club names every solver should know",
  description: `The 18 AFL clubs, when they joined, and the old names behind them. Useful background for reading ${SITE_NAME} clues.`,
};

const clubs = [
  { name: "Adelaide", text: "Joined in 1991 as the first South Australian club in the league." },
  {
    name: "Brisbane Lions",
    text: "Formed in 1997 when the Brisbane Bears (who joined in 1987) merged with Fitzroy. Clues for players from before the merger name the Bears or Fitzroy.",
  },
  { name: "Carlton", text: "One of the league’s founding clubs, based in Melbourne’s inner north." },
  { name: "Collingwood", text: "A founding club of the VFL and one of the best-supported clubs in the country." },
  { name: "Essendon", text: "A founding club, known as the Bombers." },
  { name: "Fremantle", text: "Joined in 1995 as the second Western Australian club." },
  { name: "Geelong", text: "A founding club, based in Geelong rather than Melbourne." },
  { name: "Gold Coast", text: "Joined in 2011." },
  { name: "Greater Western Sydney", text: "Joined in 2012. Clues always use the full name rather than GWS." },
  { name: "Hawthorn", text: "Joined in 1925." },
  { name: "Melbourne", text: "A founding club, known as the Demons." },
  {
    name: "North Melbourne",
    text: "Played as the Kangaroos from 1999 to 2007. Clues use North Melbourne for the whole period.",
  },
  { name: "Port Adelaide", text: "Joined in 1997." },
  { name: "Richmond", text: "Joined in 1908, known as the Tigers." },
  { name: "St Kilda", text: "A founding club, known as the Saints." },
  {
    name: "Sydney",
    text: "South Melbourne moved to Sydney in 1982 and became the Sydney Swans. Clues use Sydney for both.",
  },
  { name: "West Coast", text: "Joined in 1987 as the first Western Australian club." },
  {
    name: "Western Bulldogs",
    text: "Known as Footscray until 1996. Clues use Western Bulldogs for both names.",
  },
];

export default function ClubNamesPage() {
  return (
    <ArticlePage>
      <h1>AFL club names every solver should know</h1>
      <p>
        Every {SITE_NAME} clue lists the clubs a player played for, in the order they played for
        them. When a club has changed its name, the clue uses the current name, so you don’t need
        to remember which era a player came from. Here’s a quick guide to the 18 clubs and the
        names behind them.
      </p>

      {clubs.map((c) => (
        <section key={c.name}>
          <h2>{c.name}</h2>
          <p>{c.text}</p>
        </section>
      ))}

      <h2>Reading a list of clubs</h2>
      <p>
        A long list of clubs usually means a player who was traded or delisted and picked up
        again. Two clubs from the same state often point to a player who moved home. The games
        count and the tier (easy, medium or hard) narrow it down from there. See{" "}
        <Link href="/guides/how-to-solve">how to solve {SITE_NAME} puzzles</Link> for more tips.
      </p>
    </ArticlePage>
  );
}
