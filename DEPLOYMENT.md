# Deployment Guide

This project can be deployed to Vercel (recommended) or GitHub Pages. Both are free and easy to use.

## Option 1: Deploy to Vercel (Recommended - Easiest)

Vercel is the easiest option for non-technical users. It automatically deploys when you push to GitHub.

### Steps:

1. **Make sure your code is on GitHub:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Go to Vercel:**
   - Visit [vercel.com](https://vercel.com)
   - Sign up/login with your GitHub account

3. **Import your project:**
   - Click "Add New..." → "Project"
   - Select your GitHub repository
   - Vercel will auto-detect it's a Vite project
   - Click "Deploy"

4. **That's it!** Vercel will:
   - Build your project automatically
   - Give you a live URL (like `your-project.vercel.app`)
   - Auto-deploy whenever you push to GitHub

### Custom Domain (Optional):
- In Vercel dashboard, go to your project → Settings → Domains
- Add your custom domain if you have one

---

## Option 2: Deploy to GitHub Pages

GitHub Pages is free and works well, but requires a bit more setup.

### Steps:

1. **Install GitHub Pages plugin:**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Update package.json:**
   Add these scripts:
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```

3. **Update vite.config.js:**
   Add base path:
   ```js
   export default defineConfig({
     base: '/your-repo-name/',
     plugins: [react()],
   })
   ```

4. **Deploy:**
   ```bash
   npm run deploy
   ```

5. **Enable GitHub Pages:**
   - Go to your GitHub repo → Settings → Pages
   - Source: Select "gh-pages" branch
   - Your site will be at: `https://yourusername.github.io/your-repo-name/`

---

## Which Should You Choose?

- **Vercel**: Best for non-technical users, automatic deployments, custom domains, faster
- **GitHub Pages**: Free, but requires more manual steps, good if you want everything on GitHub

**Recommendation: Use Vercel** - it's simpler and faster!

