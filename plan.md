# meaningfool Style Implementation Plan

## Current State Analysis

### Typography
**Current State:**
- Font: Inter font family (`Inter, Roboto, 'Helvetica Neue', 'Arial Nova', 'Nimbus Sans', Arial, sans-serif`)
- Body: 16px, line-height varies (1.6 for intro, 1.4 for articles)
- Headers: h1 varies by page (2rem on about, 1.5rem brand), h2 is 1.25rem
- Font weights: "normal" used throughout

**Target State (from style guide):**
- Font: Space Mono everywhere (`'Space Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace`)
- Body: 16px / 28px line-height, weight 400
- h2: 20px globally, weight 500
- Headers: responsive with clamp(), weight 500, line-height 1.25, letter-spacing -0.015em
- Brand: 18px, weight 500

### Colors
**Current State:**
- Accent color: #f97316 (orange-500)
- Text colors: #111827 (gray-900), #374151 (gray-700), #6b7280 (gray-500)
- Background: white (implied)
- No dark mode support

**Target State (from style guide):**
- Accent: Balanced Orange #FF7A1E (hover #E66A18)
- HSL tokens: `--accent-h: 25; --accent-s: 100%; --accent-l: 56%;`
- Comprehensive color system with CSS custom properties

### Layout & Structure
**Current State:**
- Container: max-width 800px, padding 0 1rem
- Header: Border bottom, 1rem vertical padding
- Navigation: Separate /about page
- No footer

**Target State (from style guide):**
- Container: 70ch measure with 1.5rem side padding
- Header: 1.25rem vertical padding
- Navigation: Keep /about page link (not anchor)
- Footer with copyright
- Brief about section on homepage + detailed /about page

### Components Structure
**Current State:**
- Separate Header.astro component
- Separate /about page
- Articles hardcoded in frontmatter
- No skip-link or advanced accessibility features

**Target State (from style guide):**
- Integrated header with brand and nav
- Brief about paragraph on homepage + separate detailed /about page
- Articles with "# " prefix and inline dates
- Skip-link and focus-visible states

## Detailed Implementation Items

### 1. Font System Migration
**What needs to change:**
- Replace Inter with Space Mono in all components
- Add Google Fonts link to Layout.astro
- Update all font-size and line-height values
- Implement responsive heading scale with clamp()

**Technical approach:**
```html
<!-- Add to Layout.astro <head> -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;500&display=swap" rel="stylesheet">
```

**Impact:** All text will change appearance. Space Mono is monospace, so layout may need adjustments.

**Files affected:**
- `src/layouts/Layout.astro` (add font link)
- `src/components/Header.astro` (update font-family, sizes, weights)
- `src/pages/index.astro` (update font-family, sizes, line-heights)
- `src/pages/about.astro` (update font-family, sizes)

### 2. Color System Implementation
**What needs to change:**
- Replace #f97316 with #FF7A1E throughout
- Implement HSL token system with CSS custom properties
- Update all hardcoded colors to use tokens

**Technical approach:**
Create CSS custom properties in Layout.astro:
```css
:root {
  --accent-h: 25; --accent-s: 100%; --accent-l: 56%;
  --accent: hsl(var(--accent-h) var(--accent-s) var(--accent-l));
  --accent-hover: hsl(var(--accent-h) var(--accent-s) calc(var(--accent-l) - 8%));
  --bg: #ffffff; --text: #0c0c0d; --muted: #6b7280; --border: #e6e8eb;
}
```

**Impact:** Colors will shift slightly to warmer orange tones.

**Files affected:** All component files need color updates.

### 3. Layout System Update
**What needs to change:**
- Change max-width from 800px to 70ch
- Update padding from 1rem to 1.5rem
- Implement consistent spacing using tokens

**Technical approach:**
```css
:root {
  --measure: 70ch;
  --container-pad: 1.5rem;
}
.container {
  width: min(var(--measure), 100%);
  margin-inline: auto;
  padding-inline: var(--container-pad);
}
```

**Impact:** Content will be slightly narrower, more consistent with readability best practices.

**Files affected:** All files with .container classes.

### 4. Homepage Structure Update
**What needs to change:**
- Add brief About section to homepage (single paragraph)
- Keep separate /about page for detailed information
- Navigation remains as traditional page link (not anchor)
- Add proper semantic sections

**Technical approach:**
```html
<main>
  <section id="about">
    <p>Brief single paragraph intro about Josselin</p>
  </section>
  <section id="articles" aria-labelledby="articles-title">
    <h2 id="articles-title" class="post-title">Articles</h2>
    <!-- articles list -->
  </section>
</main>
```

**Impact:** Homepage gets brief intro, detailed About page remains for full bio.

**Clarification:** The About section on homepage serves as a brief introduction, while the /about page contains comprehensive information about background, experience, and interests.

**Files affected:**
- `src/pages/index.astro` (add about section)
- `src/components/Header.astro` (no change needed)
- `src/pages/about.astro` (keep and style consistently)

### 5. Articles List Styling
**What needs to change:**
- Implement "# " prefix using `.post-title::before`
- Make dates inline after titles (not flexbox alignment)
- Update spacing to match style guide (.15rem between items)
- Remove explicit bullet characters, use CSS ::before

**Technical approach:**
```css
.post-title::before { content:"# "; color:var(--accent); font-weight:700; }
.articles-list li::before { content:"*"; margin-right:.5rem; }
.articles-list .post-meta { color:var(--muted); margin-left:.5rem; }
```

**Impact:** Visual changes to article list, more compact layout.

**Files affected:** `src/pages/index.astro`

### 6. Footer Addition
**What needs to change:**
- Add footer component or section
- Include copyright notice

**Technical approach:**
```html
<footer class="site">© 2025 Josselin Perrus</footer>
```

**Impact:** Extends page height, provides site closure.

**Files affected:** `src/layouts/Layout.astro` or individual pages

### 7. Accessibility Enhancements
**What needs to change:**
- Add skip-link for keyboard navigation
- Implement proper focus-visible states
- Add ARIA labels where specified

**Technical approach:**
```html
<a class="skip-link" href="#main">Skip to main content</a>
```
```css
.skip-link:focus { left:1rem; top:1rem; background:var(--surface); }
a:focus-visible { outline:2px solid var(--accent); outline-offset:2px; }
```

**Impact:** Better accessibility compliance, no visual changes for mouse users.

**Files affected:** `src/layouts/Layout.astro`, all components with links.

## Decision Points for Review

### A. Navigation Strategy
**Decision made:** Keep both approaches
- Homepage has brief about section (no anchor navigation needed)
- Separate /about page remains for detailed information
- Navigation continues to point to /about page
**Rationale:** Different content serves different purposes - homepage intro vs. detailed bio

### B. Content Management
**Decision made:** Use content collections with markdown files
- Articles stored as .md files in `src/content/articles/`
- Images stored in `public/images/` folder  
- Content collections already configured in `src/content/config.ts`
**Future plan:** Use git submodules to pull content from separate repository
**Implementation:**
- Create dummy article files for development
- Use Astro's content collections API to fetch and display articles
- Set up proper routing for individual article pages

### C. CSS Architecture
**Recommendation:** Hybrid approach with global tokens + component styles
**Best Practice for Astro:**
1. **Global styles location**: 
   - Option A: In `Layout.astro` `<style is:global>` (simpler, good for small projects)
   - Option B: Create `src/styles/global.css` and import in Layout.astro (better organization)
   - **Recommended**: Option A for meaningfool's scope

2. **Structure**:
   ```astro
   <!-- In Layout.astro -->
   <style is:global>
     /* CSS custom properties (tokens) */
     /* Base typography rules */
     /* Global utilities (.container, .skip-link) */
   </style>
   ```

3. **Component styles**: Keep component-specific styles in each .astro file
   - Use CSS custom properties from global tokens
   - Scoped by default (Astro adds unique classes)

**Rationale**: This approach provides consistency via tokens while allowing component flexibility

### D. Font Loading Strategy
**Decision made:** Self-hosted fonts
**Implementation for GitHub Pages:**

1. **Font files location**: `public/fonts/` directory
   - Download Space Mono woff2 files (weights 400, 500)
   - GitHub Pages serves everything in public/ as static assets

2. **CSS implementation**:
   ```css
   @font-face {
     font-family: 'Space Mono';
     src: url('/fonts/space-mono-400.woff2') format('woff2');
     font-weight: 400;
     font-display: swap; /* Better loading performance */
   }
   ```

3. **No known issues with GitHub Pages**:
   - Static font files work perfectly
   - Better performance than Google Fonts (no external requests)
   - GDPR compliant (no third-party tracking)

**Benefits**: Faster loading, privacy-friendly, works offline

## Implementation Order & Dependencies

### Phase 1: Foundation (Low Risk)
1. Download and add Space Mono font files to public/fonts/
2. Implement CSS custom properties system in Layout.astro
3. Add footer structure
4. Create public/images/ directory for article images
5. Create dummy markdown articles in src/content/articles/

### Phase 2: Visual Updates (Medium Risk)
6. Update color system throughout components
7. Migrate typography (font-family, sizes, weights)
8. Update layout measurements (70ch, 1.5rem padding)

### Phase 3: Structure Changes (Medium Risk)
9. Add About section to homepage (brief intro)
10. Update homepage to use content collections for articles
11. Restyle articles list (prefix, inline dates)
12. Create dynamic article pages route

### Phase 4: Enhancements (Low Risk)
13. Add accessibility features (skip-link, focus states)
14. Test responsive behavior

## Risk Assessment

**Low Risk Items:**
- Color updates (easily reversible)
- Typography changes (visual only)
- CSS custom properties (additive)

**Medium Risk Items:**
- Layout measurement changes (may affect responsive behavior)
- Footer addition (extends page structure)
- Homepage content addition (adding About section)
- Articles list restructuring (visual changes)

## Files Summary

**Files to Modify:**
- `src/layouts/Layout.astro` (major: add fonts, CSS tokens, possibly footer)
- `src/components/Header.astro` (minor: styling updates only)
- `src/pages/index.astro` (moderate: add About section, restyle articles)
- `src/pages/about.astro` (minor: apply consistent styling)

**Files to Add:**
- Font files in `public/fonts/`
- Dummy article markdown files in `src/content/articles/`
- Article images in `public/images/`
- `src/pages/[...slug].astro` (dynamic route for article pages)

**Future Enhancement:**
- Configure git submodules to pull articles from separate repository

This plan provides a comprehensive roadmap for aligning the current implementation with your style guide. Each item can be discussed and approved independently before implementation.