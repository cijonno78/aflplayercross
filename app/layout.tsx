import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import GoogleAnalyticsScript from "@/components/GoogleAnalyticsScript";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";

// The AdSense tag and Consent Mode default state use plain native <script>
// tags (not next/script) so they're guaranteed to appear as literal
// <script> elements in the server-rendered HTML. Google's AdSense
// site-ownership verification fetches the raw HTML with no JS execution and
// looks for a literal <script src="...adsbygoogle..."> tag in <head> -- in
// this Next.js version, next/script's `Script` component (any strategy)
// only leaves a <link rel="preload"> hint in that raw HTML and inserts the
// real <script> client-side at hydration, which that crawler never sees.
// Verified directly against the built output before relying on this.
// See components/GoogleAnalyticsScript.tsx for the GA tag/setup notes --
// GA doesn't have this same raw-HTML crawler requirement, so it's fine as
// a next/script afterInteractive component. Everything here is a no-op
// until its env var is set.
const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const googleSiteVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
const needsConsentMode = Boolean(adsenseClientId || gaMeasurementId);

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_NAME,
  description: SITE_TAGLINE,
  // Google Search Console ownership (URL-prefix property, HTML tag method).
  // Set NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION to the code Search Console gives you.
  ...(googleSiteVerification && { verification: { google: googleSiteVerification } }),
  // AdSense site-ownership verification: a plain <meta> tag renders
  // literally in the server HTML (unlike <script>, which this Next.js
  // version defers to client-side insertion -- see the note below), so
  // it's the reliable option for Google's non-JS-executing crawler.
  ...(adsenseClientId && { other: { "google-adsense-account": adsenseClientId } }),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {needsConsentMode && (
          // Google Consent Mode default state -- everything denied until the
          // visitor responds to AdSense's own consent banner (auto-injected
          // by the AdSense tag once a Privacy & messaging message is
          // published for this domain), which updates these signals itself.
          // Runs before the AdSense script below because the browser
          // executes this inline script (no src) before it even reaches
          // that line while parsing the HTML top-to-bottom.
          <script
            id="consent-mode-default"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('consent', 'default', {
                  ad_storage: 'denied',
                  ad_user_data: 'denied',
                  ad_personalization: 'denied',
                  analytics_storage: 'denied'
                });
              `,
            }}
          />
        )}
        {adsenseClientId && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
            crossOrigin="anonymous"
          />
        )}
        <GoogleAnalyticsScript />
        <NavBar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
