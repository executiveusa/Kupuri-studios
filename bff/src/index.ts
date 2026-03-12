import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware, optionalAuthMiddleware } from './middleware/auth';
import { initializeDatabase } from './db/index';

// Routes
import authRoutes from './routes/auth';
import comicRoutes from './routes/comic';
import characterRoutes from './routes/character';
import userRoutes from './routes/user';
import tokenRoutes from './routes/token';
import healthRoutes from './routes/health';
import stripeRoutes from './routes/stripe';
import nftRoutes from './routes/nft';

const app = new Hono();

// Initialize database
initializeDatabase().catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

// Middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Public routes
app.route('/api/health', healthRoutes);
app.route('/api/auth', authRoutes);

// Optional auth routes
app.use('/api/comics', optionalAuthMiddleware);
app.route('/api/comics', comicRoutes);

// Protected routes (require authentication)
app.use('/api/*', authMiddleware);

app.route('/api/characters', characterRoutes);
app.route('/api/user', userRoutes);
app.route('/api/tokens', tokenRoutes);
app.route('/api/stripe', stripeRoutes);
app.route('/api/nft', nftRoutes);

// Error handling
app.onError(errorHandler);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// Start server
const port = process.env.PORT || 8000;
console.log(`🚀 BFF server starting on port ${port}...`);

export default app;
