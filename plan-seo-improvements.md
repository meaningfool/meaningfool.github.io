# Focused SEO Improvements Plan - Personal Site Edition

## Context
Following the initial website indexing fixes, this streamlined plan focuses on the most impactful SEO improvements for a personal site, avoiding over-engineering while hitting the essentials.

## ✅ Essential Fixes (Do These)

### 1. Create 404 Error Page ✅
**Priority: CRITICAL** | **Time: 5 min** | **Status: COMPLETED**

- [x] Create `src/pages/404.astro`:
  ```astro
  ---
  ---
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>404 - Page Not Found | meaningfool</title>
      <meta name="robots" content="noindex" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </head>
    <body>
      <main>
        <h1>404 - Page Not Found</h1>
        <p>The page you're looking for doesn't exist.</p>
        <p><a href="/">← Back to homepage</a></p>
      </main>
    </body>
  </html>
  ```

### 2. Update robots.txt ✅
**Priority: HIGH** | **Time: 2 min** | **Status: COMPLETED**

- [x] Update `public/robots.txt`:
  ```
  User-agent: *
  Allow: /

  Sitemap: https://meaningfool.net/sitemap.xml
  Sitemap: https://meaningfool.net/sitemap-index.xml
  ```
  Note: Default `Allow: /` already permits AI crawlers. Only add specific AI bot rules if you want to explicitly permit/deny training.

### 3. Essential Meta Tags in Layout ✅
**Priority: HIGH** | **Time: 15 min** | **Status: COMPLETED**

- [x] Update `src/layouts/Layout.astro` to accept props and generate meta tags:
  ```astro
  ---
  const {
    title = 'meaningfool',
    description = 'Personal site of Josselin Perrus, product manager in Paris',
    type = 'website'
  } = Astro.props;

  const canonical = new URL(Astro.url.pathname, Astro.site).toString();
  ---
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />

      <!-- Open Graph -->
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content="meaningfool" />

      <!-- Twitter Cards -->
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:site" content="@nonils" />
      <meta name="twitter:creator" content="@nonils" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </head>
  ```

### 4. Create Reusable JSON-LD Component ✅
**Priority: HIGH** | **Time: 10 min** | **Status: COMPLETED**

- [x] Create `src/components/JsonLd.astro`:
  ```astro
  ---
  const { data } = Astro.props;
  ---
  <script type="application/ld+json">
    {JSON.stringify(data)}
  </script>
  ```

### 5. Add JSON-LD Structured Data ✅
**Priority: HIGH** | **Time: 15 min** | **Status: COMPLETED**

- [x] **Homepage** - Add WebSite schema:
  ```astro
  ---
  import JsonLd from '../components/JsonLd.astro';
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "meaningfool",
    "url": "https://meaningfool.net",
    "publisher": { "@type": "Person", "name": "Josselin Perrus" }
  };
  ---
  <JsonLd data={websiteSchema} />
  ```

- [x] **About Page** - Add Person schema:
  ```astro
  ---
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Josselin Perrus",
    "url": "https://meaningfool.net/about",
    "sameAs": [
      "https://github.com/meaningfool",
      "https://twitter.com/nonils"
    ]
  };
  ---
  <JsonLd data={personSchema} />
  ```

- [x] **Article Pages** - Add BlogPosting schema:
  ```astro
  ---
  const canonical = new URL(Astro.url.pathname, Astro.site).toString();
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": article.data.title,
    "description": article.data.description,
    "author": { "@type": "Person", "name": "Josselin Perrus" },
    "datePublished": article.data.date.toISOString(),
    "url": canonical
  };
  ---
  <JsonLd data={articleSchema} />
  ```

### ~~6. Image Optimization~~
**~~Priority: HIGH~~** | **~~Time: 10 min~~**

*Skipped: Conflicts with previous decision to avoid Astro Image component due to markdown compatibility issues. Site is text-heavy with minimal images, so optimization impact would be minimal.*

- [ ] ~~Use Astro's built-in `astro:assets` for automatic optimization:~~
  ```astro
  ---
  import { Image } from 'astro:assets';
  import heroImage from '../assets/hero.jpg';
  ---
  <!-- Above fold: eager loading with high priority -->
  <Image src={heroImage} alt="Hero image" width={1200} height={630}
         loading="eager" fetchpriority="high" />

  <!-- Below fold: lazy loading -->
  <Image src={otherImage} alt="Description" width={800} height={600} loading="lazy" />
  ```

### 7. Font Optimization
**Priority: MEDIUM** | **Time: 2 min**

✅ **Already optimized:** Your fonts already have `display=swap`

**Font Usage Analysis:**
- **Roboto Mono 300**: Body text (all paragraphs, content)
- **Space Mono 500**: H1 headings + site title in header
- **Space Mono 600**: H2-H6 headings + table headers + H1 prefix

**Currently Loading:** 7 font files (Space Mono: 400, 500, 600 + Roboto Mono: 300, 400, 500, 600)
**Actually Used:** 3 font files (Space Mono: 500, 600 + Roboto Mono: 300)

- [ ] **Optimize font loading** - reduce from 7 to 3 font files:
  ```html
  <!-- Current: 7 font files -->
  <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;500;600&family=Roboto+Mono:wght@300;400;500;600&display=swap" rel="stylesheet">

  <!-- Optimized: 3 font files (remove unused 400s + unused Roboto Mono 500,600) -->
  <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@500;600&family=Roboto+Mono:wght@300&display=swap" rel="stylesheet">
  ```

**Performance impact:** ~57% reduction in font files (7→3), faster loading

### 8. Create Default OG Image & Upgrade Twitter Cards
**Priority: MEDIUM** | **Time: 15 min**

- [ ] Create `public/og-default.jpg` (1200×630px) for social sharing
- [ ] Update Layout component to include image support:
  ```astro
  const {
    title = 'meaningfool',
    description = 'Personal site of Josselin Perrus, product manager in Paris',
    ogImage = new URL('/og-default.jpg', Astro.site).toString(),
    type = 'website'
  } = Astro.props;
  ```
- [ ] Add image meta tags back to Layout:
  ```html
  <meta property="og:image" content={ogImage} />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content={ogImage} />
  ```

## 🪛 Optional Improvements (Nice-to-Have)

### 9. RSS Feed Implementation
**Priority: LOW** | **Time: 10 min**

- [ ] Install `@astrojs/rss` and create feed endpoint
- [ ] Add RSS link to Layout:
  ```html
  <link rel="alternate" type="application/rss+xml" title="meaningfool" href="/rss.xml">
  ```

### 10. llms.txt for AI Discovery
**Priority: LOW** | **Time: 20-30 min**

**Research Findings & Existing Solutions:**

**Available Implementations (Review for inspiration):**
1. **@4hse/astro-llms-txt** - GitHub: 10★, 2 forks, NPM: v1.0.4
   - Generates 3 formats (txt, small, full)
   - Very low adoption, no dependent packages
   - Company-backed but limited community

2. **@waldheimdev/astro-ai-llms-txt** - NPM: v1.1.3
   - Alternative implementation
   - Similar low adoption

3. **ColdranAI/astro-llms-generate** - GitHub repository
   - Fork of @4hse plugin for personal use
   - Minimal adoption

4. **Manual implementations** (most common):
   - Astro Docs official implementation (static files)
   - Multiple blog posts with custom solutions using content collections
   - Most developers create custom `src/pages/llms.txt.ts` endpoints

**Recommended Approach: Custom Dynamic Implementation**
- [ ] Review existing implementations for inspiration
- [ ] Create `src/pages/llms.txt.ts` using Astro content collections:
  ```typescript
  import { getCollection } from "astro:content";
  import type { APIRoute } from "astro";

  export const GET: APIRoute = async () => {
    const articles = await getCollection("writing");
    const sortedArticles = articles.sort((a, b) =>
      b.data.date.getTime() - a.data.date.getTime()
    );

    const content = `# meaningfool

> Personal website of Josselin Perrus, product manager in Paris

## Latest Articles

${sortedArticles.slice(0, 10).map(article =>
  `- [${article.data.title}](https://meaningfool.net/articles/${article.id})`
).join('\n')}

## About

- [About](https://meaningfool.net/about): Background and experience
- [All Articles](https://meaningfool.net/): Complete archive
`;

    return new Response(content, {
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  };
  ```

**Why custom over plugins:**
- All plugins have very low adoption (< 15 stars combined)
- No clear winner or standard in ecosystem
- Simple use case doesn't justify dependency risk
- Full control over format and content selection

## 🧹 Skip These (Overkill for Personal Site)

- ~~Meta keywords~~ (no SEO value)
- ~~Detailed OG image dimensions~~ (unnecessary)
- ~~Security headers via meta tags~~ (use Cloudflare response headers instead)
- ~~hreflang tags~~ (single language site)
- ~~Explicit AI crawler rules~~ (default Allow covers them)

## 🎯 Minimal Implementation Plan

**Phase 1: Essentials (45 minutes total)**
1. 404 page with noindex (5 min)
2. Update robots.txt (2 min)
3. Enhanced Layout with meta tags (15 min)
4. JsonLd component (10 min)
5. Add structured data to pages (15 min)

**Phase 2: Performance (15 minutes)**
6. Image optimization (10 min)
7. Font optimization (5 min)

**Phase 3: Optional (15 minutes)**
8. Create OG image (15 min)
9. RSS feed (10 min) - if desired
10. llms.txt (5 min) - if desired

**Total time: ~75 minutes for complete implementation**

## ✅ Already Working Well

- Canonical URLs (using Astro.url + Astro.site) ✅
- Site configuration (https://meaningfool.net) ✅
- Sitemap generation ✅
- Trailing slash consistency ✅

## 🧪 Testing Checklist

After implementation:
- [ ] Test 404 page shows and has noindex
- [ ] Verify OG tags in social media debuggers
- [ ] Run Lighthouse audit (target 90+ SEO score)
- [ ] Validate JSON-LD with Schema.org validator
- [ ] Check robots.txt accessibility

## 📚 Key Resources

- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Schema.org Validator](https://validator.schema.org/)
- [PageSpeed Insights](https://pagespeed.web.dev/)

**Focus:** Implement essentials first, add optional features only if you have time and interest.