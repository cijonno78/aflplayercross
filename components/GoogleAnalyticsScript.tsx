/**
 * Google Analytics (GA4) tag -- a no-op until NEXT_PUBLIC_GA_MEASUREMENT_ID
 * is set. Respects Consent Mode: the default-denied state set in
 * app/layout.tsx runs before this, so no analytics cookie is set and no
 * identifying data is sent until the visitor accepts via the Funding
 * Choices banner (which calls gtag('consent', 'update', ...) itself --
 * nothing to wire up here).
 *
 * Uses plain native <script> tags rather than next/script -- see the note
 * in app/layout.tsx: next/script (any strategy) only leaves a
 * <link rel="preload"> hint in the server-rendered HTML in this Next.js
 * version, invisible to non-JS crawlers. That's exactly what caused
 * Google's own tag-health checker to flag this site as "might not be
 * tagged correctly" before this fix.
 *
 * Setup: Google Analytics -> Admin -> Data Streams -> your web stream ->
 * Measurement ID (looks like G-XXXXXXXXXX) into NEXT_PUBLIC_GA_MEASUREMENT_ID.
 */
export default function GoogleAnalyticsScript() {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!gaId) return null;

  return (
    <>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
      <script
        id="ga-init"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}');
          `,
        }}
      />
    </>
  );
}
