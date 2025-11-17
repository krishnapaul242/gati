# 🚀 Enabling GitHub Pages Deployment

Follow these steps to deploy your Gati documentation site to GitHub Pages.

## Prerequisites

- ✅ Documentation site created (you've already done this!)
- ✅ GitHub Actions workflow configured (`.github/workflows/deploy-docs.yml`)
- ✅ Changes committed to the repository

## Step 1: Enable GitHub Pages

1. **Go to your repository on GitHub**
   - Navigate to: https://github.com/krishnapaul242/gati

2. **Open Settings**
   - Click the **Settings** tab (top navigation)

3. **Navigate to Pages**
   - In the left sidebar, scroll down and click **Pages**

4. **Configure Source**
   - Under "Build and deployment"
   - **Source:** Select **GitHub Actions** from dropdown
   - (Previously it might be set to "Deploy from a branch")

5. **Save**
   - GitHub will automatically save the change
   - No "Save" button needed

## Step 2: Trigger Deployment

### Option A: Push to Main (Recommended)

The workflow is configured to run automatically when you push docs changes:

```bash
git add docs/
git commit -m "docs: add beautiful VitePress documentation site"
git push origin main
```

### Option B: Manual Trigger

1. Go to **Actions** tab on GitHub
2. Select **Deploy Documentation** workflow
3. Click **Run workflow** dropdown
4. Click **Run workflow** button

## Step 3: Wait for Deployment

1. **Monitor Progress**
   - Go to **Actions** tab
   - Watch the workflow run (usually takes 1-2 minutes)

2. **Check Status**
   - ✅ Green checkmark = Success
   - ❌ Red X = Failed (check logs)

3. **View Deployment**
   - Once complete, your site will be live at:
   - https://krishnapaul242.github.io/gati/

## Step 4: Verify Site is Live

1. **Visit the URL**
   ```
   https://krishnapaul242.github.io/gati/
   ```

2. **Check Key Pages**
   - Homepage with hero section
   - `/guide/getting-started`
   - `/guide/quick-start`
   - `/api/handler`
   - `/examples/hello-world`

3. **Test Features**
   - Navigation works
   - Search works (Ctrl+K or /)
   - Dark mode toggle works
   - Mobile responsive
   - Code blocks are highlighted

## Troubleshooting

### Issue: 404 Page Not Found

**Cause:** Base URL configuration

**Fix:** Check `.vitepress/config.ts`:

```typescript
export default defineConfig({
  base: '/gati/',  // Must match repo name
  // ...
})
```

### Issue: Workflow Failed

**Common Causes:**

1. **Missing Permissions**
   - Go to Settings → Actions → General
   - Scroll to "Workflow permissions"
   - Select "Read and write permissions"
   - Check "Allow GitHub Actions to create and approve pull requests"
   - Click Save

2. **Branch Protection**
   - Ensure GitHub Actions can deploy to `gh-pages` branch
   - No branch protection rules blocking deployment

3. **Build Errors**
   - Check workflow logs in Actions tab
   - Look for TypeScript errors or missing dependencies

### Issue: Styles Not Loading

**Cause:** Incorrect asset paths

**Fix:** All assets should be in `docs/public/` and referenced with absolute paths:

```markdown
![Logo](/gati/gati.png)
<!-- NOT: ![Logo](./gati.png) -->
```

### Issue: Search Not Working

**Cause:** Search index not built

**Fix:** Local search is automatically configured. If it's not working:

1. Clear browser cache
2. Rebuild site: `npm run build`
3. Check console for errors

## Updating Documentation

After initial setup, updates are automatic:

```bash
# Make changes to markdown files
vim docs/guide/new-guide.md

# Commit and push
git add docs/
git commit -m "docs: add new guide"
git push origin main

# GitHub Actions automatically rebuilds and deploys
# Site updates in 1-2 minutes
```

## Custom Domain (Optional)

To use a custom domain (e.g., `docs.gati.dev`):

1. **Add CNAME file**
   ```bash
   echo "docs.gati.dev" > docs/public/CNAME
   ```

2. **Update base in config**
   ```typescript
   // .vitepress/config.ts
   export default defineConfig({
     base: '/',  // Change from '/gati/' to '/'
   })
   ```

3. **Configure DNS**
   - Add CNAME record: `docs.gati.dev` → `krishnapaul242.github.io`

4. **Enable HTTPS in GitHub Settings**
   - Settings → Pages → Enforce HTTPS ✅

## Monitoring

### Analytics (Optional)

Add Google Analytics to `.vitepress/config.ts`:

```typescript
export default defineConfig({
  head: [
    [
      'script',
      { async: '', src: 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX' }
    ],
    [
      'script',
      {},
      `window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-XXXXXXXXXX');`
    ]
  ]
})
```

### Uptime Monitoring (Optional)

Use free services:
- [UptimeRobot](https://uptimerobot.com/)
- [Pingdom](https://www.pingdom.com/)
- [StatusCake](https://www.statuscake.com/)

## Next Steps

✅ **Documentation is now live!**

Recommended actions:

1. **Share the URL**
   - Add to README.md
   - Tweet about it
   - Share in communities

2. **Add More Content**
   - Complete API reference
   - Add more examples
   - Write guides

3. **Improve SEO**
   - Add meta descriptions
   - Create sitemap
   - Submit to search engines

4. **Gather Feedback**
   - Add feedback widget
   - Monitor analytics
   - Iterate based on usage

---

**Questions?** Check the [VitePress deployment docs](https://vitepress.dev/guide/deploy#github-pages) or [create an issue](https://github.com/krishnapaul242/gati/issues).

🎉 **Happy documenting!**
