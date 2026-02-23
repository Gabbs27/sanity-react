# SEO + Logo Design — Issues #9, #10, #11

## Problem
Three open issues need resolution:
- **#9** Agregar logo para la web — current favicons are generic React defaults
- **#10** Agregar descripción en Google — site descriptions not optimized for search
- **#11** Agregar SEO — comprehensive SEO improvements needed

## Current State
- SEO.tsx component exists with react-helmet-async (meta tags, OG, Twitter cards)
- Generic favicon.ico, logo192.png, logo512.png
- HashRouter limits SEO indexing
- No sitemap.xml, no JSON-LD structured data
- OG image path points to non-existent file
- robots.txt exists but has no sitemap reference

## Design

### 1. Logo/Favicon (Issue #9)
- Generate SVG favicon with "GA" initials on #419D78 background
- Create favicon.ico, logo192.png, logo512.png
- Update manifest.json icons array

### 2. HashRouter → BrowserRouter Migration
- Change HashRouter to BrowserRouter in src/index.tsx
- Create public/404.html with SPA redirect script (GitHub Pages workaround)
- Add redirect handling script to index.html
- Verify vite.config.ts base path

### 3. SEO Improvements (Issues #10, #11)
- Optimize meta descriptions per page for better CTR
- Add JSON-LD structured data (Person + WebSite schema) to index.html
- Create og-image.png for social sharing
- Generate sitemap.xml with all main routes
- Update robots.txt with sitemap reference

### 4. SEO Component Updates
- Fix canonical URLs (remove hash)
- Point OG image to real file
- Verify all pages have proper SEO configuration
