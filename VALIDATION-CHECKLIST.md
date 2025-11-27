# 🔍 Kupuri Studios Refactor - Validation Checklist

## ✅ Pre-Deployment Checklist

### **1. i18n Configuration**
- [x] Spanish (es-MX) locale files created (5 files)
- [x] Chinese (zh-CN) references removed from [`i18n/index.ts`](react/src/i18n/index.ts)
- [x] Language switcher will show English/Spanish only
- [ ] **TODO:** Test language switching in UI

### **2. Docker Configuration**
- [x] [`Dockerfile`](Dockerfile) created with multi-stage build
- [x] [`docker-compose.yml`](docker-compose.yml) configured
- [x] [`.dockerignore`](.dockerignore) optimized
- [x] Server updated to listen on `0.0.0.0`
- [ ] **TODO:** Test Docker build locally
  ```bash
  docker build -t kupuri-studios:test .
  docker run -p 8000:8000 kupuri-studios:test
  ```

### **3. UI/UX Components**
- [x] [`Hero.tsx`](react/src/components/landing/Hero.tsx) component created
- [x] Framer Motion animations implemented
- [x] Gradient utilities added to CSS
- [x] Home page updated with Hero
- [ ] **TODO:** Visual regression testing

### **4. Styling**
- [x] Global CSS utilities added (`.text-gradient`, `.bg-glow`)
- [x] Dark theme (`bg-slate-950`) applied
- [x] Glassmorphism on ChatTextarea
- [ ] **TODO:** Check responsiveness on mobile

### **5. Deployment Readiness**
- [x] [`DOCKER-DEPLOY.md`](DOCKER-DEPLOY.md) guide created
- [x] [`start.sh`](start.sh) quick-start script added
- [x] Environment variables documented
- [ ] **TODO:** Set up Hostinger VPS
- [ ] **TODO:** Configure Coolify deployment

---

## 🧪 Testing Checklist

### **Frontend**
```bash
cd react
npm install
npm run build  # Should complete without errors
npm run dev    # Test development server
```

### **Backend**
```bash
cd server
pip install -r requirements.txt
python main.py --port 8000  # Should start without errors
```

### **Docker**
```bash
# Build test
docker build -t kupuri-studios:test .

# Run test
docker run -d -p 8000:8000 --name kupuri-test kupuri-studios:test

# Check logs
docker logs -f kupuri-test

# Access app
curl http://localhost:8000

# Cleanup
docker stop kupuri-test && docker rm kupuri-test
```

### **Docker Compose**
```bash
docker-compose up -d
docker-compose logs -f
docker-compose down
```

---

## 🎨 Visual Inspection

### **Home Page**
- [ ] Hero section displays correctly
- [ ] Animated floating orbs visible
- [ ] Gradient text on "Unlimited" renders
- [ ] Beta badge with sparkle icon visible
- [ ] ChatTextarea has glassmorphism effect
- [ ] Projects list section below hero
- [ ] Dark theme consistent throughout

### **Language Switching**
- [ ] English strings display correctly
- [ ] Spanish strings display correctly
- [ ] No missing translation keys (check browser console)

---

## 🚀 Deployment Steps (Hostinger VPS)

1. **Initial Setup**
   ```bash
   # SSH into VPS
   ssh root@your-vps-ip

   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh

   # Install Docker Compose
   apt-get install docker-compose-plugin
   ```

2. **Clone & Deploy**
   ```bash
   git clone https://github.com/executiveusa/Kupuri-studios.git
   cd Kupuri-studios
   docker-compose up -d
   ```

3. **Configure Reverse Proxy (Nginx)**
   ```nginx
   server {
       listen 80;
       server_name kupuri.yourdomain.com;

       location / {
           proxy_pass http://localhost:8000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. **SSL Certificate (Let's Encrypt)**
   ```bash
   apt-get install certbot python3-certbot-nginx
   certbot --nginx -d kupuri.yourdomain.com
   ```

---

## 🔧 Troubleshooting

### **Issue: Docker build fails**
- Check Docker daemon is running
- Ensure sufficient disk space
- Review build logs for specific errors

### **Issue: Server doesn't start**
- Check port 8000 is not in use: `lsof -i :8000`
- Verify environment variables are set
- Check Python dependencies are installed

### **Issue: Frontend not loading**
- Verify React build completed: `ls -la react/dist/`
- Check `UI_DIST_DIR` environment variable
- Review server logs for static file errors

### **Issue: Language not switching**
- Clear browser localStorage
- Check i18n configuration in browser dev tools
- Verify locale JSON files exist

---

## 📊 Performance Benchmarks (Target)

- **Docker Image Size**: < 1.5GB
- **First Load Time**: < 3s
- **Hero Animation FPS**: > 30fps
- **API Response Time**: < 500ms

---

## 🎯 Beta Launch Checklist

- [ ] Docker image tested and pushed to registry
- [ ] VPS deployed and accessible
- [ ] Domain configured with SSL
- [ ] Beta testing link generated
- [ ] Feedback form/survey created
- [ ] Analytics configured (optional)
- [ ] Subscription system integrated (future)

---

**Last Updated:** November 27, 2025
**Refactor Version:** 1.0.0
**Status:** 🟢 Ready for Testing
