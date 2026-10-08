import { Link } from "react-router-dom";
import AnimatedSection from "./common/AnimatedSection";

/**
 * What OnePost shows when the fetch failed and the page carries no embedded
 * copy of the post to fall back on.
 *
 * Deliberately renders no <SEO>. The head the prerender wrote — the real title,
 * the canonical, "index, follow" — must stay exactly as it is: a request that
 * failed says nothing about whether the post exists, and a page that said
 * otherwise is how a real post got marked a Soft 404. <NotFound /> is for a
 * slug Sanity has confirmed does not exist, and only for that.
 */
export default function PostUnavailable({ onRetry }: { onRetry: () => void }) {
  return (
    <main className="min-h-screen flex items-center justify-center p-12">
      <AnimatedSection variant="fadeInUp" duration={0.6}>
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            We couldn't load this post
          </h1>
          <p className="text-lg opacity-75 mb-2">
            No pudimos cargar este post
          </p>
          <p className="opacity-70 mb-8">
            The connection to the blog's content failed; the post is still here.
            Try again in a moment, or pick something else to read.
            <br />
            Falló la conexión con el contenido del blog; el post sigue ahí.
            Intenta de nuevo en un momento o busca otra cosa que leer.
          </p>
          <nav
            className="flex flex-wrap gap-3 justify-center"
            aria-label="Helpful links"
          >
            <button
              type="button"
              onClick={onRetry}
              className="post-unavailable__retry px-6 py-3 rounded-lg font-semibold bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
            >
              Try again · Intentar de nuevo
            </button>
            <Link
              to="/"
              className="px-6 py-3 rounded-lg font-semibold border-2 border-current opacity-80 hover:opacity-100 transition-opacity"
            >
              ← Back home
            </Link>
            <Link
              to="/allpost"
              className="px-6 py-3 rounded-lg font-semibold border-2 border-current opacity-80 hover:opacity-100 transition-opacity"
            >
              Read latest posts
            </Link>
          </nav>
        </div>
      </AnimatedSection>
    </main>
  );
}
