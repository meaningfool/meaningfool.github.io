# Content Management with Git Submodules Plan

## Overview

This plan details the step-by-step process to set up a Git submodule system for managing content from the `meaningfool-writing` repository, which doesn't exist yet. We'll create both repositories and establish the submodule connection.

## Current State

- Main repository: `meaningfool.github.io` (exists, Astro site)
- Content repository: `meaningfool-writing` (does not exist yet)
- Articles currently: Stored as markdown files in `src/content/articles/`
- About page: Content stays in `src/pages/about.astro`
- Articles location: Will move to `src/content/writing/` via submodule

## Phase 0: Branch Setup

### 0.1 Create Feature Branch
**Actions:**
1. Create and switch to a new branch for submodule work
2. This allows safe experimentation without affecting main branch
3. Enables easy rollback if issues arise

**Commands:**
```bash
# In main site directory
cd /Users/josselinperrus/Projects/meaningfool.github.io
git checkout -b feature/content-submodule
git push -u origin feature/content-submodule
```

**Benefits:**
- Safe to experiment without affecting main branch
- Can create PR for review before merging
- Easy rollback if submodule setup has issues
- Allows testing deployment on branch before merging

## Phase 1: Create and Set Up Content Repository

### 1.1 Create meaningfool-writing Repository
**Actions:**
1. Create new GitHub repository: `meaningfool-writing`
2. Initialize with README.md
3. Clone locally to work with it
4. Set up directory structure

**Directory structure for meaningfool-writing:**
```
meaningfool-writing/
├── articles/              # Blog posts/articles
│   ├── article-1.md      # Individual articles
│   ├── article-2.md
│   └── images/           # Article images
│       ├── article-1/
│       └── article-2/
└── README.md            # Repository documentation
```

**Commands to execute:**
```bash
# After creating repo on GitHub
git clone https://github.com/meaningfool/meaningfool-writing.git
cd meaningfool-writing
mkdir -p articles/images
touch articles/.gitkeep
git add .
git commit -m "Initial repository structure"
git push origin main
```

### 1.2 Create Sample Content
**Actions:**
1. Create 2-3 sample markdown articles
2. Add sample images for testing
3. Commit and push to establish content

**Sample article format:**
```markdown
---
title: "Sample Article Title"
date: "2024-01-15"
description: "Brief description of the article"
tags: ["tag1", "tag2"]
---

# Article Content

Sample article content here...
```

**Commands:**
```bash
# Create sample articles
echo "Sample article 1" > articles/sample-1.md
echo "Sample article 2" > articles/sample-2.md  
git add .
git commit -m "Add sample content for testing"
git push origin main
```

## Phase 2: Add Submodule to Main Site

### 2.1 Add Submodule
**Actions:**
1. Navigate to main site repository
2. Add meaningfool-writing as submodule in src/content/
3. Configure submodule settings
4. Test submodule functionality

**Commands:**
```bash
# In meaningfool.github.io directory
cd /Users/josselinperrus/Projects/meaningfool.github.io

# Add submodule - this creates src/content/writing/
git submodule add https://github.com/meaningfool/meaningfool-writing.git src/content/writing

# Initialize and update submodule
git submodule init
git submodule update

# Commit the submodule addition
git add .gitmodules src/content/writing
git commit -m "Add meaningfool-writing content submodule"
git push origin main
```

### 2.2 Configure Astro Content Collections
**Actions:**
1. Update src/content/config.ts to point to submodule content
2. Create content collection schema for articles
3. Update existing components to use collections

**File: src/content/config.ts**
```typescript
import { defineCollection, z } from 'astro:content';

const articles = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export const collections = {
  articles: articles,
};
```

**Commands:**
```bash
# Check if config exists and update it
ls src/content/config.ts
# Edit the file to point to the right directory structure
```

### 2.3 Update Site to Use Submodule Content
**Actions:**
1. Modify pages to read from collections instead of hardcoded data
2. Update image paths to point to submodule
3. Create dynamic routing for articles
4. Test content rendering

**Files to modify:**
- `src/pages/index.astro` - Update to use articles from submodule
- `src/pages/articles/[slug].astro` - Update to use articles from submodule
- `src/content/config.ts` - Update collection path to point to submodule

## Phase 3: Workflow and Automation

### 3.1 Development Workflow
**Process:**
1. Edit content in meaningfool-writing repository
2. Push changes to meaningfool-writing
3. Update submodule in main site
4. Test and deploy

**Commands for updating content:**
```bash
# In main site directory
cd src/content/writing
git pull origin main           # Get latest content
cd ../../..                   # Back to main site root
git add src/content/writing    # Stage submodule update
git commit -m "Update content submodule"
git push origin main
```

### 3.2 Automated Submodule Updates (Optional)
**Actions:**
1. Create GitHub Action to auto-update submodule
2. Trigger site rebuild when content changes
3. Set up proper permissions

**File: .github/workflows/update-content.yml**
```yaml
name: Update Content Submodule
on:
  repository_dispatch:
    types: [content-updated]
  workflow_dispatch:

jobs:
  update-content:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: recursive
          token: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Update submodule
        run: |
          git submodule update --remote src/content/writing
          git add src/content/writing
          if git diff --cached --quiet; then
            echo "No content changes"
          else
            git commit -m "Auto-update content submodule"
            git push
          fi
```

## Phase 4: Testing and Validation

### 4.1 Local Testing Steps
**Tests to perform:**
1. Clone site fresh and verify submodule works
2. Test content updates propagate correctly  
3. Verify images load from submodule
4. Check article routing works
5. Validate build process includes submodule content

**Commands:**
```bash
# Test fresh clone
rm -rf test-clone
git clone --recursive https://github.com/meaningfool/meaningfool.github.io.git test-clone
cd test-clone
bun install
bun dev
# Visit localhost:4321 and verify content loads
```

### 4.2 Deployment Testing
**Tests to perform:**
1. Verify GitHub Actions handles submodules
2. Check deployed site includes submodule content
3. Test content update workflow end-to-end

**GitHub Actions considerations:**
- Ensure workflow uses `submodules: recursive`
- Check permissions allow submodule access
- Verify build process includes content from submodule

## Phase 5: Documentation and Maintenance

### 5.1 Update Documentation
**Actions:**
1. Update CLAUDE.md with submodule workflow
2. Document content editing process
3. Add troubleshooting guide

### 5.2 Common Operations Documentation
**Document these workflows:**

**Adding new content:**
```bash
cd meaningfool-writing
# Create new article
git add . && git commit -m "Add new article"
git push origin main

cd ../meaningfool.github.io
git submodule update --remote src/content/writing
git add src/content/writing
git commit -m "Update content"
git push origin main
```

**Troubleshooting submodules:**
```bash
# Reset submodule if stuck
git submodule deinit src/content/writing
git submodule init
git submodule update

# Force update submodule
git submodule update --remote --force src/content/writing
```

## Risk Assessment and Mitigation

### Potential Issues:
1. **Submodule not initialized on fresh clones**
   - Mitigation: Update GitHub Actions to use `--recursive`
   - Document clone command: `git clone --recursive`

2. **Content out of sync**
   - Mitigation: Clear workflow documentation
   - Consider automated updates

3. **Build failures if submodule missing**
   - Mitigation: Add fallback content or error handling
   - Test deployment thoroughly

4. **Permission issues accessing submodule**
   - Mitigation: Use public repository
   - Configure proper GitHub Actions permissions

### Testing Checklist:
- [ ] Fresh clone with `--recursive` works
- [ ] Content displays correctly on site
- [ ] Images load from submodule
- [ ] Build process completes successfully
- [ ] Deployment includes submodule content
- [ ] Content updates propagate to live site

## Success Criteria:
1. meaningfool-writing repository created and populated
2. Submodule successfully added to main site
3. Content renders correctly from submodule
4. Workflow for updating content is documented and tested
5. Site builds and deploys with submodule content
6. Team can edit content independently of site code

This plan provides a comprehensive approach to setting up content management via Git submodules, with clear steps for testing and validation at each phase.