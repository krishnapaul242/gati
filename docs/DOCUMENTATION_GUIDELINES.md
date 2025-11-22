# Documentation Guidelines

## File Organization Rules

### ✅ All Documentation Must Live in `/docs`

**Rule:** All markdown documentation files MUST be created within the `/docs` directory structure.

**Rationale:**
- Centralized documentation management
- VitePress can properly index and build all docs
- Easier to maintain and navigate
- Better for version control and collaboration
- Consistent structure across the project

### Directory Structure

```
docs/
├── index.md                    # Homepage
├── onboarding/                 # Getting started guides
├── guides/                     # How-to guides
├── api-reference/              # API documentation
├── architecture/               # System design docs
├── examples/                   # Code examples
├── vision/                     # Vision and philosophy
├── changelog/                  # Version history
├── contributing/               # Contribution guides
└── project-docs/               # Internal project documentation
```

## Where to Place Different Types of Documentation

### User-Facing Documentation

**Location:** `docs/guides/`, `docs/onboarding/`, `docs/api-reference/`

**Examples:**
- Getting started tutorials
- Feature guides
- API references
- How-to articles
- Best practices

### Architecture & Design

**Location:** `docs/architecture/`

**Examples:**
- System design documents
- Technical specifications
- Design decisions
- Architecture diagrams

### Vision & Philosophy

**Location:** `docs/vision/`

**Examples:**
- Project vision
- Core philosophy
- Feature roadmap
- Long-term goals

### Examples & Tutorials

**Location:** `docs/examples/`

**Examples:**
- Code examples
- Tutorial walkthroughs
- Sample applications
- Use case demonstrations

### Changelog & Release Notes

**Location:** `docs/changelog/`

**Examples:**
- Version history
- Release notes
- Breaking changes
- Migration guides

### Contributing & Development

**Location:** `docs/contributing/`

**Examples:**
- Contributing guidelines
- Development setup
- Code standards
- Release process

### Internal Project Documentation

**Location:** `docs/project-docs/`

**Examples:**
- Feature registry
- Implementation summaries
- Project status reports
- Internal specifications

## ❌ What NOT to Do

### Don't Create MD Files in Root

**Bad:**
```
/
├── FEATURE_SUMMARY.md          # ❌ Wrong
├── IMPLEMENTATION_NOTES.md     # ❌ Wrong
├── STATUS_UPDATE.md            # ❌ Wrong
└── README.MD                   # ✅ Exception (required for GitHub/npm)
```

**Good:**
```
docs/
├── project-docs/
│   ├── feature-summary.md      # ✅ Correct
│   ├── implementation-notes.md # ✅ Correct
│   └── status-update.md        # ✅ Correct
└── README.md                   # ✅ Correct (if needed)
```

### Exceptions

Only these files should exist in the root:
- `README.MD` - Main project README (required for GitHub/npm)
- `LICENSE` - License file
- `CONTRIBUTING.md` - Quick link to contributing guide (optional, can redirect to docs)

## File Naming Conventions

### Use Kebab-Case

**Good:**
- `getting-started.md`
- `api-reference.md`
- `deployment-guide.md`

**Bad:**
- `GettingStarted.md`
- `API_Reference.md`
- `deployment_guide.md`

### Be Descriptive

**Good:**
- `aws-eks-deployment.md`
- `timescape-versioning.md`
- `handler-api-reference.md`

**Bad:**
- `aws.md`
- `versioning.md`
- `api.md`

## Markdown Standards

### Front Matter (Optional)

For VitePress pages, you can add front matter:

```markdown
---
title: Getting Started
description: Quick start guide for Gati
---

# Getting Started

Content here...
```

### Headers

- Use `#` for page title (only one per file)
- Use `##` for main sections
- Use `###` for subsections
- Don't skip header levels

### Links

**Internal Links (within docs):**
```markdown
[Getting Started](./onboarding/getting-started.md)
[API Reference](../api-reference/handler.md)
```

**External Links:**
```markdown
[GitHub](https://github.com/krishnapaul242/gati)
[npm](https://www.npmjs.com/package/@gati-framework/core)
```

### Code Blocks

Always specify the language:

```markdown
\`\`\`typescript
const handler: Handler = (req, res) => {
  res.json({ message: 'Hello' });
};
\`\`\`
```

### Status Indicators

Use emojis for status:
- ✅ Complete/Working
- 🚧 In Progress
- ⏳ Planned
- ❌ Deprecated/Removed

## VitePress Integration

### Adding New Pages

1. Create the markdown file in the appropriate `docs/` subdirectory
2. Update `docs/.vitepress/config.ts` sidebar configuration
3. Test locally: `cd docs && npm run dev`
4. Build to verify: `cd docs && npm run build`

### Sidebar Configuration

Edit `docs/.vitepress/config.ts`:

```typescript
sidebar: {
  '/guides/': [
    {
      text: 'Guides',
      items: [
        { text: 'New Guide', link: '/guides/new-guide' }
      ]
    }
  ]
}
```

## Documentation Review Checklist

Before committing documentation:

- [ ] File is in the correct `docs/` subdirectory
- [ ] File name uses kebab-case
- [ ] Headers are properly structured
- [ ] Links are working (no dead links)
- [ ] Code blocks have language specified
- [ ] Status indicators are accurate
- [ ] VitePress sidebar is updated (if needed)
- [ ] Documentation builds successfully
- [ ] Spelling and grammar checked

## Maintenance

### Regular Cleanup

- Remove outdated documentation
- Update status indicators
- Fix broken links
- Consolidate duplicate content
- Archive old implementation notes

### Version Documentation

When releasing new versions:
1. Update changelog in `docs/changelog/`
2. Update version numbers in examples
3. Add migration guides if needed
4. Update API references

## Questions?

If you're unsure where to place documentation:
1. Check this guide first
2. Look at similar existing documentation
3. Ask in GitHub Discussions
4. Create an issue for clarification

---

**Last Updated:** November 22, 2025  
**Maintained By:** Gati Core Team
