# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

**Astro v5.13.5** static site generator for `meaningfool.github.io` deployed on GitHub Pages using **Bun** package manager.

## Repository Architecture

This project uses **two separate repositories**:

1. **Main Repository**: `meaningfool.github.io` (site code, workflows, deployment)
2. **Content Repository**: `meaningfool-writing` (articles, included as git submodule)

**ALWAYS verify repository context before git operations:**

```bash
# Check current directory and repository
pwd && git remote -v
```

Expected outputs:
- Main repo: `/Users/josselinperrus/Projects/meaningfool.github.io` + `github.com/meaningfool/meaningfool.github.io.git`
- Content repo: `/Users/josselinperrus/Projects/meaningfool.github.io/src/content/writing` + `github.com/meaningfool/meaningfool-writing.git`

### Repository Navigation Warnings

**Common mistakes to avoid**:
- Confusing which repository you're in (main vs content)
- Assuming local state matches remote state
- Working in wrong directory when managing submodules

**Always verify state before operations**:
```bash
# Check local vs remote differences
git status              # Local changes
git fetch && git log origin/main..HEAD  # Local commits not on remote
git log HEAD..origin/main              # Remote commits not local

# For submodules specifically
git submodule status    # Local submodule state
gh api repos/meaningfool/meaningfool.github.io/contents/src/content/writing | jq -r '.sha'  # Remote pointer
```

## Development Commands

```bash
# Install dependencies
bun install

# Development server (localhost:4321)
bun dev

# Production build
bun build

# Preview production build
bun preview

# Astro CLI
bun astro <command>
```

## Directory Structure

```
meaningfool.github.io/
├── .github/workflows/
│   ├── deploy.yml              # GitHub Pages deployment
│   └── update-content.yml      # Content synchronization
├── src/
│   ├── components/
│   │   ├── ArticlesList.astro
│   │   └── Header.astro
│   ├── content/
│   │   ├── config.ts           # Content collection schema
│   │   └── writing/            # Git submodule → meaningfool-writing
│   ├── layouts/
│   │   └── Layout.astro
│   └── pages/
│       ├── articles/[slug].astro
│       ├── about.astro
│       └── index.astro
├── astro.config.mjs            # Astro configuration
├── package.json
└── tsconfig.json
```

## Content Management

### Content Collection Configuration

Articles are configured in `src/content/config.ts`:

```typescript
const writing = defineCollection({
  loader: glob({
    pattern: [
      'articles/*.md',  // Match .md files in articles/ folder
      'daily-logs/*.md', // Match .md files in daily-logs/ folder
      '!.*/**.md',      // Exclude hidden folders (starting with .)
      '!*.md',          // Exclude root-level markdown files
    ],
    base: './src/content/writing',
    generateId: ({ entry }) => {
      // Strip folder prefix and .md extension
      let id = entry.replace(/^(articles|daily-logs)\//, '').replace(/\.md$/, '');

      // Only strip date prefix from articles (not daily-logs)
      if (entry.startsWith('articles/')) {
        id = id.replace(/^\d{4}-\d{2}-\d{2}-/, '');
      }

      return id;
    }
  }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
});
```

**Key Features:**
- **Folder-specific patterns**: Targets content in `articles/` and `daily-logs/` folders
- **generateId callback**: Strips folder prefixes and date prefixes from articles to create clean URLs
  - Articles: `2025-01-15-my-post.md` → `/articles/my-post` (date stripped)
  - Daily logs: `2025-01-15-notes.md` → `/articles/2025-01-15-notes` (date preserved)
- **Backward compatible**: Existing articles without date prefixes remain unchanged
- **Exclusion rules**: Ignores hidden folders and root-level markdown files

### Submodule Management

```bash
# Initialize submodules (first time)
git submodule init && git submodule update

# Update submodule to latest
git submodule update --remote src/content/writing

# Check submodule status
git submodule status

# Reset corrupted submodule
git submodule deinit src/content/writing && git submodule init && git submodule update
```

## Publishing Workflow

Content publishing uses manual workflow triggers due to GitHub Actions security limitations.

### Critical Understanding

**Pushing to content repo (`meaningfool-writing`) does NOT trigger deployment!** Only pushes to the main repo (`meaningfool.github.io`) can trigger deployment workflows.

### Current Process

1. **Edit content** in `meaningfool-writing` repository
2. **Commit and push** to content repository (no deployment triggered)  
3. **Publish content** using `/publish` slash command from `meaningfool-writing` directory

### Slash Command

The `/publish` command (located in `meaningfool-writing/.claude/commands/publish.md`) automatically:
- Triggers `update-content.yml` workflow
- Polls for completion with error handling
- Triggers `deploy.yml` workflow
- Polls for completion with error handling
- Provides status updates and error reporting

### Manual Workflow Commands

```bash
# Trigger content update
gh workflow run update-content.yml --repo meaningfool/meaningfool.github.io

# Trigger deployment
gh workflow run deploy.yml --repo meaningfool/meaningfool.github.io

# Check workflow status
gh run list --repo meaningfool/meaningfool.github.io --limit=3
```

## GitHub Actions Limitation

**Critical**: GitHub Actions using `GITHUB_TOKEN` cannot trigger other GitHub Actions. This means:

- **Manual push to main repo** → ✅ Automatic deployment
- **GitHub Action push to main repo** → ❌ No automatic deployment

This is why the publishing workflow requires two separate workflow triggers instead of automatic chaining.

## Key Configuration

### Astro Configuration (`astro.config.mjs`)
- **Vite symlink preservation**: `vite: { resolve: { preserveSymlinks: true } }` enables submodule compatibility
- **GitHub Pages**: Configured with correct `site` and `base` settings

### Git Submodule (`.gitmodules`)
- **Branch tracking**: `branch = main` enables proper content updates

### Content Collection Schema
- **Required fields**: `title` (string), `date` (YYYY-MM-DD format)  
- **Optional fields**: `description`, `tags`

## Technology Stack

- **Astro 5.13.5**: Static site generator with component islands
- **Bun**: JavaScript runtime and package manager
- **TypeScript**: Type safety and development experience
- **GitHub Pages**: Static site hosting
- **Git Submodules**: Content/code separation