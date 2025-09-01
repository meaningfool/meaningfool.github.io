# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **Astro** static site generator project set up for `meaningfool.github.io`. The project appears to be a GitHub Pages personal website that was recently initialized from the Astro "basics" template.

**Project Name:** solar-star  
**Framework:** Astro v5.13.5  
**Package Manager:** Bun  
**Language:** TypeScript/JavaScript  

## Common Commands

### Development Commands

```bash
# Install dependencies
bun install

# Start development server (runs on localhost:4321)
bun dev

# Build for production (outputs to ./dist/)
bun build

# Preview production build locally
bun preview

# Run Astro CLI commands
bun astro <command>

# Get help with Astro CLI
bun astro -- --help
```

### Git Commands

```bash
# Check current status (uncommitted files)
git status

# Stage all changes
git add .

# Commit changes
git commit -m "Your commit message"

# Push to GitHub
git push origin main
```

## High-Level Architecture

### Directory Structure

```
meaningfool.github.io/
├── public/                 # Static assets served as-is
│   └── favicon.svg        # Site favicon
├── src/                   # Source code
│   ├── assets/           # Images and assets (processed by Astro)
│   │   ├── astro.svg
│   │   └── background.svg
│   ├── components/       # Reusable Astro components
│   │   └── Welcome.astro # Welcome component (starter template)
│   ├── layouts/          # Page layouts
│   │   └── Layout.astro  # Base HTML layout
│   └── pages/            # File-based routing
│       └── index.astro   # Homepage (/)
├── .gitignore            # Git ignore rules
├── astro.config.mjs      # Astro configuration
├── bun.lock              # Bun package lock file
├── package.json          # Project dependencies and scripts
├── README.md             # Project documentation
└── tsconfig.json         # TypeScript configuration
```

### Key Architectural Patterns

1. **Component-Based Architecture**
   - Astro uses `.astro` files which combine markup, styles, and scripts
   - Components can import and use other components
   - Supports component-scoped CSS

2. **File-Based Routing**
   - Pages in `src/pages/` automatically become routes
   - `index.astro` → `/`
   - Additional pages can be added as new `.astro` files

3. **Layout System**
   - `Layout.astro` provides the base HTML structure
   - Uses slots for content injection
   - Handles common meta tags and document structure

4. **Static Asset Handling**
   - `public/` directory for static assets (served as-is)
   - `src/assets/` for assets that need processing

### Current Implementation

The site currently displays a welcome page with:
- Astro logo and branding
- Links to documentation and Discord
- "What's New in Astro 5.0?" announcement box
- Responsive design with mobile breakpoints

### Configuration Files

1. **astro.config.mjs**
   - Currently using default configuration
   - Can be extended for site-specific settings, integrations, etc.

2. **tsconfig.json**
   - Extends Astro's strict TypeScript configuration
   - Includes all project files except `dist/`

3. **package.json**
   - Minimal dependencies (only Astro)
   - Type: "module" (ES modules)
   - Version: 0.0.1

### Build Output

- Production builds output to `./dist/` directory
- This directory is gitignored
- Contains optimized HTML, CSS, and JavaScript files

### Development Workflow

1. **Local Development**
   - Run `bun dev` to start the development server
   - Hot module replacement (HMR) enabled
   - Changes reflect immediately in the browser

2. **Building for Production**
   - Run `bun build` to create optimized production files
   - Run `bun preview` to test the production build locally

3. **GitHub Pages Deployment**
   - **Automatic Deployment**: This repository uses GitHub Actions for automatic deployment
   - Every push to the `main` branch triggers a deployment workflow
   - The workflow uses Bun to install dependencies and build the site
   - Built files are automatically deployed to GitHub Pages
   
   **To enable GitHub Pages:**
   1. Go to Settings → Pages in your GitHub repository
   2. Under "Source", select "GitHub Actions"
   3. The site will be available at https://meaningfool.github.io/
   
   **Manual Deployment:**
   - You can also trigger deployment manually from the Actions tab
   - The workflow file is located at `.github/workflows/deploy.yml`

### Next Steps for Development

1. **Customize the Homepage**
   - Edit `src/pages/index.astro`
   - Modify or replace the Welcome component

2. **Update Site Metadata**
   - Change the title in `Layout.astro`
   - Update favicon in `public/`

3. **Add New Pages**
   - Create new `.astro` files in `src/pages/`
   - They'll automatically become routes

4. **Create Custom Components**
   - Add new components to `src/components/`
   - Import and use them in pages

5. **Configure for GitHub Pages**
   - ✅ `astro.config.mjs` is already configured with correct site and base settings
   - ✅ GitHub Actions workflow is set up for automatic deployment

### Technology Stack

- **Astro**: Static site generator with component islands architecture
- **TypeScript**: For type safety (optional but configured)
- **Bun**: JavaScript runtime and package manager
- **HTML/CSS**: For markup and styling
- **JavaScript**: For interactivity (as needed)

This project provides a solid foundation for building a personal website or blog with modern web technologies while maintaining excellent performance through static site generation.