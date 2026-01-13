# Todo API - Media Creation Guide

## 1. Preview GIF Creation

### Option A: Browser Testing (Recommended)
**Tool:** [ScreenToGif](https://www.screentogif.com/) (Free, Windows)

**Steps:**
1. Start dev server: `pnpm dev`
2. Open browser DevTools (F12)
3. Open ScreenToGif → Record
4. Perform actions:
   - POST /api/todos (create todo)
   - GET /api/todos (list todos)
   - PUT /api/todos/:id (update)
   - DELETE /api/todos/:id (delete)
5. Stop recording → Edit → Export as GIF
6. Save as `preview-browser.gif`

**Alternative Tools:**
- [LICEcap](https://www.cockos.com/licecap/) (Free, cross-platform)
- [Kap](https://getkap.co/) (Free, macOS)
- [Peek](https://github.com/phw/peek) (Free, Linux)

### Option B: Terminal/Playground
**Tool:** [asciinema](https://asciinema.org/) + [agg](https://github.com/asciinema/agg)

**Steps:**
```bash
# Install asciinema
npm install -g asciinema

# Record terminal session
asciinema rec todo-api-demo.cast

# Run commands
pnpm dev
# In another terminal:
pnpm test:api

# Stop recording (Ctrl+D)

# Convert to GIF
agg todo-api-demo.cast preview-terminal.gif
```

### Option C: Automated Screenshot
**Tool:** Puppeteer script

Create `scripts/create-gif.js`:
```javascript
const puppeteer = require('puppeteer');
const GIFEncoder = require('gifencoder');
const { createCanvas } = require('canvas');

async function createGif() {
  const browser = await puppeteer.launch();
  const page = await page.newPage();
  
  // Navigate and capture screenshots
  await page.goto('http://localhost:3000/api/todos');
  // ... capture frames
  
  // Encode to GIF
  // ... encoding logic
}
```

---

## 2. Video Walkthrough (5 min)

### Option A: Screen Recording (Recommended)
**Tool:** [OBS Studio](https://obsproject.com/) (Free, cross-platform)

**Script:**
```
[0:00-0:30] Introduction
- "Hi, I'm showing the Todo API example"
- "This demonstrates Gati fundamentals"

[0:30-1:30] Project Structure
- Show file tree
- Explain handlers directory
- Show gati.config.ts

[1:30-2:30] Code Walkthrough
- Open todos.ts handler
- Explain GET/POST logic
- Show storage module usage

[2:30-4:00] Live Demo
- Start dev server
- Use Postman/Insomnia to test endpoints
- Create, list, update, delete todos

[4:00-5:00] Testing & Wrap-up
- Run unit tests
- Show test results
- Next steps
```

**Recording Settings:**
- Resolution: 1920x1080
- FPS: 30
- Format: MP4
- Audio: Optional (voiceover)

**Alternative Tools:**
- [Loom](https://www.loom.com/) (Free tier, web-based)
- Windows Game Bar (Win+G, built-in)
- QuickTime (macOS, built-in)

### Option B: Automated Video
**Tool:** [Playwright](https://playwright.dev/) + FFmpeg

```javascript
// scripts/record-demo.js
const { chromium } = require('playwright');

async function recordDemo() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: { dir: 'videos/' }
  });
  
  const page = await context.newPage();
  // Automate demo steps
  await page.goto('http://localhost:3000/api/todos');
  // ... more steps
  
  await context.close();
}
```

---

## 3. Public Release

### GitHub Release
**Steps:**
1. Create release branch:
```bash
git checkout -b release/todo-api-v1.0.0
git add examples/todo-api/
git commit -m "feat(examples): add Todo API beginner example"
git push origin release/todo-api-v1.0.0
```

2. Create GitHub Release:
- Go to GitHub → Releases → New Release
- Tag: `examples/todo-api-v1.0.0`
- Title: "Todo API - Beginner Example v1.0.0"
- Description: Copy from README.md
- Attach: preview.gif, demo.mp4
- Publish

### NPM Package (Optional)
**If creating standalone package:**

```json
{
  "name": "@gati-examples/todo-api",
  "version": "1.0.0",
  "description": "Todo API - Gati Beginner Example",
  "keywords": ["gati", "example", "todo", "api"],
  "repository": "github:krishnapaul242/gati",
  "license": "MIT"
}
```

```bash
npm publish --access public
```

### Documentation Site
**Add to docs/examples/:**

Create `docs/examples/todo-api.md`:
```markdown
# Todo API Example

![Preview](./assets/todo-api-preview.gif)

[View Source](https://github.com/krishnapaul242/gati/tree/main/examples/todo-api)
[Watch Video](https://youtube.com/...)

## Quick Start
\`\`\`bash
npx gatic create my-todo-api --template todo-api
cd my-todo-api
pnpm dev
\`\`\`
```

### Social Media Announcement
**Twitter/X Post:**
```
🚀 New Gati Example: Todo API

Learn Gati fundamentals:
✅ CRUD operations
✅ File-based routing
✅ Module usage
✅ 9 passing tests

Perfect for beginners!

📖 Docs: [link]
💻 Code: [link]
🎥 Video: [link]

#Gati #TypeScript #API
```

**Dev.to Article:**
```markdown
---
title: Building a Todo API with Gati Framework
published: true
tags: gati, typescript, api, tutorial
---

# Building a Todo API with Gati Framework

In this tutorial, we'll build a simple Todo API...

[Full article with code examples]
```

---

## Quick Start Checklist

### For Preview GIF:
- [ ] Install ScreenToGif
- [ ] Start dev server
- [ ] Record 30-second demo
- [ ] Export as GIF (max 5MB)
- [ ] Save to `examples/todo-api/preview.gif`

### For Video:
- [ ] Install OBS Studio
- [ ] Write script (5 min)
- [ ] Record walkthrough
- [ ] Edit (trim, add captions)
- [ ] Upload to YouTube
- [ ] Add link to README

### For Release:
- [ ] Create release branch
- [ ] Tag version
- [ ] Create GitHub Release
- [ ] Add to documentation site
- [ ] Announce on social media

---

## Automation Script

Create `scripts/prepare-release.sh`:
```bash
#!/bin/bash

APP_NAME="todo-api"
VERSION="1.0.0"

echo "Preparing release for $APP_NAME v$VERSION..."

# 1. Run tests
cd examples/$APP_NAME
pnpm test

# 2. Create GIF (if tool installed)
if command -v screentogif &> /dev/null; then
  echo "Create GIF manually with ScreenToGif"
fi

# 3. Create release branch
git checkout -b release/$APP_NAME-v$VERSION

# 4. Commit
git add .
git commit -m "feat(examples): release $APP_NAME v$VERSION"

# 5. Push
git push origin release/$APP_NAME-v$VERSION

echo "✅ Release prepared!"
echo "Next steps:"
echo "1. Create preview GIF"
echo "2. Record video walkthrough"
echo "3. Create GitHub Release"
echo "4. Update documentation"
```

---

## Recommended Workflow

**For each example app:**

1. **Development** (Day 1-2)
   - Write code
   - Write tests
   - Test with published packages

2. **Media Creation** (Day 2, 2-3 hours)
   - Record GIF (30 min)
   - Record video (1 hour)
   - Edit and export (1 hour)

3. **Release** (Day 2, 1 hour)
   - Create release branch
   - GitHub Release
   - Update docs
   - Social media post

**Total time per app:** 2 days + 4 hours media/release

---

## Tools Summary

| Task | Tool | Cost | Platform |
|------|------|------|----------|
| GIF (Browser) | ScreenToGif | Free | Windows |
| GIF (Terminal) | asciinema + agg | Free | All |
| Video | OBS Studio | Free | All |
| Video (Quick) | Loom | Free tier | Web |
| Editing | DaVinci Resolve | Free | All |
| Hosting | YouTube | Free | Web |

---

## Next Steps

1. Choose tools based on your platform
2. Create preview GIF for Todo API
3. Record 5-minute walkthrough
4. Prepare GitHub Release
5. Move to App 1.2 (Weather API)
