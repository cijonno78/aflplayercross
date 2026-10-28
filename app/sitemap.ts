import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import type { Round } from "@/types/database";
import { SITE_URL as BASE_URL } from "@/lib/site";

// Rebuilt hourly so new daily rounds show up without a redeploy.
export const revalidate = 3600;

const STATIC_PAGES = [
  "",
  "/help",
  "/more-rounds",
  "/about",
  "/contact",
  "/guides",
  "/guides/how-to-solve",
  "/guides/club-names",
  "/privacy-policy",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = STATIC_PAGES.map((path) => ({
    url: `${BASE_URL}${path}`,
    changeFrequency: path === "" ? "daily" : "monthly",
  }));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return pages;

  // Plain anon client (no cookies) -- the sitemap is public and shouldn't
  // depend on a visitor's session.
  const supabase = createClient(supabaseUrl, supabaseKey);
  const today = new Date().toISOString().slice(0, 10);
  const { data: rounds } = await supabase
    .from("rounds")
    .select("id, play_date, created_at")
    .eq("status", "published")
    .or(`play_date.is.null,play_date.lte.${today}`)
    .returns<Pick<Round, "id" | "play_date" | "created_at">[]>();

  const roundPages: MetadataRoute.Sitemap = (rounds ?? []).map((round) => ({
    url: `${BASE_URL}/play/${round.id}`,
    lastModified: round.play_date ?? round.created_at,
  }));

  return [...pages, ...roundPages];
}
