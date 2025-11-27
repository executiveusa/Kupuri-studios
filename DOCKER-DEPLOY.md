# Kupuri Studios - Docker Deployment Guide

## Building the Docker Image

```bash
docker build -t kupuri-studios:latest .
```

## Running with Docker

```bash
docker run -d \
  --name kupuri-studios \
  -p 8000:8000 \
  -e HOST=0.0.0.0 \
  -e PORT=8000 \
  kupuri-studios:latest
```

## Running with Docker Compose

```bash
docker-compose up -d
```

## Deploying to Coolify

1. Push your repository to GitHub
2. In Coolify dashboard, create a new resource
3. Select "Docker Compose" deployment
4. Point to your repository
5. Coolify will automatically detect the `docker-compose.yml` file
6. Configure environment variables if needed
7. Deploy!

## Environment Variables

- `HOST` - Server host (default: 0.0.0.0)
- `PORT` - Server port (default: 8000)
- `UI_DIST_DIR` - Path to React build directory (default: /app/react/dist)

## Hostinger VPS Setup

1. Install Docker and Docker Compose on your VPS
2. Clone the repository
3. Run `docker-compose up -d`
4. Configure reverse proxy (Nginx/Caddy) for domain mapping
5. Set up SSL with Let's Encrypt

## Health Check

The container includes a health check that pings the root endpoint every 30 seconds.
