// Shared wrapper for the text-heavy pages (about, contact, guides) so they
// match the Help page's look without a typography plugin.
export default function ArticlePage({ children }: { children: React.ReactNode }) {
  return (
    <main
      className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-10 leading-relaxed text-zinc-700 dark:text-zinc-300
        [&_a]:underline [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-zinc-900 dark:[&_h1]:text-zinc-100
        [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-medium [&_h2]:text-zinc-900 dark:[&_h2]:text-zinc-100
        [&_li]:mt-2 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-inside [&_ul]:list-disc"
    >
      {children}
    </main>
  );
}
