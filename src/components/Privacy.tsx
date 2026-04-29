import AnimatedSection from "./common/AnimatedSection";
import SEO from "./common/SEO";
import usePageTracking from "../hooks/useAnalytics";

const LAST_UPDATED = "2026-04-29";

const Privacy = () => {
  usePageTracking();

  return (
    <>
      <SEO
        title="Privacy Policy"
        description="How codewithgabo.com collects, uses, and protects your information — analytics, advertising, newsletter, cookies, and your rights."
        keywords="privacy policy, cookies, AdSense, GA4, GDPR, FTC, codewithgabo"
        url="https://codewithgabo.com/privacy"
      />
      <main className="min-h-screen p-6 md:p-12">
        <article className="max-w-3xl mx-auto">
          <AnimatedSection variant="fadeInUp" duration={0.6}>
            <header className="mb-8">
              <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
              <p className="opacity-70">Last updated: {LAST_UPDATED}</p>
            </header>

            <section className="space-y-4 mb-8">
              <p>
                This page explains what data <strong>codewithgabo.com</strong> collects,
                how it&apos;s used, and what controls you have. The site is operated by
                Gabriel Abreu (Santo Domingo, Dominican Republic). For any privacy
                request you can email{" "}
                <a className="underline" href="mailto:fco.g.abreu@gmail.com">
                  fco.g.abreu@gmail.com
                </a>
                .
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-3">Data we collect</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Analytics (Google Analytics 4):</strong> aggregated, anonymous
                  page-view counts, session duration, country, browser, and device
                  type. No personally identifying information is collected.
                </li>
                <li>
                  <strong>Advertising (Google AdSense):</strong> when ads are served,
                  Google may set cookies to personalize ads, frequency-cap them, and
                  measure performance. EEA, UK, and Swiss visitors see a Google CMP
                  consent banner with three options (consent, do not consent, manage).
                </li>
                <li>
                  <strong>Newsletter (MailerLite):</strong> only if you submit the
                  signup form — your email address (and optionally name) is stored by
                  MailerLite. You can unsubscribe at any time via the link in every
                  email.
                </li>
                <li>
                  <strong>Affiliate links:</strong> when you click a link to an
                  affiliate partner (e.g. Amazon Associates), the click event
                  (destination domain, anonymous) is recorded in GA4. The partner site
                  uses its own cookies once you arrive there — read their policies.
                </li>
              </ul>
              <p className="mt-3">
                The site does <strong>not</strong> collect: account information, payment
                details, location data beyond country-level GA4 aggregates, or any data
                from minors.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-3">Cookies</h2>
              <p>
                Three categories of cookies may be present:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>
                  <strong>Functional</strong> — theme preference (light/dark) stored
                  locally in your browser. No third-party transmission.
                </li>
                <li>
                  <strong>Analytics</strong> — Google Analytics 4 (`_ga`, `_ga_*`).
                </li>
                <li>
                  <strong>Advertising</strong> — Google AdSense / DoubleClick. Subject
                  to the CMP consent banner where applicable.
                </li>
              </ul>
              <p className="mt-3">
                You can clear cookies in your browser settings or use the CMP banner
                (visible to EEA/UK/Swiss visitors) to update consent at any time.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-3">Data retention</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  Google Analytics: 26 months (the GA4 default), after which records
                  are deleted automatically.
                </li>
                <li>
                  Newsletter subscribers: kept until you unsubscribe; deletion happens
                  on request via email.
                </li>
                <li>
                  AdSense / DoubleClick: governed by Google&apos;s own retention
                  policies.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-3">Third-party services</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Google</strong> — Analytics 4 + AdSense.{" "}
                  <a
                    className="underline"
                    href="https://policies.google.com/privacy"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Google Privacy Policy
                  </a>
                  .
                </li>
                <li>
                  <strong>MailerLite</strong> — newsletter delivery.{" "}
                  <a
                    className="underline"
                    href="https://www.mailerlite.com/legal/privacy-policy"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    MailerLite Privacy Policy
                  </a>
                  .
                </li>
                <li>
                  <strong>Sanity</strong> — content management. No PII stored.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-3">Affiliate disclosure</h2>
              <p>
                Some posts and links on this site are affiliate links — primarily
                Amazon Associates. If you click through and make a purchase, this site
                may earn a small commission at <strong>no extra cost to you</strong>.
                Affiliate links are disclosed in compliance with the U.S. FTC and EU
                Unfair Commercial Practices Directive. Posts containing affiliate
                links carry a banner at the top noting the disclosure.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-3">Your rights</h2>
              <p>
                Under the GDPR (EU/EEA), UK Data Protection Act, and Dominican Law
                172-13, you have the right to:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Access the data we hold about you.</li>
                <li>Request rectification or deletion.</li>
                <li>
                  Object to processing or withdraw consent (e.g. via the CMP for
                  advertising cookies).
                </li>
                <li>
                  Lodge a complaint with your local data protection authority.
                </li>
              </ul>
              <p className="mt-3">
                Email{" "}
                <a className="underline" href="mailto:fco.g.abreu@gmail.com">
                  fco.g.abreu@gmail.com
                </a>{" "}
                for any of the above. We respond within 30 days.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-3">Updates to this policy</h2>
              <p>
                Material changes are dated above. Minor edits (typos, formatting) may
                land without a date bump. For substantive changes, returning newsletter
                subscribers receive notice in the next email.
              </p>
            </section>

            <section className="mb-8 opacity-70 text-sm">
              <h2 className="text-lg font-semibold mb-2">Resumen en español</h2>
              <p>
                Esta página describe qué datos recopila codewithgabo.com (analítica
                anónima de Google Analytics 4, cookies de Google AdSense, y tu correo
                si te suscribes a la newsletter en MailerLite). No se almacena
                información personal sensible. Puedes ejercer tus derechos GDPR
                (acceso, rectificación, eliminación, objeción) escribiendo a{" "}
                <a className="underline" href="mailto:fco.g.abreu@gmail.com">
                  fco.g.abreu@gmail.com
                </a>
                . Última actualización: {LAST_UPDATED}.
              </p>
            </section>
          </AnimatedSection>
        </article>
      </main>
    </>
  );
};

export default Privacy;
