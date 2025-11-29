# 🚀 Kupuri Studios - Coolify Deployment Guide

## ✅ Pre-Deployment Checklist

### Files Created

- ✅ `Dockerfile` - Multi-stage build with nginx
- ✅ `nginx.conf` - SPA routing + security headers
- ✅ `.dockerignore` - Optimized build context
- ✅ `.coolify` - Coolify configuration
- ✅ `DEPLOYMENT_CHECKLIST.md` - Complete deployment guide

### Git Status

- ✅ All files committed
- ✅ Pushed to origin/main
- ✅ Ready for Coolify deployment

---

## 🐳 Coolify Deployment Steps

### 1. Create New Resource in Coolify

1. Log into your Coolify dashboard
2. Click **"+ New Resource"**
3. Select **"Public Repository"**
4. Enter your repository URL:
   ```
   https://github.com/YOUR_USERNAME/kupuri-studios.git
   ```
5. Select branch: `main`
6. Set build pack: **Dockerfile**
7. Set Dockerfile location: `react/Dockerfile`

### 2. Configure Environment Variables

In Coolify dashboard, add these environment variables:

```bash
# API Configuration
VITE_API_URL=https://api.kupuristudios.com

# Stripe (Production)
VITE_STRIPE_PUBLIC_KEY=pk_live_...

# Optional: Analytics
VITE_GA_TRACKING_ID=G-...
```

### 3. Configure Build Settings

- **Build Command**: `npm run build` (handled by Dockerfile)
- **Port**: `80`
- **Health Check Path**: `/health`
- **Dockerfile Path**: `react/Dockerfile`

### 4. Deploy

1. Click **"Deploy"**
2. Monitor build logs
3. Wait for "Deployment successful" message
4. Access your app at the provided URL

---

## 🔧 Docker Build Locally (Testing)

Test the Docker build before deploying:

```bash
# Navigate to react directory
cd react

# Build the image
docker build -t kupuri-studios:latest .

# Run locally
docker run -p 8080:80 kupuri-studios:latest

# Test in browser
open http://localhost:8080
```

---

## 📊 Expected Build Output

```
✓ Building Docker image...
✓ Installing dependencies (npm ci --legacy-peer-deps)
✓ Building Vite app (npm run build)
✓ Copying to nginx
✓ Image size: ~150MB (compressed)
✓ Health check: PASSING
```

---

## 🌐 Post-Deployment Verification

### 1. Health Check

```bash
curl https://your-app.coolify.io/health
# Expected: "healthy"
```

### 2. Landing Page

- Visit: `https://your-app.coolify.io`
- Verify: Parallax hero loads
- Check: Navbar glassmorphism effect
- Test: Pricing cards animation

### 3. Canvas

- Navigate to: `https://your-app.coolify.io/canvas/test`
- Verify: Floating header appears
- Check: Tool dock at bottom
- Test: Ghost element on Cmd+B

### 4. Mobile

- Open DevTools (F12)
- Toggle device toolbar (Cmd+Shift+M)
- Resize to 375px width
- Verify: Chat FAB appears
- Test: Bottom sheet opens

---

## 🔐 Security Checklist

- ✅ Nginx security headers configured
- ✅ Gzip compression enabled
- ✅ Static asset caching (1 year)
- ✅ Health check endpoint
- ⚠️ **TODO**: Configure SSL/TLS in Coolify
- ⚠️ **TODO**: Set up Stripe webhooks

---

## 🐛 Troubleshooting

### Build Fails: "peer dependency conflict"

**Solution**: Already fixed with `--legacy-peer-deps` flag

### Build Fails: "Cannot find module"

**Solution**: Ensure `package.json` is in `react/` directory

### Nginx 404 on routes

**Solution**: Already configured in `nginx.conf` with `try_files`

### Health check failing

**Solution**: Verify nginx is running:

```bash
docker exec -it <container> nginx -t
```

### Large bundle size warning

**Expected**: Canvas app includes Excalidraw (~1.8MB uncompressed, 737KB gzipped)

---

## 📈 Performance Optimization (Post-Launch)

### 1. CDN Setup

- Configure Cloudflare in front of Coolify
- Enable auto-minify for JS/CSS/HTML
- Enable Brotli compression

### 2. Code Splitting

```typescript
// Lazy load canvas route
const Canvas = lazy(() => import('./routes/canvas.$id'))
```

### 3. Image Optimization

- Replace PNGs with WebP
- Use responsive images with `srcset`
- Implement lazy loading for showcase grid

---

## 🔄 Continuous Deployment

Coolify auto-deploys on git push:

```bash
# Make changes
git add .
git commit -m "feat: new feature"
git push origin main

# Coolify automatically:
# 1. Detects push
# 2. Pulls latest code
# 3. Rebuilds Docker image
# 4. Deploys with zero downtime
```

---

## 📞 Support

### Coolify Issues

- Docs: https://coolify.io/docs
- Discord: https://coolify.io/discord

### App Issues

- Check build logs in Coolify dashboard
- Review `DEPLOYMENT_CHECKLIST.md`
- Verify environment variables are set

---

## 🎉 Success Criteria

Your deployment is successful when:

- ✅ Health check returns "healthy"
- ✅ Landing page loads with animations
- ✅ Canvas opens and renders
- ✅ Ghost elements appear on generation
- ✅ Mobile FAB works
- ✅ No console errors

---

**Status**: 🚀 READY TO DEPLOY

Built with precision. Deployed with confidence.
