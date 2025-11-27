#!/bin/bash

# Kupuri Studios - Quick Start Script

echo "🎨 Kupuri Studios - Quick Start"
echo "================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "⚠️  Docker Compose not found. Trying 'docker compose'..."
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

echo "✅ Docker detected"
echo ""

# Menu
echo "Choose deployment method:"
echo "1) Development (local without Docker)"
echo "2) Docker Build & Run"
echo "3) Docker Compose"
echo "4) Build for Production"
echo ""
read -p "Enter choice [1-4]: " choice

case $choice in
    1)
        echo ""
        echo "🔧 Starting Development Environment..."
        echo ""
        
        # Install frontend dependencies
        if [ ! -d "react/node_modules" ]; then
            echo "📦 Installing React dependencies..."
            cd react && npm install && cd ..
        fi
        
        # Install backend dependencies
        if [ ! -d "server/venv" ]; then
            echo "🐍 Creating Python virtual environment..."
            cd server && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt && cd ..
        fi
        
        echo ""
        echo "✅ Development environment ready!"
        echo ""
        echo "To start:"
        echo "  Frontend: cd react && npm run dev"
        echo "  Backend:  cd server && source venv/bin/activate && python main.py"
        ;;
    
    2)
        echo ""
        echo "🐳 Building Docker image..."
        docker build -t kupuri-studios:latest .
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ Build successful!"
            echo "🚀 Starting container..."
            docker run -d --name kupuri-studios -p 8000:8000 kupuri-studios:latest
            echo ""
            echo "✅ Kupuri Studios is running at http://localhost:8000"
            echo ""
            echo "To view logs: docker logs -f kupuri-studios"
            echo "To stop:      docker stop kupuri-studios"
            echo "To remove:    docker rm kupuri-studios"
        else
            echo "❌ Build failed"
            exit 1
        fi
        ;;
    
    3)
        echo ""
        echo "🐳 Starting with Docker Compose..."
        $COMPOSE_CMD up -d --build
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ Kupuri Studios is running at http://localhost:8000"
            echo ""
            echo "To view logs: $COMPOSE_CMD logs -f"
            echo "To stop:      $COMPOSE_CMD down"
        else
            echo "❌ Docker Compose failed"
            exit 1
        fi
        ;;
    
    4)
        echo ""
        echo "📦 Building for production..."
        docker build -t kupuri-studios:production --target frontend-build .
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ Production build complete!"
            echo "📤 Ready to push to registry or deploy to VPS"
        else
            echo "❌ Production build failed"
            exit 1
        fi
        ;;
    
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac
