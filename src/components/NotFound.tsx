import { Link } from "react-router-dom";
import AnimatedSection from "./common/AnimatedSection";
import SEO from "./common/SEO";
import usePageTracking from "../hooks/useAnalytics";

export default function NotFound() {
  usePageTracking();

  return (
    <>
      <SEO
        title="Page Not Found - 404"
        description="The page you're looking for doesn't exist on codewithgabo.com."
        url="https://codewithgabo.com/404"
      />
      <main className="min-h-screen flex items-center justify-center p-12">
        <AnimatedSection variant="fadeInUp" duration={0.6}>
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-6xl font-bold mb-4 opacity-60">404</p>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              Page not found
            </h1>
            <p className="text-lg opacity-75 mb-2">
              Página no encontrada
            </p>
            <p className="opacity-70 mb-8">
              The URL you tried doesn't match any page on this site. Maybe one of these helps:
            </p>
            <nav
              className="flex flex-wrap gap-3 justify-center"
              aria-label="Helpful links"
            >
              <Link
                to="/"
                className="px-6 py-3 rounded-lg font-semibold bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
              >
                ← Back home
              </Link>
              <Link
                to="/allpost"
                className="px-6 py-3 rounded-lg font-semibold border-2 border-current opacity-80 hover:opacity-100 transition-opacity"
              >
                Read latest posts
              </Link>
              <Link
                to="/about"
                className="px-6 py-3 rounded-lg font-semibold border-2 border-current opacity-80 hover:opacity-100 transition-opacity"
              >
                About me
              </Link>
            </nav>
          </div>
        </AnimatedSection>
      </main>
    </>
  );
}
