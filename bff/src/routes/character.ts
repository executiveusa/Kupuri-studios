import { Hono } from 'hono';
import { z } from 'zod';
import { db, characters } from '../db/index';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { getUser } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const app = new Hono();

const createCharacterSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  imageUrl: z.string().url(),
  metadata: z.record(z.any()).optional(),
});

const updateCharacterSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  metadata: z.record(z.any()).optional(),
});

// POST /api/characters - Create character
app.post('/', async (c) => {
  const user = getUser(c);
  const body = createCharacterSchema.parse(await c.req.json());

  try {
    const characterId = randomUUID();
    await db.insert(characters).values({
      id: characterId,
      userId: user.userId,
      name: body.name,
      description: body.description || '',
      imageUrl: body.imageUrl,
      metadata: body.metadata || {},
    });

    const character = await db.query.characters.findFirst({
      where: eq(characters.id, characterId),
    });

    return c.json(character, 201);
  } catch (error) {
    console.error('Character creation error:', error);
    throw new AppError('Failed to create character', 'CHARACTER_CREATE_ERROR', 500);
  }
});

// GET /api/characters - List user's characters
app.get('/', async (c) => {
  const user = getUser(c);

  try {
    const userCharacters = await db.query.characters.findMany({
      where: eq(characters.userId, user.userId),
      orderBy: (characters, { desc }) => [desc(characters.createdAt)],
    });

    return c.json(userCharacters);
  } catch (error) {
    throw new AppError('Failed to fetch characters', 'CHARACTER_LIST_ERROR', 500);
  }
});

// GET /api/characters/:id - Get character details
app.get('/:id', async (c) => {
  const { id } = c.req.param();
  const user = getUser(c);

  try {
    const character = await db.query.characters.findFirst({
      where: eq(characters.id, id),
    });

    if (!character) {
      throw new AppError('Character not found', 'CHARACTER_NOT_FOUND', 404);
    }

    if (character.userId !== user.userId) {
      throw new AppError('Unauthorized', 'UNAUTHORIZED', 403);
    }

    return c.json(character);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch character', 'CHARACTER_FETCH_ERROR', 500);
  }
});

// PUT /api/characters/:id - Update character
app.put('/:id', async (c) => {
  const { id } = c.req.param();
  const user = getUser(c);
  const body = updateCharacterSchema.parse(await c.req.json());

  try {
    const character = await db.query.characters.findFirst({
      where: eq(characters.id, id),
    });

    if (!character) {
      throw new AppError('Character not found', 'CHARACTER_NOT_FOUND', 404);
    }

    if (character.userId !== user.userId) {
      throw new AppError('Unauthorized', 'UNAUTHORIZED', 403);
    }

    await db
      .update(characters)
      .set({
        name: body.name || character.name,
        description: body.description !== undefined ? body.description : character.description,
        imageUrl: body.imageUrl || character.imageUrl,
        metadata: body.metadata || character.metadata,
        updatedAt: new Date(),
      })
      .where(eq(characters.id, id));

    const updated = await db.query.characters.findFirst({
      where: eq(characters.id, id),
    });

    return c.json(updated);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to update character', 'CHARACTER_UPDATE_ERROR', 500);
  }
});

// DELETE /api/characters/:id - Delete character
app.delete('/:id', async (c) => {
  const { id } = c.req.param();
  const user = getUser(c);

  try {
    const character = await db.query.characters.findFirst({
      where: eq(characters.id, id),
    });

    if (!character) {
      throw new AppError('Character not found', 'CHARACTER_NOT_FOUND', 404);
    }

    if (character.userId !== user.userId) {
      throw new AppError('Unauthorized', 'UNAUTHORIZED', 403);
    }

    await db.delete(characters).where(eq(characters.id, id));

    return c.json({ success: true, message: 'Character deleted' });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to delete character', 'CHARACTER_DELETE_ERROR', 500);
  }
});

export default app;
