# Mantrika Games Website

A premium, responsive, SEO-optimized website built with Jekyll and configured for direct hosting on **GitHub Pages**.

Mantrika Games preserves cultural heritage by bringing ancient strategy board games from different cultures (e.g. Pallanguzhi, Nine Men's Morris, Bagh Bakri, Twelve Beads) into the modern digital world while offering beautiful handcrafted physical editions.

---

## Technical Stack & Design System

- **Core**: Jekyll 4.3.4 (supported on GitHub Pages)
- **Styling**: Modular SCSS (`_sass/`) with custom design tokens for Light and Dark modes.
- **Interactions**: Lightweight vanilla JavaScript (`assets/js/main.js`, `cursor-trail.js`, `hero-3d.js`) for CSS reveals, scroll-blurring navbar, cursor particle drawing, and perspective containers.
- **Colors**:
  - Warm Ivory (`#FAF8F3`)
  - Deep Walnut Brown (`#4E342E`)
  - Antique Gold (`#C89B3C`)
  - Charcoal (`#1F2937`)
  - Slate Gray (`#6B7280`)

---

## Directory Structure

```
_data/           # Metadata for featured games
_includes/       # Modular layout components (nav, footer, head, sections)
_layouts/        # Page shell structures (default, home)
_sass/           # Styling modules (base, variables, dark mode, custom sections)
assets/
  - css/main.scss # Main stylesheet compiler
  - js/          # Script interactions (Theme, cursors, scroll observer)
  - images/      # Handcrafted game graphics and logo assets
_config.yml      # Global Jekyll setting overrides
Gemfile          # Ruby dependencies
index.html       # Landing page entrypoint
404.html         # Centered error page
robots.txt       # Crawler mapping configuration
favicon.ico      # Tab brand favicon
```

---

## Local Development Setup

To run this project locally, ensure you have **Ruby (v3.0+)**, **Bundler**, and **Jekyll** installed.

1. **Install dependencies**:
   ```bash
   bundle install
   ```

2. **Launch the Jekyll server**:
   ```bash
   bundle exec jekyll serve
   ```

3. **Open browser**:
   Navigate to `http://localhost:4000` to inspect the website locally.

---

## GitHub Pages Deployment

The codebase uses zero unsupported gems, enabling standard automatic builds directly on GitHub.

1. Push this directory to your GitHub repository (e.g. `yourusername/mantrikagames`).
2. Go to your repository settings under the **Pages** tab.
3. Under **Build and deployment**, set the source to **Deploy from a branch** and select your main branch (e.g., `main` or `gh-pages`) pointing to `/ (root)`.
4. GitHub Actions will build and deploy your site within a minute.
