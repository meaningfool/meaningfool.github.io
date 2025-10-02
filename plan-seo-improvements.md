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
**Priority: LOW** | **Time: 30-40 min**

**Implementation Strategy: Two-Phase Custom Build-Time Generation**

#### Phase 1: Create `/llms.txt` (15-20 min)
**Purpose:** Minimal index for AI agent discovery and navigation

- [ ] Create `src/pages/llms.txt.ts` with static generation:
  ```typescript
  import { getCollection } from "astro:content";
  import type { APIRoute } from "astro";

  export const prerender = true; // Static generation at build time

  export const GET: APIRoute = async () => {
    const allContent = await getCollection("writing");
    const buildTime = new Date().toISOString();

    // Shared logic: Separate articles and daily logs based on title pattern
    const dailyLogs = allContent.filter(item => item.data.title.startsWith('Activity Log'))
      .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

    const articles = allContent.filter(item => !item.data.title.startsWith('Activity Log'))
      .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

    const content = `# meaningfool
> Personal website of Josselin Perrus, product manager in Paris. Generated: ${buildTime}

## Scope
All public content including articles and daily logs. Professional insights and work-in-progress thoughts.

## Content

### Articles
${articles.map(article =>
  `- [${article.data.title}](https://meaningfool.net/articles/${article.id})`
).join('\n') || 'No articles yet'}

### Daily Logs
${dailyLogs.map(log =>
  `- [${log.data.title}](https://meaningfool.net/articles/${log.id})`
).join('\n') || 'No daily logs yet'}

## Pages
- [About](https://meaningfool.net/about)
- [Home](https://meaningfool.net/)
- [RSS Feed](https://meaningfool.net/rss.xml)

## Full Content
For complete markdown content, see [llms-full.txt](https://meaningfool.net/llms-full.txt)

## License
© ${new Date().getFullYear()} Josselin Perrus. Short quotations with attribution welcome.

Generated: ${buildTime}`;

    return new Response(content, {
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  };
  ```

#### Phase 2: Create `/llms-full.txt` (15-20 min)
**Purpose:** Complete markdown content for comprehensive AI understanding

- [ ] Create `src/pages/llms-full.txt.ts` with full content:
  ```typescript
  import { getCollection } from "astro:content";
  import type { APIRoute } from "astro";
  import fs from 'node:fs/promises';
  import path from 'node:path';

  export const prerender = true;

  export const GET: APIRoute = async () => {
    const allContent = await getCollection("writing");
    const buildTime = new Date().toISOString();

    // Reuse separation logic from llms.txt (title-based filtering)
    const dailyLogs = allContent.filter(item => item.data.title.startsWith('Activity Log'))
      .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

    const articles = allContent.filter(item => !item.data.title.startsWith('Activity Log'))
      .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

    // Build full content with markdown
    let fullContent = `# meaningfool - Full Content
> Complete markdown content of all public articles and daily logs. Generated: ${buildTime}

## Site Information
Personal website of Josselin Perrus, product manager in Paris.

---

## Articles\n\n`;

    // Add each article's full content
    for (const article of articles) {
      // Try to find the file - articles may have date prefixes
      const articlesDir = path.join(process.cwd(), 'src/content/writing/articles');
      let filePath: string | null = null;

      try {
        const files = await fs.readdir(articlesDir);
        const matchingFile = files.find(file =>
          file.endsWith(`-${article.id}.md`) || file === `${article.id}.md`
        );

        if (matchingFile) {
          filePath = path.join(articlesDir, matchingFile);
        }
      } catch (error) {
        console.warn(`Could not list articles directory`);
      }

      if (filePath) {
        try {
          const rawContent = await fs.readFile(filePath, 'utf-8');
          // Remove frontmatter
          let content = rawContent.replace(/^---[\s\S]*?---\n*/m, '');

          // Bump all headers down by 2 levels to maintain hierarchy
          // # becomes ###, ## becomes ####, etc.
          content = content.replace(/^(#{1,4})\s/gm, (match, hashes) => {
            return '#'.repeat(hashes.length + 2) + ' ';
          });

          fullContent += `### ${article.data.title}
**URL**: https://meaningfool.net/articles/${article.id}
**Date**: ${article.data.date.toISOString().split('T')[0]}
**Type**: Article

${content}

---

`;
        } catch (error) {
          console.warn(`Could not read article: ${article.id}`);
        }
      } else {
        console.warn(`Could not find article file for: ${article.id}`);
      }
    }

    fullContent += `## Daily Logs\n\n`;

    // Add each daily log's full content
    for (const log of dailyLogs) {
      // Daily logs are in the daily-logs folder
      const dailyLogsDir = path.join(process.cwd(), 'src/content/writing/daily-logs');
      const filePath = path.join(dailyLogsDir, `${log.id}.md`);

      try {
        const rawContent = await fs.readFile(filePath, 'utf-8');
        // Remove frontmatter
        let content = rawContent.replace(/^---[\s\S]*?---\n*/m, '');

        // Bump all headers down by 2 levels to maintain hierarchy
        // # becomes ###, ## becomes ####, etc.
        content = content.replace(/^(#{1,4})\s/gm, (match, hashes) => {
          return '#'.repeat(hashes.length + 2) + ' ';
        });

        fullContent += `### ${log.data.title}
**URL**: https://meaningfool.net/articles/${log.id}
**Date**: ${log.data.date.toISOString().split('T')[0]}
**Type**: Daily Log

${content}

---

`;
      } catch (error) {
        console.warn(`Could not read daily log: ${log.id}`);
      }
    }

    fullContent += `## Footer
Generated: ${buildTime}
Total Articles: ${articles.length}
Total Daily Logs: ${dailyLogs.length}`;

    // Monitor file size
    const sizeInKB = Buffer.byteLength(fullContent, 'utf-8') / 1024;
    if (sizeInKB > 1024) {
      console.warn(`llms-full.txt is ${sizeInKB.toFixed(2)}KB - consider splitting`);
    }

    return new Response(fullContent, {
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  };
  ```

**Shared Components Between Both Files:**
- Content collection fetching logic
- Article/daily-log separation logic (title-based: "Activity Log" prefix for daily logs)
- Date sorting logic
- Build timestamp generation
- URL construction pattern

**Key Features:**
- Build-time static generation (no runtime overhead)
- Progressive disclosure (index → full content)
- Includes all public content with proper header hierarchy
- Absolute URLs for agent portability
- Clear content separation by type (title-based filtering)
- Header bumping (article # becomes ###, ## becomes ####, etc.)
- File size monitoring for llms-full.txt
- Graceful error handling for missing files
- Smart file path resolution for date-prefixed articles

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