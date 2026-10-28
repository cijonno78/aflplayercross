import { SITE_NAME } from "@/lib/site";

export const metadata = { title: `Privacy Policy — ${SITE_NAME}` };

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-zinc-500">Last updated: {new Date().toLocaleDateString()}</p>
      </section>

      <Section title="Information we collect">
        <p>
          {SITE_NAME} does not require an account to play, and we do not collect or store any
          personal information on our own servers in order to run the game. Your streak and play
          history are saved only in your browser&apos;s local storage, on your own device — we
          never see that data, and it is never sent to us.
        </p>
        <p>
          If advertising or analytics is enabled on this site (see below), Google and its partners
          may collect information via cookies and similar technologies when you visit — for
          example, your IP address, device and browser type, pages viewed, and how long you spend
          on them. We do not control what Google collects; see Google&apos;s own privacy policy
          (linked below) for details.
        </p>
      </Section>

      <Section title="Cookies, advertising, and analytics">
        <p>
          This site uses (or may use) <strong>Google AdSense</strong> to show ads and{" "}
          <strong>Google Analytics</strong> to understand how visitors use the site (e.g. which
          pages are viewed and for how long). Both are Google services that use cookies and similar
          technologies — AdSense to serve and measure ads, Analytics to measure usage.
        </p>
        <p>
          Before any advertising or analytics cookie is set, you&apos;ll be shown a consent banner
          (provided by Google&apos;s consent management platform) where you can accept or reject
          them, or manage your preferences in more detail. No ad or analytics cookies or scripts
          are loaded until you make a choice.
        </p>
        <p>
          You can learn more about how Google uses information from sites that use its services,
          and manage your settings, here:
        </p>
        <ul className="list-inside list-disc">
          <li>
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Google Privacy Policy
            </a>
          </li>
          <li>
            <a
              href="https://policies.google.com/technologies/partner-sites"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              How Google uses information from sites that use its services
            </a>
          </li>
          <li>
            <a
              href="https://adssettings.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Google Ads Settings — opt out of personalized advertising
            </a>
          </li>
          <li>
            <a
              href="https://tools.google.com/dlpage/gaoptout"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Google Analytics Opt-out Browser Add-on
            </a>
          </li>
        </ul>
      </Section>

      <Section title="Your choices">
        <p>
          You can accept, reject, or customize advertising and analytics cookies at any time via
          the consent banner shown on your first visit, or by clearing your browser&apos;s cookies
          to see it again. If you reject personalized ads, you may still see non-personalized or
          contextual ads, or no ads at all, depending on your region. If you reject analytics, no
          analytics cookie is set and no usage data is sent to Google Analytics from your visit.
        </p>
        <p>
          You can also opt out of interest-based advertising more broadly using industry tools such
          as{" "}
          <a
            href="https://www.aboutads.info/choices/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            aboutads.info
          </a>{" "}
          (US) or{" "}
          <a
            href="https://www.youronlinechoices.eu/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            youronlinechoices.eu
          </a>{" "}
          (EU).
        </p>
      </Section>

      <Section title="Legal basis (GDPR)">
        <p>
          For visitors in the UK and European Economic Area, our legal basis for setting any
          advertising or analytics cookie, or processing any related personal data, is your{" "}
          <strong>consent</strong>, obtained via the consent banner described above. You may
          withdraw that consent at any time, which will stop any further personalized advertising
          or analytics tracking based on it.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions about this policy? Email us — see the{" "}
          <a href="/help" className="underline">
            Help page
          </a>{" "}
          for our contact address.
        </p>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-medium">{title}</h2>
      <div className="flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        {children}
      </div>
    </section>
  );
}
