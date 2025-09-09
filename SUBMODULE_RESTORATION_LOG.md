# Git Submodule Restoration Progress Log

## Problem Statement
Git submodules were previously attempted but reverted due to "routing errors" during deployment. Goal: Restore submodules for separated content management.

## Root Cause Discovery
**Issue**: Astro content collections couldn't read content from Git submodule directories
- **NOT** a deployment pipeline issue
- **NOT** a Git submodule configuration issue
- **IS** an Astro + symlink issue (submodules create symlink-like `.git` files)

## Solution Applied
Added to `astro.config.mjs`:
```javascript
vite: {
    resolve: {
        preserveSymlinks: true
    }
}
```

## Current Status

### ✅ What Works
1. **Local Development**: 
   - All 3 articles from submodule display on homepage
   - Individual article pages render correctly
   - No 404 errors
   - Build completes successfully with all articles

2. **Git Submodule Setup**:
   - Submodule at `src/content/writing` → `meaningfool-writing` repo
   - Current commit: `e5cf624`
   - Contains 3 articles: `sample-article-1.md`, `sample-article-2.md`, `testing-content-workflow.md`

### ❌ What Doesn't Work
1. **Production Deployment**: 
   - GitHub Actions build failing (16 seconds)
   - Only 2/3 articles visible on production
   - Missing: `testing-content-workflow.md`

### ❓ Unknown/Untested
1. **Automated content workflow** (webhook from writing repo → site rebuild)
2. **Why production build fails** when local build succeeds
3. **Whether the Vite fix works in GitHub Actions environment**

## Root Cause Analysis Update

### Build Failure Investigation (Completed)
Found the actual cause of GitHub Actions build failure:

**Circular Reference Issue:**
1. The `meaningfool-writing` repository accidentally contains:
   - A `.gitmodules` file
   - A submodule reference at `src/content/writing` pointing to commit `06b2322` (earlier version of itself)
2. This creates a recursive structure causing Astro to generate incorrect routes:
   - Trying to build: `/articles/src/content/writing/sample-article-1/index.html`
   - Instead of: `/articles/sample-article-1/index.html`
3. Error in build: `Missing parameter: slug` at route generation

**How This Happened:**
- Commit `e5cf624` in writing repo added `.gitmodules` and self-referencing submodule
- This was then pulled into main site as latest submodule commit
- Creates circular reference: main → writing → writing (older version)

## Next Steps
1. Fix circular reference in meaningfool-writing repository
2. Test production deployment with all 3 articles
3. Implement and test automated content update workflow

## Key Files
- Config: `astro.config.mjs` (contains Vite fix)
- Submodule: `.gitmodules` 
- Content: `src/content/writing/` (submodule)
- Workflows: `.github/workflows/deploy.yml` (has `submodules: recursive`)