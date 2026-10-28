import type { Metadata } from "next";
import Link from "next/link";
import ArticlePage from "@/components/ArticlePage";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Contact ${SITE_NAME}`,
  description: `How to contact the ${SITE_NAME} team about clues, bugs, ideas or advertising.`,
};

export default function ContactPage() {
  return (
    <ArticlePage>
      <h1>Contact us</h1>

      <p>
        {SITE_NAME} is run by a small independent team. The best way to reach us is by email:
      </p>
      <p className="text-lg">
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
      <p>We read every message and usually reply within a few days.</p>

      <h2>What to include</h2>
      <ul>
        <li>
          <strong>A wrong or unclear clue:</strong> the date of the round (or its link) and which
          clue it was.
        </li>
        <li>
          <strong>A bug:</strong> what happened, and which device and browser you were using.
        </li>
        <li>
          <strong>A games count that looks out of date:</strong> tell us the player and we’ll
          check it against AFL Tables.
        </li>
        <li>
          <strong>Privacy questions:</strong> see our <Link href="/privacy-policy">Privacy
          Policy</Link> first, then email us if your question isn’t answered there.
        </li>
      </ul>

      <p>
        New to the game? Start with the <Link href="/help">Help page</Link> or read{" "}
        <Link href="/about">about {SITE_NAME}</Link>.
      </p>
    </ArticlePage>
  );
}
