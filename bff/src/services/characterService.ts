import { db, characters } from '../db/index';
import { eq, and, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { AppError } from '../middleware/errorHandler';
import type { Character } from '@kupuri/types';

export class CharacterService {
  static async createCharacter(
    userId: string,
    name: string,
    description: string,
    imageUrl: string,
    metadata?: Record<string, any>
  ): Promise<Character> {
    const characterId = randomUUID();
    const now = new Date();

    try {
      await db.insert(characters).values({
        id: characterId,
        userId,
        name,
        description,
        imageUrl,
        metadata: metadata || {
          personality: [],
          appearances: 0,
          isFeatured: false,
          customizationOptions: {},
        },
      });

      return {
        id: characterId,
        userId,
        name,
        description,
        imageUrl,
        metadata: metadata || {
          personality: [],
          appearances: 0,
          isFeatured: false,
          customizationOptions: {},
        },
        createdAt: now,
        updatedAt: now,
      };
    } catch (error) {
      throw new AppError('Failed to create character', 'CHARACTER_CREATION_FAILED', 500);
    }
  }

  static async getCharacterById(characterId: string, userId?: string): Promise<Character> {
    const character = await db.query.characters.findFirst({
      where: eq(characters.id, characterId),
    });

    if (!character) {
      throw new AppError('Character not found', 'CHARACTER_NOT_FOUND', 404);
    }

    // Verify ownership if userId provided
    if (userId && character.userId !== userId) {
      throw new AppError('Access denied', 'FORBIDDEN', 403);
    }

    return this.mapCharacterFromDB(character);
  }

  static async getUserCharacters(userId: string, page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;

    const userCharacters = await db.query.characters.findMany({
      where: eq(characters.userId, userId),
      orderBy: desc(characters.createdAt),
      limit,
      offset,
    });

    const total = await db.query.characters.findMany({
      where: eq(characters.userId, userId),
    });

    return {
      data: userCharacters.map((c) => this.mapCharacterFromDB(c)),
      pagination: {
        total: total.length,
        page,
        pageSize: limit,
        totalPages: Math.ceil(total.length / limit),
      },
    };
  }

  static async updateCharacter(
    characterId: string,
    userId: string,
    updates: Partial<Character>
  ): Promise<Character> {
    // Verify ownership
    const character = await db.query.characters.findFirst({
      where: and(eq(characters.id, characterId), eq(characters.userId, userId)),
    });

    if (!character) {
      throw new AppError('Character not found or access denied', 'CHARACTER_NOT_FOUND', 404);
    }

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (updates.name) updateData.name = updates.name;
    if (updates.description) updateData.description = updates.description;
    if (updates.imageUrl) updateData.imageUrl = updates.imageUrl;
    if (updates.metadata) {
      updateData.metadata = {
        ...character.metadata,
        ...updates.metadata,
      };
    }

    try {
      await db.update(characters).set(updateData).where(eq(characters.id, characterId));

      return this.getCharacterById(characterId, userId);
    } catch (error) {
      throw new AppError('Failed to update character', 'CHARACTER_UPDATE_FAILED', 500);
    }
  }

  static async deleteCharacter(characterId: string, userId: string): Promise<void> {
    // Verify ownership
    const character = await db.query.characters.findFirst({
      where: and(eq(characters.id, characterId), eq(characters.userId, userId)),
    });

    if (!character) {
      throw new AppError('Character not found or access denied', 'CHARACTER_NOT_FOUND', 404);
    }

    try {
      await db.delete(characters).where(eq(characters.id, characterId));
    } catch (error) {
      throw new AppError('Failed to delete character', 'CHARACTER_DELETE_FAILED', 500);
    }
  }

  static async updateFaceEmbedding(
    characterId: string,
    userId: string,
    embedding: number[]
  ): Promise<Character> {
    // Verify ownership
    const character = await db.query.characters.findFirst({
      where: and(eq(characters.id, characterId), eq(characters.userId, userId)),
    });

    if (!character) {
      throw new AppError('Character not found', 'CHARACTER_NOT_FOUND', 404);
    }

    try {
      await db
        .update(characters)
        .set({
          faceEmbedding: JSON.stringify(embedding),
          updatedAt: new Date(),
        })
        .where(eq(characters.id, characterId));

      return this.getCharacterById(characterId, userId);
    } catch (error) {
      throw new AppError('Failed to update face embedding', 'EMBEDDING_UPDATE_FAILED', 500);
    }
  }

  private static mapCharacterFromDB(dbCharacter: any): Character {
    let faceEmbedding: number[] | undefined;
    if (dbCharacter.faceEmbedding) {
      try {
        faceEmbedding = JSON.parse(dbCharacter.faceEmbedding);
      } catch {
        faceEmbedding = undefined;
      }
    }

    return {
      id: dbCharacter.id,
      userId: dbCharacter.userId,
      name: dbCharacter.name,
      description: dbCharacter.description,
      imageUrl: dbCharacter.imageUrl,
      faceEmbedding,
      metadata: dbCharacter.metadata || {
        personality: [],
        appearances: 0,
        isFeatured: false,
        customizationOptions: {},
      },
      nftTokenId: dbCharacter.nftTokenId || undefined,
      createdAt: dbCharacter.createdAt,
      updatedAt: dbCharacter.updatedAt,
    };
  }
}
