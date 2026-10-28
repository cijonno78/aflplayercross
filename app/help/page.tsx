import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

export default function HelpPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">How to play</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Every round has exactly three AFL players — one easy (200+ games), one medium (100–199
          games) and one hard (50–99 games) — interlinked in a small crossword grid. Each answer is
          the player&apos;s first name and surname.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <Step n={1} title="Read the clues">
          Each clue lists the clubs the player played for, in order, and their total AFL games.
          It also shows the name&apos;s word-length pattern in brackets, like{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 text-sm dark:bg-zinc-800">(5,5)</code>{" "}
          for a first name and surname of five letters each.
        </Step>
        <Step n={2} title="Fill in the grid">
          Click a clue to jump to its first empty square, then type letters — they fill in
          left-to-right or top-to-bottom depending on the word&apos;s direction. Squares shared
          between two answers only need to be filled once.
        </Step>
        <Step n={3} title="Check your answers">
          Once every square is filled, press <strong>Check answers</strong>. Incorrect squares
          are highlighted so you can fix them — there&apos;s no limit on attempts.
        </Step>
        <Step n={4} title="Play daily or practice anytime">
          There&apos;s one new daily round each day, plus a practice pool you can play whenever
          you like. Your streak only counts daily rounds.
        </Step>
      </section>

      <section>
        <h2 className="text-lg font-medium">Your stats</h2>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          {SITE_NAME} doesn&apos;t use accounts. Your streak and history are saved only in this
          browser, on this device — nothing is sent anywhere.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-medium">Contact</h2>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Spotted a bad clue or a bug? Email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </section>
    </main>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-900 dark:bg-blue-900 dark:text-blue-100">
        {n}
      </span>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{children}</p>
      </div>
    </div>
  );
}
