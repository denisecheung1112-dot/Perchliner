# Deploying Perchliner to the Web

This guide will help you deploy Perchliner to the web with privacy settings (not searchable).

## Option 1: Deploy to Vercel (Recommended)

Vercel is free and provides automatic deployments from GitHub.

### Step 1: Push to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Perchliner game"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/perchliner.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will automatically detect the `vercel.json` configuration
5. Click "Deploy"
6. Your app will be live at `https://your-project-name.vercel.app`

### Step 3: Get Your Private Link

After deployment, Vercel will give you a unique URL. This is your private link that you can share with others. The app is:
- ✅ Not indexed by search engines (robots.txt + meta tags)
- ✅ Only accessible via direct link
- ✅ Editable - push changes to GitHub to auto-update

## Option 2: Deploy to Netlify

1. Go to [netlify.com](https://netlify.com) and sign up
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub repository
4. Build settings:
   - Build command: `npm run build:web`
   - Publish directory: `web-build`
5. Add environment variables (if needed)
6. Click "Deploy site"

## Option 3: Manual Build & Host Anywhere

```bash
# Build the web version
npm run build:web

# This creates a 'web-build' folder
# Upload this folder to any web hosting service
```

## Privacy Settings Applied

✅ `robots.txt` - Blocks all search engine crawlers
✅ Meta tags - `noindex, nofollow` 
✅ HTTP headers - `X-Robots-Tag: noindex, nofollow`
✅ App name updated to "Perchliner"

## Making Changes

1. Edit files locally
2. Test with: `npx expo start --web`
3. Commit and push to GitHub
4. Vercel/Netlify will automatically rebuild and deploy

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npx expo start --web

# Build for production
npm run build:web
```

