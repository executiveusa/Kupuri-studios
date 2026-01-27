import { Hono } from 'hono';
import { z } from 'zod';
import { CharacterService } from '../services/characterService';
import { getUser } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = new Hono();

const CreateCharacterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  imageUrl: z.string().url('Invalid image URL'),
  metadata: z.record(z.any()).optional(),
});

const UpdateCharacterSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().min(10).optional(),
  imageUrl: z.string().url().optional(),
  metadata: z.record(z.any()).optional(),
});

const FaceEmbeddingSchema = z.object({
  embedding: z.array(z.number()),
});

// GET user's characters (protected)
router.get('/', async (c) => {
  try {
    const user = getUser(c);
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '10');

    if (page < 1 || limit < 1) {
      throw new AppError('Invalid pagination parameters', 'INVALID_PAGINATION', 400);
    }

    const result = await CharacterService.getUserCharacters(user.userId, page, limit);

    return c.json({
      success: true,
      data: result,
    });
  } catch (err) {
    throw err;
  }
});

// GET single character
router.get('/:id', async (c) => {
  try {
    const characterId = c.req.param('id');
    const user = (c as any).user; // Optional user

    const character = await CharacterService.getCharacterById(characterId, user?.userId);

    return c.json({
      success: true,
      data: character,
    });
  } catch (err) {
    throw err;
  }
});

// CREATE character (protected)
router.post('/', async (c) => {
  try {
    const user = getUser(c);
    const body = await c.req.json();
    const data = CreateCharacterSchema.parse(body);

    const character = await CharacterService.createCharacter(
      user.userId,
      data.name,
      data.description,
      data.imageUrl,
      data.metadata
    );

    return c.json(
      {
        success: true,
        data: character,
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

// UPDATE character (protected)
router.put('/:id', async (c) => {
  try {
    const user = getUser(c);
    const characterId = c.req.param('id');
    const body = await c.req.json();
    const data = UpdateCharacterSchema.parse(body);

    const character = await CharacterService.updateCharacter(characterId, user.userId, data);

    return c.json({
      success: true,
      data: character,
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

// DELETE character (protected)
router.delete('/:id', async (c) => {
  try {
    const user = getUser(c);
    const characterId = c.req.param('id');

    await CharacterService.deleteCharacter(characterId, user.userId);

    return c.json({
      success: true,
      message: 'Character deleted successfully',
    });
  } catch (err) {
    throw err;
  }
});

// UPDATE face embedding (protected)
router.post('/:id/embedding', async (c) => {
  try {
    const user = getUser(c);
    const characterId = c.req.param('id');
    const body = await c.req.json();
    const data = FaceEmbeddingSchema.parse(body);

    const character = await CharacterService.updateFaceEmbedding(
      characterId,
      user.userId,
      data.embedding
    );

    return c.json({
      success: true,
      data: character,
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

export default router;
