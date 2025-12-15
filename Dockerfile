# Stage 1: Build React Frontend
FROM node:20-alpine as frontend-build
WORKDIR /app/react

# Copy package files and install dependencies
COPY react/package*.json ./
RUN npm ci --legacy-peer-deps

# Copy React source code
COPY react/ .

# Build the React app (output goes to react/dist)
RUN npm run build

# Stage 2: Python Backend
FROM python:3.12-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install Python dependencies
COPY server/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY server/ ./server/

# Copy built frontend assets from Stage 1
COPY --from=frontend-build /app/react/dist ./react/dist

# Set environment variables
ENV UI_DIST_DIR=/app/react/dist
ENV HOST=0.0.0.0
ENV PORT=8000

# Expose the port
EXPOSE 8000

# Run the server - use shell form to allow $PORT expansion from Railway
WORKDIR /app/server
CMD python main.py --port ${PORT:-8000}
