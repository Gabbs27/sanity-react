import AnimatedSection from "./common/AnimatedSection";
import SEO from "./common/SEO";
import usePageTracking from "../hooks/useAnalytics";

const LAST_UPDATED = "2026-04-29";

const Terms = () => {
  usePageTracking();

  return (
    <>
      <SEO
        title="Terms of Service"
        description="Terms governing use of codewithgabo.com — content licensing, affiliate disclosure, third-party services, liability, and changes."
        keywords="terms of service, terms of use, codewithgabo, content license, affiliate disclosure"
        url="https://codewithgabo.com/terms"
      />
      <main className="min-h-screen p-6 md:p-12">
        <article className="max-w-3xl mx-auto">
          <AnimatedSection variant="fadeInUp" duration={0.6}>
            <header className="mb-8">
              <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
              <p className="opacity-70">Last updated: {LAST_UPDATED}</p>
            </header>

            <section className="space-y-4 mb-8">
              <p>
                These terms govern your use of <strong>codewithgabo.com</strong>{" "}
                (the &quot;site&quot;), operated by Gabriel Abreu in Santo Domingo,
                Dominican Republic. By visiting the site, you agree to these terms.
                If you don&apos;t, please don&apos;t use the site. Contact:{" "}
                <a className="underline" href="mailto:fco.g.abreu@gmail.com">
                  fco.g.abreu@gmail.com
                </a>
                .
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-3">Content & licensing</h2>
              <p>
                Blog posts, code snippets, and demo applications on this site are
                released for personal learning and reference. You may quote short
                excerpts with attribution and a link back. Substantial reproduction,
                translation, or commercial reuse requires written permission.
              </p>
              <p className="mt-3">
                Code samples embedded in posts may be used freely under the
                MIT License unless a snippet states otherwise.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-3">Affiliate disclosure</h2>
              <p>
                Some links on this site (typically to product pages on Amazon and
                similar partners) are affiliate links. If you click and purchase, the
                site may earn a small commission at <strong>no extra cost to you</strong>.
                Posts containing affiliate links carry a banner disclosing this. The
                affiliate relationship does not influence editorial content —
                recommendations reflect what the author actually uses.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-3">Advertising</h2>
              <p>
                The site may serve ads via <strong>Google AdSense</strong>. Ad
                content is selected by Google and is not endorsed by the site.
                European, UK, and Swiss visitors see a Google CMP consent banner;
                see the{" "}
                <a className="underline" href="/privacy">Privacy Policy</a> for cookie
                details and consent controls.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-3">Newsletter</h2>
              <p>
                The newsletter is delivered via MailerLite with double opt-in. You
                can unsubscribe at any time using the link in every email. Subscribing
                does not create any other obligation.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-3">Third-party links</h2>
              <p>
                External links (to GitHub, partner stores, documentation, etc.) lead
                to sites this site does not control. Their terms and privacy practices
                are their own. Clicking through is at your discretion.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-3">No professional advice</h2>
              <p>
                Posts are educational and reflect the author&apos;s opinion at the
                time of writing. They are <strong>not</strong> legal, financial, or
                professional advice. Verify against authoritative sources before
                acting on any information here, especially in production systems.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-3">Liability</h2>
              <p>
                The site is provided &quot;as is&quot; without warranty. To the
                maximum extent permitted by law, the operator is not liable for any
                damages arising from your use of the content, code samples, demos, or
                any third-party services linked from the site.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-3">Changes</h2>
              <p>
                These terms may change. Material updates are dated above. Continuing
                to use the site after a change means you accept the updated terms.
              </p>
            </section>

            <section className="mb-8 opacity-70 text-sm">
              <h2 className="text-lg font-semibold mb-2">Resumen en español</h2>
              <p>
                Al usar codewithgabo.com aceptas estos términos. El contenido es
                educativo (no es asesoría legal/financiera/profesional), los enlaces
                de afiliado están claramente identificados, y la responsabilidad por
                el uso del código y los demos es del usuario. Para cualquier consulta:{" "}
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

export default Terms;
