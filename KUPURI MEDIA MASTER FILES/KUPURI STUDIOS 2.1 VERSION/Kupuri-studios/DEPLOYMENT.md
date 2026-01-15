# Kupuri Studios - Deployment & Build Guide

## Quick Start

### Local Development
```bash
cd react
npm install
npm run dev
```

### Production Build
```bash
cd react
npm install
npm run build
npm start
```

## Docker Deployment

### Build Docker Image
```bash
docker build -t kupuri-studios:latest .
```

### Run Docker Container
```bash
docker run -p 3000:3000 \
  -e VITE_API_BASE_URL=http://api:8000 \
  -e NODE_ENV=production \
  kupuri-studios:latest
```

## Cloud Platform Deployment

### Vercel
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Railway
1. Connect GitHub repository
2. Set environment variables in Railway dashboard
3. Railway auto-detects Next.js and deploys

### Coolify (Self-Hosted)
1. Push this repo to GitHub
2. In Coolify, create new application
3. Connect GitHub repo and select branch
4. Set environment variables in Coolify UI
5. Deploy

### Hostinger VPS
1. SSH into your server
2. Clone repository: `git clone https://github.com/executiveusa/Kupuri-studios.git`
3. Install dependencies: `npm install` (in react folder)
4. Build: `npm run build`
5. Use process manager (PM2) or systemd to run: `npm start`

## Environment Variables

All environment variables are optional and use sensible defaults. Override as needed:

- `VITE_API_BASE_URL` - Backend API endpoint (default: http://localhost:8000)
- `VITE_PUBLIC_POSTHOG_KEY` - PostHog analytics key (optional)
- `NODE_ENV` - Set to "production" for optimized builds

## Performance Optimization

- Images are optimized with Next.js Image component
- CSS is tree-shaken automatically by Tailwind
- JavaScript is minified in production builds
- Use CDN for static assets in production

## Monitoring & Logging

Check application logs:
```bash
# Docker
docker logs <container-id>

# PM2
pm2 logs kupuri-studios

# Systemd
journalctl -u kupuri-studios -f
```

## Troubleshooting

**Issue:** API requests failing  
**Solution:** Verify `VITE_API_BASE_URL` matches your backend address

**Issue:** Styles not loading  
**Solution:** Clear `.next` and `node_modules`, rebuild

**Issue:** Images not displaying  
**Solution:** Ensure Next.js Image optimization is enabled and check image paths

## Support

For issues, check GitHub repository or contact the team.
