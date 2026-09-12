/**
 * The project cards.
 *
 * The list itself lives in src/config/projects.json, read by BOTH this module
 * (the browser) and scripts/prerender.mjs (the build). It is JSON for the same
 * reason src/config/translations.json is: a .mjs build script cannot import a
 * .ts module, and a second copy of the list would drift the moment one side was
 * edited alone.
 *
 * What made that matter: the home page's <noscript> listed the blog posts and
 * nothing else, so twelve projects — the portfolio, on a portfolio site — were
 * invisible to anything that does not execute the bundle. The posts had been
 * fixed; the projects were never in the fix.
 */
import projects from "../config/projects.json";

export interface Project {
  id: number;
  image: string;
  title: string;
  description: string;
  url: string;
  languages: string[];
  badge?: string;
}

export const data: Project[] = projects;
