/**
 * Site-wide name, address and contact details. Change them here and every
 * page, the sitemap and the share text pick them up.
 */
export const SITE_NAME = "AFL Player Cross";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://aflplayercross.com").replace(/\/$/, "");
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "admin@aflplayercross.com";
export const SITE_TAGLINE = "A daily AFL crossword: three players — easy, medium and hard — interlinked in a small grid.";
