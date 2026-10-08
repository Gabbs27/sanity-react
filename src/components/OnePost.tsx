import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import sanityClient, { urlFor, sizedImage, socialImage } from "../client";
import { PortableText } from "@portabletext/react";
import AnimatedSection from "./common/AnimatedSection";
import SEO from "./common/SEO";
import LoadingSpinner from "./common/LoadingSpinner";
import NewsletterSignup from "./Newsletter/NewsletterSignup";
import AdSlot from "./Ads/AdSlot";
import { AD_SLOTS } from "../config/adsense";
import { alternatesForSlug, langForSlug, translationOf } from "../config/translations";
import NotFound from "./NotFound";
import PostUnavailable from "./PostUnavailable";
import { readEmbeddedPost } from "../lib/embeddedPost";
import "./OnePost.css";
import usePageTracking from "../hooks/useAnalytics";

import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import { nightOwl } from "react-syntax-highlighter/dist/esm/styles/hljs";
interface RelatedPost {
  title: string;
  slug: { current: string };
  tags?: string[];
  mainImage?: { asset: { url: string } };
}

interface SanityPostData {
  title: string;
  slug: { current: string };
  mainImage?: { asset: { _id: string; url: string } };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any;
  excerpt?: string;
  name?: string;
  publishedAt: string;
  sponsored?: boolean;
  affiliateDisclosure?: boolean;
}

// Flattens a Portable Text body to plain text, for posts published before the
// excerpt field was wired up (the API silently dropped it until 91b485d).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPlainText(blocks: any): string {
  if (!Array.isArray(blocks)) return "";
  return blocks
    .filter((b) => b?._type === "block" && Array.isArray(b.children))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((b: any) => b.children.map((c: any) => c?.text ?? "").join(""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

// PortableText custom components — type assertions needed for block-level overrides
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const portableTextComponents: any = {
  types: {
    // Images may arrive in two shapes: with `asset` (uploaded via Sanity asset
    // pipeline) or with a raw `url` (uploaded via the BlockNote editor, which
    // stores the upload-endpoint URL directly — see blocksToPortable).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    image: ({ value }: { value: any }) => {
      const src = value?.asset
        ? urlFor(value).width(1600).fit("max").auto("format").url()
        : value?.url;
      if (!src) return null;
      return (
        <figure className='post-figure'>
          <img
            src={src}
            alt={value.alt || ""}
            loading='lazy'
            className='post-inline-image'
          />
          {value.caption && (
            <figcaption className='post-figcaption'>{value.caption}</figcaption>
          )}
        </figure>
      );
    },
  },
  block: {
    // For style: 'code' blocks, PortableText passes `children` as RENDERED
    // React nodes (spans), not strings — calling .join('') on those produces
    // "[object Object][object Object]..." garbage. Pull the raw text from
    // `value.children` (the underlying portable-text block) instead.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    code: ({ value }: { value: any }) => {
      const codeString = Array.isArray(value?.children)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? value.children.map((c: any) => (typeof c?.text === "string" ? c.text : "")).join("")
        : "";
      return (
        <SyntaxHighlighter
          style={{ ...nightOwl }}
          wrapLines={true}
          className='syntax-highlight'>
          {codeString}
        </SyntaxHighlighter>
      );
    },
  },
};

// What the page knows about the post. "missing" is the only state that renders
// <NotFound />, and only Sanity's empty answer reaches it: a request that
// failed says nothing about whether the post exists, and treating the two
// alike is how a real post got marked a Soft 404 (the story is in
// scripts/prerender.mjs). "failed" is reachable only when the page carries no
// embedded copy to fall back on; with one, a failed fetch leaves the article
// standing.
type Status = "loading" | "ready" | "missing" | "failed";

const OnePost = () => {
  usePageTracking();
  const { slug } = useParams();
  // The prerender bakes the post into build/<slug>/index.html, so the first
  // render can be the article, before any request has left the browser.
  const [postData, setPostData] = useState<SanityPostData | null>(() =>
    readEmbeddedPost<SanityPostData>(slug)
  );
  const [status, setStatus] = useState<Status>(() => (postData ? "ready" : "loading"));
  // Bumped by the Retry control; re-runs the fetch below.
  const [attempt, setAttempt] = useState(0);
  const [related, setRelated] = useState<RelatedPost[]>([]);

  // /:slug renders one <OnePost /> with no key (see useAnalytics.ts), so moving
  // between posts reuses this instance. Reset for the new slug here, during
  // render, rather than in the effect: React re-renders at once with the new
  // state, and the previous post is never painted under the new URL. The
  // related list resets with it: an embedded copy paints the new post at
  // once, and for the time its own related query takes, the three cards
  // under it would otherwise be the previous post's, which can include the
  // very post being read.
  const [shownSlug, setShownSlug] = useState(slug);
  if (slug !== shownSlug) {
    const embedded = readEmbeddedPost<SanityPostData>(slug);
    setShownSlug(slug);
    setPostData(embedded);
    setStatus(embedded ? "ready" : "loading");
    setRelated([]);
  }

  useEffect(() => {
    // A slug change while a fetch is in flight: the late answer belongs to the
    // previous post and must not land on this one.
    let cancelled = false;
    const embedded = readEmbeddedPost<SanityPostData>(slug);

    sanityClient
      .fetch(
        `*[slug.current == $slug]{
          title,
          slug,
          mainImage{
            asset->{
              _id,
              url
            }
          },
          body,
          excerpt,
          "name": author->name,
          publishedAt,
          sponsored,
          affiliateDisclosure
        }`,
        { slug }
      )
      .then((data: SanityPostData[]) => {
        if (cancelled) return;
        if (!data || data.length === 0) {
          // Sanity answered and the post is not there: the one way to a 404.
          setPostData(null);
          setStatus("missing");
        } else {
          setPostData(data[0]);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (cancelled) return;
        // No answer. With an embedded copy the article stays up; without one,
        // say so and leave the head alone, because nothing is known about
        // the post either way.
        if (!embedded) setStatus("failed");
      });

    return () => {
      cancelled = true;
    };
  }, [slug, attempt]);

  // Every post links to three others. Without this the only path between posts
  // was /allpost, so a reader who finished an article had nowhere to go — and
  // crawlers had no route between them either.
  //
  // This used to be `order(publishedAt desc)[0...3]`, which is a "newest" list
  // wearing the word "related": every post on the site showed the same three
  // cards. Publishing the English translations made the flaw visible, because
  // the two newest posts were English and every Spanish post started
  // recommending them.
  //
  // Only five of sixteen posts carry tags, so tags alone cannot rank the list.
  // Language is the hard constraint, shared tags break the tie, recency breaks
  // what is left. A post's own translation is excluded outright: offering the
  // article you are already reading, in a language you did not pick, is not a
  // next thing to read — that is what the hreflang tags are for.
  useEffect(() => {
    if (!slug) return;
    const myLang = langForSlug(slug);
    sanityClient
      .fetch(
        `{
          "mine": *[_type == "post" && slug.current == $slug][0]{"tags": coalesce(tags, [])},
          "pool": *[_type == "post" && slug.current != $slug
                    && slug.current != $pair && defined(slug.current)]
            | order(publishedAt desc)[0...20]{
              title,
              slug,
              "tags": coalesce(tags, []),
              mainImage{asset->{url}}
            }
        }`,
        { slug, pair: translationOf(slug) ?? "" }
      )
      .then(({ mine, pool }: { mine?: { tags: string[] }; pool: RelatedPost[] }) => {
        const myTags = new Set((mine?.tags ?? []).map((t) => t.toLowerCase()));
        const ranked = (pool ?? [])
          .map((post, index) => {
            const shared = (post.tags ?? []).filter((t) =>
              myTags.has(t.toLowerCase())
            ).length;
            const sameLang = langForSlug(post.slug?.current) === myLang;
            // Language dominates, then tag overlap; `index` preserves the
            // newest-first order the query already applied.
            return { post, score: (sameLang ? 100 : 0) + shared * 10, index };
          })
          .sort((a, b) => b.score - a.score || a.index - b.index)
          .slice(0, 3)
          .map((r) => r.post);
        setRelated(ranked);
      })
      .catch(() => setRelated([]));
  }, [slug]);

  if (status === "missing") return <NotFound />;
  if (status === "failed") {
    return (
      <PostUnavailable
        onRetry={() => {
          setStatus("loading");
          setAttempt((n) => n + 1);
        }}
      />
    );
  }
  if (status !== "ready" || !postData) {
    return <LoadingSpinner message="Loading post..." />;
  }

  return (
    <>
      <SEO
        title={postData.title}
        // The excerpt, not the title: a description that merely repeats the
        // title tells a search result nothing. Falls back to the opening of the
        // body for the older posts that have no excerpt.
        description={
          postData.excerpt?.trim() ||
          `${toPlainText(postData.body).slice(0, 155).trimEnd()}…`
        }
        keywords="blog post, article, tutorial, web development"
        url={`https://codewithgabo.com/${slug}`}
        image={socialImage(postData.mainImage?.asset?.url)}
        type="article"
        lang={langForSlug(slug)}
        alternates={alternatesForSlug(slug)}
      />
      <AnimatedSection variant="fadeInUp" duration={0.6}>
        <article className='single-post'>
          <header className='post-header'>
            {postData.mainImage && (
              <img
                src={sizedImage(postData.mainImage.asset.url, 1600)}
                alt={postData.title}
                className='post-main-image'
              />
            )}
            <div className='post-header-content'>
              {postData.sponsored && (
                <span className='post-badge post-badge--sponsored' aria-label='Sponsored content'>
                  Sponsored
                </span>
              )}
              <h1 className='post-title'>{postData.title}</h1>
              <div className='post-meta'>
                {postData.name && (
                  <span className='post-author'>By {postData.name}</span>
                )}
                <time className='post-date' dateTime={postData.publishedAt}>
                  {new Date(postData.publishedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </div>
            </div>
          </header>

          <div className='post-content'>
            {postData.affiliateDisclosure && (
              <aside className='post-disclosure' role='note'>
                <strong>Disclosure:</strong> This post contains affiliate links. If you
                make a purchase through them I may earn a small commission at no
                extra cost to you. It helps keep this blog running — thank you.
              </aside>
            )}
            {/* In-article ad after the first three blocks — three paragraphs
                in, roughly 400px into the body regardless of post length.
                This used to claim "a third of the way through", which the
                fixed slice(0, 3) never did: the shortest post has 28 blocks
                and the longest 107, so the cut lands between 3% and 11%.
                Three paragraphs is the conventional in-article position and
                a real one-third cut would read far worse; the comment was
                what was wrong, not the number. The fallback below is
                unreachable in practice for the same reason. */}
            {Array.isArray(postData.body) && postData.body.length >= 4 ? (
              <>
                <PortableText
                  value={postData.body.slice(0, 3)}
                  components={portableTextComponents}
                />
                <AdSlot slotId={AD_SLOTS.inArticle} format="fluid" layout="in-article" />
                <PortableText
                  value={postData.body.slice(3)}
                  components={portableTextComponents}
                />
              </>
            ) : (
              <PortableText
                value={postData.body}
                components={portableTextComponents}
              />
            )}
          </div>

          {/* End-of-post ad — between content and the newsletter CTA. */}
          <AdSlot slotId={AD_SLOTS.endOfPost} format="auto" />

          {related.length > 0 && (
            <section className='post-related'>
              <h2 className='post-related__title'>Sigue leyendo</h2>
              <div className='post-related__grid'>
                {related.map((r) => (
                  <Link
                    key={r.slug.current}
                    to={`/${r.slug.current}`}
                    className='post-related__card'>
                    {r.mainImage?.asset?.url && (
                      <img
                        src={sizedImage(r.mainImage.asset.url, 600)}
                        alt=""
                        loading="lazy"
                        className='post-related__img'
                      />
                    )}
                    <span className='post-related__name'>{r.title}</span>
                  </Link>
                ))}
              </div>
              <Link to='/allpost' className='post-related__all'>
                Ver todos los posts &rarr;
              </Link>
            </section>
          )}

          <NewsletterSignup variant="inline" />
        </article>
      </AnimatedSection>
    </>
  );
};

export default OnePost;
