import { Hono } from 'hono';
import { z } from 'zod';
import { db, comics, pages, choices } from '../db/index';
import { conductor } from '../services/conductor';
import { tokenService } from '../services/tokenService';
import { getUser } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const app = new Hono();

const createComicSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  theme: z.string().min(1).max(100),
});

const updateComicSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  theme: z.string().optional(),
});

// POST /api/comics - Create new comic
app.post('/', async (c) => {
  const user = getUser(c);
  const body = createComicSchema.parse(await c.req.json());

  try {
    const comicId = randomUUID();
    await db.insert(comics).values({
      id: comicId,
      userId: user.userId,
      title: body.title,
      description: body.description || '',
      theme: body.theme,
      status: 'draft',
      metadata: {},
    });

    const comic = await db.query.comics.findFirst({
      where: eq(comics.id, comicId),
    });

    return c.json(comic, 201);
  } catch (error) {
    console.error('Comic creation error:', error);
    throw new AppError('Failed to create comic', 'COMIC_CREATE_ERROR', 500);
  }
});

// GET /api/comics - List user's comics
app.get('/', async (c) => {
  const user = getUser(c);

  try {
    const userComics = await db.query.comics.findMany({
      where: eq(comics.userId, user.userId),
      orderBy: (comics, { desc }) => [desc(comics.createdAt)],
    });

    return c.json(userComics);
  } catch (error) {
    throw new AppError('Failed to fetch comics', 'COMIC_LIST_ERROR', 500);
  }
});

// GET /api/comics/:id - Get comic details
app.get('/:id', async (c) => {
  const { id } = c.req.param();
  const user = getUser(c);

  try {
    const comic = await db.query.comics.findFirst({
      where: eq(comics.id, id),
    });

    if (!comic) {
      throw new AppError('Comic not found', 'COMIC_NOT_FOUND', 404);
    }

    if (comic.userId !== user.userId) {
      throw new AppError('Unauthorized', 'UNAUTHORIZED', 403);
    }

    // Get pages and choices
    const comicPages = await db.query.pages.findMany({
      where: eq(pages.comicId, id),
      orderBy: (pages, { asc }) => [asc(pages.pageNumber)],
    });

    // Get choices for each page
    const pagesWithChoices = await Promise.all(
      comicPages.map(async (page) => ({
        ...page,
        choices: await db.query.choices.findMany({
          where: eq(choices.pageId, page.id),
        }),
      }))
    );

    return c.json({
      ...comic,
      pages: pagesWithChoices,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch comic', 'COMIC_FETCH_ERROR', 500);
  }
});

// POST /api/comics/:id/generate - Generate comic story
app.post('/:id/generate', async (c) => {
  const { id } = c.req.param();
  const user = getUser(c);

  try {
    const comic = await db.query.comics.findFirst({
      where: eq(comics.id, id),
    });

    if (!comic) {
      throw new AppError('Comic not found', 'COMIC_NOT_FOUND', 404);
    }

    if (comic.userId !== user.userId) {
      throw new AppError('Unauthorized', 'UNAUTHORIZED', 403);
    }

    // Check if already generating
    if (comic.status === 'generating') {
      throw new AppError('Comic is already generating', 'COMIC_GENERATING', 409);
    }

    // Update status to generating
    await db
      .update(comics)
      .set({ status: 'generating' })
      .where(eq(comics.id, id));

    // Generate the comic story
    const result = await conductor.generateComic({
      comicId: id,
      userId: user.userId,
      theme: comic.theme,
      title: comic.title,
      characterName: 'Hero',
      userPreferences: { style: 'anime', tone: 'adventurous' },
    });

    // Update comic status to completed
    await db
      .update(comics)
      .set({
        status: 'completed',
        metadata: {
          totalTokensCost: result.totalTokensCost,
          pagesGenerated: result.pages.length,
        },
      })
      .where(eq(comics.id, id));

    return c.json({
      success: true,
      comicId: id,
      pagesGenerated: result.pages.length,
      tokensCost: result.totalTokensCost,
      message: 'Comic generated successfully',
    });
  } catch (error) {
    // Revert status on failure
    await db
      .update(comics)
      .set({ status: 'draft' })
      .where(eq(comics.id, id));

    if (error instanceof AppError) throw error;
    throw new AppError('Failed to generate comic', 'COMIC_GENERATION_ERROR', 500);
  }
});

// PUT /api/comics/:id - Update comic
app.put('/:id', async (c) => {
  const { id } = c.req.param();
  const user = getUser(c);
  const body = updateComicSchema.parse(await c.req.json());

  try {
    const comic = await db.query.comics.findFirst({
      where: eq(comics.id, id),
    });

    if (!comic) {
      throw new AppError('Comic not found', 'COMIC_NOT_FOUND', 404);
    }

    if (comic.userId !== user.userId) {
      throw new AppError('Unauthorized', 'UNAUTHORIZED', 403);
    }

    await db
      .update(comics)
      .set({
        title: body.title || comic.title,
        description: body.description !== undefined ? body.description : comic.description,
        theme: body.theme || comic.theme,
        updatedAt: new Date(),
      })
      .where(eq(comics.id, id));

    const updated = await db.query.comics.findFirst({
      where: eq(comics.id, id),
    });

    return c.json(updated);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to update comic', 'COMIC_UPDATE_ERROR', 500);
  }
});

// DELETE /api/comics/:id - Delete comic
app.delete('/:id', async (c) => {
  const { id } = c.req.param();
  const user = getUser(c);

  try {
    const comic = await db.query.comics.findFirst({
      where: eq(comics.id, id),
    });

    if (!comic) {
      throw new AppError('Comic not found', 'COMIC_NOT_FOUND', 404);
    }

    if (comic.userId !== user.userId) {
      throw new AppError('Unauthorized', 'UNAUTHORIZED', 403);
    }

    await db.delete(comics).where(eq(comics.id, id));

    return c.json({ success: true, message: 'Comic deleted' });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to delete comic', 'COMIC_DELETE_ERROR', 500);
  }
});

// POST /api/comics/:id/publish - Publish comic
app.post('/:id/publish', async (c) => {
  const { id } = c.req.param();
  const user = getUser(c);

  try {
    const comic = await db.query.comics.findFirst({
      where: eq(comics.id, id),
    });

    if (!comic) {
      throw new AppError('Comic not found', 'COMIC_NOT_FOUND', 404);
    }

    if (comic.userId !== user.userId) {
      throw new AppError('Unauthorized', 'UNAUTHORIZED', 403);
    }

    if (comic.status !== 'completed') {
      throw new AppError('Comic must be completed before publishing', 'COMIC_NOT_READY', 400);
    }

    await db
      .update(comics)
      .set({ status: 'published', updatedAt: new Date() })
      .where(eq(comics.id, id));

    return c.json({ success: true, message: 'Comic published' });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to publish comic', 'COMIC_PUBLISH_ERROR', 500);
  }
});

export default app;
