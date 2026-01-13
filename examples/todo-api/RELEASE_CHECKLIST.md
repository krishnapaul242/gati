# Todo API - Release Checklist

## Pre-Release

- [x] Code complete
- [x] Tests passing (9/9)
- [x] README written
- [x] Tested with published packages
- [ ] Preview GIF created
- [ ] Video walkthrough recorded

## Media Creation

### Preview GIF (Choose one method)

**Method 1: Manual (Recommended)**
1. Install [ScreenToGif](https://www.screentogif.com/)
2. Start: `pnpm dev`
3. Record browser demo (30 sec)
4. Save as `preview.gif`

**Method 2: Automated**
```bash
npm install puppeteer puppeteer-screen-recorder
node scripts/create-demo-gif.js
ffmpeg -i demo.mp4 -vf "fps=10,scale=800:-1" preview.gif
```

**Method 3: Terminal**
```bash
npm install -g asciinema
asciinema rec demo.cast
# Run: pnpm test:api
# Stop: Ctrl+D
agg demo.cast preview.gif
```

### Video Walkthrough (5 min)

**Script:**
- 0:00-0:30: Intro
- 0:30-1:30: Project structure
- 1:30-2:30: Code walkthrough
- 2:30-4:00: Live demo
- 4:00-5:00: Tests & wrap-up

**Tools:**
- [OBS Studio](https://obsproject.com/) (Free)
- [Loom](https://www.loom.com/) (Free tier)
- Windows Game Bar (Win+G)

**Upload to:**
- YouTube (unlisted)
- Add link to README

## Release Steps

### 1. Create Release Branch
```bash
git checkout -b release/todo-api-v1.0.0
git add examples/todo-api/
git commit -m "feat(examples): add Todo API beginner example"
git push origin release/todo-api-v1.0.0
```

### 2. Create GitHub Release
- Tag: `examples/todo-api-v1.0.0`
- Title: "Todo API - Beginner Example v1.0.0"
- Description:
```markdown
# Todo API - Beginner Example

A simple Todo API demonstrating Gati fundamentals.

## Features
- ✅ CRUD operations
- ✅ File-based routing
- ✅ In-memory storage
- ✅ 9 passing tests

## Quick Start
\`\`\`bash
cd examples/todo-api
pnpm install
pnpm dev
\`\`\`

## Learn More
- [README](./README.md)
- [Video Walkthrough](https://youtube.com/...)
```

- Attach: `preview.gif`

### 3. Update Documentation

Add to `docs/examples/README.md`:
```markdown
## Beginner Examples

### [Todo API](./todo-api.md)
![Preview](../assets/todo-api-preview.gif)

Learn Gati fundamentals with a simple CRUD API.

- **Level:** Beginner
- **Time:** 30 minutes
- **Topics:** Routing, Modules, Testing
```

### 4. Social Media

**Twitter/X:**
```
🚀 New Gati Example: Todo API

Perfect for beginners learning Gati!

✅ CRUD operations
✅ File-based routing  
✅ Module usage
✅ 9 passing tests

📖 https://github.com/krishnapaul242/gati/tree/main/examples/todo-api
🎥 [video link]

#Gati #TypeScript #API
```

**Dev.to:**
- Write tutorial article
- Include code snippets
- Add preview GIF
- Link to repo

## Post-Release

- [ ] Monitor GitHub issues
- [ ] Respond to questions
- [ ] Collect feedback
- [ ] Plan improvements

## Metrics to Track

- GitHub stars
- Example clones
- Video views
- Article reads
- Issues/questions

## Next Example

Move to App 1.2 (Weather API)
