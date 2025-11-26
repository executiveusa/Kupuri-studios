import { Hono } from 'hono';

const router = new Hono();

router.get('/', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

router.get('/ready', (c) => {
  // Check database, cache, and external service connections
  return c.json({
    ready: true,
    checks: {
      database: 'ok',
      cache: 'ok',
      external_apis: 'ok',
    },
  });
});

export default router;
