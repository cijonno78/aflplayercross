import type { Metadata } from "next";
import Link from "next/link";
import ArticlePage from "@/components/ArticlePage";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `About ${SITE_NAME}`,
  description: `${SITE_NAME} is a free daily AFL crossword: an easy, a medium and a hard player, interlinked in a small grid.`,
};

export default function AboutPage() {
  return (
    <ArticlePage>
      <h1>About {SITE_NAME}</h1>

      <p>
        {SITE_NAME} is a free daily puzzle for footy fans. Every round is a small crossword built
        from three AFL players: one easy, one medium and one hard. Their names cross each other,
        so solving one gives you letters for the others, just like a traditional crossword.
      </p>

      <h2>How a round works</h2>
      <p>
        Each clue lists the clubs a player has played for and their total AFL games. Easy players
        have 200 or more games, medium players 100 to 199, and hard players 50 to 99. The answer is
        the player’s first name and surname, and the numbers in brackets show the length of each,
        so (4,6) means a four-letter first name and a six-letter surname. See
        the <Link href="/help">Help page</Link> for the full rules, and
        our <Link href="/guides/how-to-solve">solving guide</Link> for tips.
      </p>

      <h2>A new round every day</h2>
      <p>
        A new daily round goes live every day. Your streak counts the daily rounds you solve on
        the day. Older rounds are always available on <Link href="/more-rounds">More rounds</Link>,
        so you can catch up on any you missed.
      </p>

      <h2>Where the numbers come from</h2>
      <p>
        Games counts come from AFL Tables and are updated after each season. Old club names are
        shown in their modern form, so Footscray appears as Western Bulldogs and South Melbourne as
        Sydney.
      </p>

      <h2>Your data</h2>
      <p>
        You don’t need an account. Your streak and stats stay in your own browser. {SITE_NAME} is
        supported by advertising, and our <Link href="/privacy-policy">Privacy Policy</Link> explains
        how ads and cookies work on this site.
      </p>

      <h2>Get in touch</h2>
      <p>
        Spotted a wrong clue or have an idea? We’d love to hear from you. Visit
        the <Link href="/contact">Contact page</Link>.
      </p>
    </ArticlePage>
  );
}
