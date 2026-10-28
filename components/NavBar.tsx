import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import ShareButton from "@/components/ShareButton";
import { SITE_NAME } from "@/lib/site";

export default async function NavBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <nav className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <Image src="/logo.png" alt="" width={28} height={28} className="rounded-md" priority />
          {SITE_NAME}
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/stats" className="hover:underline">
            Stats
          </Link>
          <Link href="/more-rounds" className="hover:underline">
            More rounds
          </Link>
          <Link href="/help" className="hover:underline">
            Help
          </Link>
          <ShareButton
            title={SITE_NAME}
            text={`Check out ${SITE_NAME} — a daily AFL crossword with an easy, a medium and a hard player to guess.`}
            url="/"
            className="hover:underline"
          >
            Share
          </ShareButton>
          {user && (
            <>
              <span className="text-zinc-500">{user.email}</span>
              <form action="/auth/sign-out" method="post">
                <button type="submit" className="hover:underline">
                  Sign out
                </button>
              </form>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
