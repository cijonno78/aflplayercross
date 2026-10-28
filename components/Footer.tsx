import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-200 py-6 dark:border-zinc-800">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-y-2 px-4 text-sm text-zinc-500">
        <span>&copy; {new Date().getFullYear()} {SITE_NAME}</span>
        <nav className="flex flex-wrap gap-x-4 gap-y-1">
          <Link href="/about" className="hover:underline">
            About
          </Link>
          <Link href="/guides" className="hover:underline">
            Guides
          </Link>
          <Link href="/contact" className="hover:underline">
            Contact
          </Link>
          <Link href="/privacy-policy" className="hover:underline">
            Privacy Policy
          </Link>
        </nav>
      </div>
    </footer>
  );
}
