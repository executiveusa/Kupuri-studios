import { Hono } from 'hono';
import { z } from 'zod';
import { ComicService } from '../services/comicService';
import { getUser } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = new Hono();

const CreateComicSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  theme: z.enum(['pokemon', 'anime', 'fantasy', 'scifi', 'mystery', 'educational']),
});

const UpdateComicSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'generating', 'completed', 'published']).optional(),
  metadata: z.record(z.any()).optional(),
});

// GET all published comics (public)
router.get('/', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');

    if (page < 1 || limit < 1) {
      throw new AppError('Invalid pagination parameters', 'INVALID_PAGINATION', 400);
    }

    const result = await ComicService.getPublishedComics(page, limit);

    return c.json({
      success: true,
      data: result,
    });
  } catch (err) {
    throw err;
  }
});

// GET user's comics (protected)
router.get('/my-comics', async (c) => {
  try {
    const user = getUser(c);
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '10');

    if (page < 1 || limit < 1) {
      throw new AppError('Invalid pagination parameters', 'INVALID_PAGINATION', 400);
    }

    const result = await ComicService.getUserComics(user.userId, page, limit);

    return c.json({
      success: true,
      data: result,
    });
  } catch (err) {
    throw err;
  }
});

// GET single comic
router.get('/:id', async (c) => {
  try {
    const comicId = c.req.param('id');
    const user = (c as any).user; // Optional user

    const comic = await ComicService.getComicById(comicId, user?.userId);

    return c.json({
      success: true,
      data: comic,
    });
  } catch (err) {
    throw err;
  }
});

// CREATE new comic (protected)
router.post('/', async (c) => {
  try {
    const user = getUser(c);
    const body = await c.req.json();
    const data = CreateComicSchema.parse(body);

    const comic = await ComicService.createComic(
      user.userId,
      data.title,
      data.description || '',
      data.theme
    );

    return c.json(
      {
        success: true,
        data: comic,
      },
      201
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw new AppError('Validation failed', 'VALIDATION_ERROR', 400, {
        errors: err.errors,
      });
    }
    throw err;
  }
});

// UPDATE comic (protected)
router.put('/:id', async (c) => {
  try {
    const user = getUser(c);
    const comicId = c.req.param('id');
    const body = await c.req.json();
    const data = UpdateComicSchema.parse(body);

    const comic = await ComicService.updateComic(comicId, user.userId, data);

    return c.json({
      success: true,
      data: comic,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw new AppError('Validation failed', 'VALIDATION_ERROR', 400, {
        errors: err.errors,
      });
    }
    throw err;
  }
});

// DELETE comic (protected)
router.delete('/:id', async (c) => {
  try {
    const user = getUser(c);
    const comicId = c.req.param('id');

    await ComicService.deleteComic(comicId, user.userId);

    return c.json({
      success: true,
      message: 'Comic deleted successfully',
    });
  } catch (err) {
    throw err;
  }
});

// PUBLISH comic (protected)
router.post('/:id/publish', async (c) => {
  try {
    const user = getUser(c);
    const comicId = c.req.param('id');

    const comic = await ComicService.publishComic(comicId, user.userId);

    return c.json({
      success: true,
      data: comic,
    });
  } catch (err) {
    throw err;
  }
});

export default router;
