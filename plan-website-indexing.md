# Website Indexing Fix Plan

## Context
After migrating DNS from meaningfool.net to meaningfool.github.io, the site needs proper SEO configuration to ensure correct indexing by search engines.

## Current Issues
1. Site URL in config still points to `meaningfool.github.io` instead of `meaningfool.net`
2. No sitemap.xml generation
3. Missing robots.txt file
4. No canonical URLs set
5. No trailing slash consistency defined

## Implementation Tasks

### 1. Update Site Configuration ✅
- [x] Update `astro.config.mjs`:
  - Changed `site` from `'https://meaningfool.github.io'` to `'https://meaningfool.net'`
  - Added trailing slash configuration (`trailingSlash: 'never'`) for URL consistency

### 2. Add Sitemap Generation ✅
- [x] Installed `@astrojs/sitemap` package
- [x] Added sitemap integration to `astro.config.mjs`
- [x] Verified sitemap generation at `/sitemap-index.xml` and `/sitemap-0.xml`

### 3. Create robots.txt ✅
- [x] Created `public/robots.txt` with:
  - Allow all crawlers
  - Reference sitemap at `https://meaningfool.net/sitemap-index.xml`

### 4. Add Canonical URLs ✅
- [x] Updated Layout component to automatically generate canonical URLs using Astro's built-in `Astro.url` and `Astro.site`
- [x] Removed hardcoded canonical URLs from individual pages (following Astro best practices)
- [x] Canonical URLs now automatically generated for all pages based on the site config

### 5. Testing & Verification ✅
- [x] Built site locally and verified:
  - sitemap-index.xml and sitemap-0.xml exist and contain correct URLs
  - robots.txt is accessible and points to correct sitemap
  - canonical tags are present in HTML for all pages
- [x] Tested with Playwright browser automation:
  - Homepage canonical: `https://meaningfool.net/`
  - About page canonical: `https://meaningfool.net/about`
  - Article pages canonical: dynamically generated based on URL
- [x] Verified 404 page functionality (already exists)
- [x] Verified CNAME file (already exists with correct domain)

## Notes
- The 404.astro page already exists and is properly configured
- The CNAME file already exists with `meaningfool.net`
- GitHub Pages will automatically use the 404.html for missing pages
- All URLs should use `https://meaningfool.net` as the base after these changes

## Implementation Complete ✅

All SEO and indexing improvements have been successfully implemented:

### Key Changes Made:
1. **Site configuration** updated to use `https://meaningfool.net` as the primary domain
2. **Sitemap generation** automatically creates XML sitemaps for all pages
3. **robots.txt** properly configured to guide search engine crawlers
4. **Canonical URLs** automatically generated using Astro best practices
5. **All changes tested** and verified working correctly

### Best Practice Implementation:
Following Astro best practices research, we've implemented canonical URLs using Astro's built-in URL handling instead of hardcoding them. The Layout component now uses `new URL(Astro.url.pathname, Astro.site)` to automatically generate canonical URLs for all pages. This is more maintainable and follows the framework's recommended patterns.

### Next Steps:
- Commit and push changes to the `fix-website-indexing` branch
- Create a pull request for review
- Deploy to production
- Submit new sitemap to Google Search Console