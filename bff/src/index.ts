import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';

// Routes
import authRoutes from './routes/auth';
import comicRoutes from './routes/comic';
import characterRoutes from './routes/character';
import panelRoutes from './routes/panel';
import userRoutes from './routes/user';
import healthRoutes from './routes/health';
import stripeRoutes from './routes/stripe';
import tokenRoutes from './routes/token';
import nftRoutes from './routes/nft';
import podRoutes from './routes/pod';
import socialRoutes from './routes/social';

const app = new Hono();

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

// Health check (public)
app.route('/api/health', healthRoutes);

// Authentication routes (public)
app.route('/api/auth', authRoutes);

// Public routes
app.route('/api/comics/public', comicRoutes);

// Protected routes (require authentication)
app.use('/api/*', authMiddleware);

app.route('/api/comics', comicRoutes);
app.route('/api/characters', characterRoutes);
app.route('/api/panels', panelRoutes);
app.route('/api/user', userRoutes);
app.route('/api/tokens', tokenRoutes);
app.route('/api/stripe', stripeRoutes);
app.route('/api/nft', nftRoutes);
app.route('/api/pod', podRoutes);
app.route('/api/social', socialRoutes);

// Error handling
app.onError(errorHandler);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

export default app;
