# Recording Guide - Todo API

## Quick Start

### Option 1: Automated Console Recording (Recommended)
```bash
pnpm test:record
```
Output saved to: `test-session.log`

### Option 2: Manual PowerShell Demo
```powershell
# Terminal 1: Start server
pnpm dev

# Terminal 2: Run demo
.\test-demo.ps1
```

### Option 3: Browser Recording
1. Start server: `pnpm dev`
2. Open browser + DevTools
3. Record with ScreenToGif
4. Follow `DEMO_SCRIPT.md`

---

## Tools Available

### Console Recording
✅ **Automated Script** - `pnpm test:record`
- Starts server
- Runs all tests
- Saves output
- Stops server

✅ **PowerShell Demo** - `.\test-demo.ps1`
- Colored output
- Formatted JSON
- Pauses between tests
- Error handling

✅ **Manual Commands** - See `DEMO_SCRIPT.md`
- Copy/paste commands
- Full control
- Best for live demo

### Browser Recording
✅ **ScreenToGif** - https://www.screentogif.com/
- Free, Windows
- Easy to use
- Export as GIF

✅ **Windows Game Bar** - Win+G
- Built-in
- Records video
- No install needed

---

## Recording Checklist

### Before Recording
- [ ] Server starts successfully
- [ ] All tests pass
- [ ] Terminal font size readable
- [ ] Colors visible
- [ ] Window size appropriate

### During Recording
- [ ] Show server starting
- [ ] Run all 9 tests
- [ ] Show responses clearly
- [ ] Highlight key features
- [ ] Show error handling

### After Recording
- [ ] Trim unnecessary parts
- [ ] Add captions (optional)
- [ ] Export as GIF/MP4
- [ ] Test file size (<5MB for GIF)

---

## What to Record

### Console Session (30 seconds)
1. Start server (5s)
2. Create 2 todos (5s)
3. List todos (3s)
4. Update todo (3s)
5. Delete todo (3s)
6. Show final state (3s)
7. Error handling (5s)
8. Stop server (3s)

### Browser Session (30 seconds)
1. Open DevTools (2s)
2. Show Network tab (3s)
3. POST /todos (5s)
4. GET /todos (5s)
5. PUT /todos/:id (5s)
6. DELETE /todos/:id (5s)
7. Show 404 error (5s)

---

## File Outputs

After recording, you'll have:
- `test-session.log` - Console output
- `preview.gif` - Browser demo
- `demo.mp4` - Full recording (optional)

---

## Next Steps

1. Run automated test: `pnpm test:record`
2. Review `test-session.log`
3. Record browser with ScreenToGif
4. Create preview GIF
5. Update PLAN.md
