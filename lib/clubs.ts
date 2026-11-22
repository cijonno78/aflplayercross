/**
 * The clubs that appear in clues, with a short background note. Shared by the
 * club names guide and the /clubs pages.
 */
export interface Club {
  name: string;
  slug: string;
  text: string;
}

const CLUBS: Omit<Club, "slug">[] = [
  { name: "Adelaide", text: "Joined in 1991 as the first South Australian club in the league." },
  {
    name: "Brisbane Lions",
    text: "Formed in 1997 when the Brisbane Bears (who joined in 1987) merged with Fitzroy. Clues for players from before the merger name the Bears or Fitzroy.",
  },
  {
    name: "Brisbane Bears",
    text: "Joined in 1987 and played until 1996, when the club merged with Fitzroy to form the Brisbane Lions.",
  },
  { name: "Carlton", text: "One of the league’s founding clubs, based in Melbourne’s inner north." },
  { name: "Collingwood", text: "A founding club of the VFL and one of the best-supported clubs in the country." },
  { name: "Essendon", text: "A founding club, known as the Bombers." },
  {
    name: "Fitzroy",
    text: "A founding VFL club that played its last season in 1996 before merging with the Brisbane Bears to form the Brisbane Lions.",
  },
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

export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const ALL_CLUBS: Club[] = CLUBS.map((c) => ({ ...c, slug: slugify(c.name) }));

/** The 18 current clubs, for the guide (the Bears and Fitzroy are covered under the Lions). */
export const CURRENT_CLUBS: Club[] = ALL_CLUBS.filter(
  (c) => c.name !== "Brisbane Bears" && c.name !== "Fitzroy",
);

export function clubBySlug(slug: string): Club | undefined {
  return ALL_CLUBS.find((c) => c.slug === slug);
}

export function clubByName(name: string): Club | undefined {
  return ALL_CLUBS.find((c) => c.name === name);
}
