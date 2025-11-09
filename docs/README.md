# Gati Documentation

Beautiful documentation website built with [VitePress](https://vitepress.dev/).

## 🚀 Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Structure

```
docs/
├── .vitepress/
│   ├── config.ts         # VitePress configuration
│   └── theme/
│       ├── index.ts      # Theme customization
│       └── custom.css    # Custom styles
├── public/               # Static assets
│   ├── logo.svg
│   └── logo-large.svg
├── guide/                # User guides
│   ├── getting-started.md
│   ├── quick-start.md
│   ├── handlers.md
│   └── ...
├── api/                  # API reference
│   ├── handler.md
│   ├── request.md
│   └── ...
├── examples/             # Code examples
│   ├── hello-world.md
│   └── ...
└── index.md              # Homepage
```

## 📝 Writing Docs

### Adding a New Page

1. Create a markdown file in the appropriate directory
2. Add frontmatter if needed:

```markdown
---
title: My Page Title
description: Page description for SEO
---

# Page Content
```

3. Update `.vitepress/config.ts` to add the page to navigation

### Code Blocks

Use fenced code blocks with language specification:

````markdown
```typescript
import type { Handler } from '@gati-framework/core';

export const handler: Handler = (req, res) => {
  res.json({ message: 'Hello' });
};
```
````

### Custom Containers

```markdown
::: tip
This is a tip
:::

::: warning
This is a warning
:::

::: danger
This is a danger message
:::
```

### Linking

- Internal: `[Getting Started](/guide/getting-started)`
- External: `[GitHub](https://github.com/krishnapaul242/gati)`
- API Reference: `[Handler API](/api/handler)`

## 🎨 Customization

### Theme Colors

Edit `.vitepress/theme/custom.css`:

```css
:root {
  --vp-c-brand-1: #646cff;
  --vp-c-brand-2: #747bff;
  --vp-c-brand-3: #535bf2;
}
```

### Navigation

Edit `.vitepress/config.ts`:

```typescript
export default defineConfig({
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      // Add more...
    ]
  }
})
```

## 🚀 Deployment

Docs are automatically deployed to GitHub Pages when changes are pushed to `main`.

See `.github/workflows/deploy-docs.yml` for CI/CD configuration.

### Manual Deployment

```bash
# Build
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## 🔍 Search

Local search is enabled by default. Users can press `Ctrl+K` or `/` to search.

For better search, consider adding [Algolia DocSearch](https://docsearch.algolia.com/).

## 📊 Analytics

To add analytics, edit `.vitepress/config.ts`:

```typescript
export default defineConfig({
  head: [
    ['script', { 
      async: '', 
      src: 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX' 
    }]
  ]
})
```

## 🤝 Contributing

See [Contributing Guide](./contributing.md) for documentation guidelines.

## 📚 Resources

- [VitePress Documentation](https://vitepress.dev/)
- [Markdown Extensions](https://vitepress.dev/guide/markdown)
- [Theme Config](https://vitepress.dev/reference/default-theme-config)
