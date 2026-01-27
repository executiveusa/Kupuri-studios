import { db, comics, pages, characters, tokenTransactions, tokenBalances } from '../db/index';
import { eq, and, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { AppError } from '../middleware/errorHandler';
import type { Comic, Page } from '@kupuri/types';

export class ComicService {
  static async createComic(
    userId: string,
    title: string,
    description: string,
    theme: string
  ): Promise<Comic> {
    const comicId = randomUUID();
    const now = new Date();

    try {
      await db.insert(comics).values({
        id: comicId,
        userId,
        title,
        description,
        theme,
        status: 'draft',
        metadata: {
          ageRating: 'PG',
          genre: [],
          tags: [],
          views: 0,
          likes: 0,
          shares: 0,
        },
      });

      return {
        id: comicId,
        userId,
        title,
        description,
        theme,
        status: 'draft',
        pages: [],
        characterIds: [],
        metadata: {
          ageRating: 'PG',
          genre: [],
          tags: [],
          views: 0,
          likes: 0,
          shares: 0,
        },
        createdAt: now,
        updatedAt: now,
      };
    } catch (error) {
      throw new AppError('Failed to create comic', 'COMIC_CREATION_FAILED', 500);
    }
  }

  static async getComicById(comicId: string, userId?: string): Promise<Comic> {
    const comic = await db.query.comics.findFirst({
      where: eq(comics.id, comicId),
      with: {
        pages: {
          with: {
            panels: true,
            choices: true,
          },
        },
      },
    });

    if (!comic) {
      throw new AppError('Comic not found', 'COMIC_NOT_FOUND', 404);
    }

    // Check access if userId provided (verify ownership for non-published)
    if (userId && comic.userId !== userId && comic.status !== 'published') {
      throw new AppError('Access denied', 'FORBIDDEN', 403);
    }

    return this.mapComicFromDB(comic);
  }

  static async getUserComics(userId: string, page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;

    const userComics = await db.query.comics.findMany({
      where: eq(comics.userId, userId),
      orderBy: desc(comics.createdAt),
      limit,
      offset,
      with: {
        pages: {
          with: {
            panels: true,
          },
        },
      },
    });

    const total = await db.query.comics.findMany({
      where: eq(comics.userId, userId),
    });

    return {
      data: userComics.map((c) => this.mapComicFromDB(c)),
      pagination: {
        total: total.length,
        page,
        pageSize: limit,
        totalPages: Math.ceil(total.length / limit),
      },
    };
  }

  static async updateComic(
    comicId: string,
    userId: string,
    updates: Partial<Comic>
  ): Promise<Comic> {
    // Verify ownership
    const comic = await db.query.comics.findFirst({
      where: and(eq(comics.id, comicId), eq(comics.userId, userId)),
    });

    if (!comic) {
      throw new AppError('Comic not found or access denied', 'COMIC_NOT_FOUND', 404);
    }

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (updates.title) updateData.title = updates.title;
    if (updates.description) updateData.description = updates.description;
    if (updates.status) updateData.status = updates.status;
    if (updates.metadata) {
      updateData.metadata = {
        ...comic.metadata,
        ...updates.metadata,
      };
    }

    try {
      await db
        .update(comics)
        .set(updateData)
        .where(eq(comics.id, comicId));

      return this.getComicById(comicId, userId);
    } catch (error) {
      throw new AppError('Failed to update comic', 'COMIC_UPDATE_FAILED', 500);
    }
  }

  static async deleteComic(comicId: string, userId: string): Promise<void> {
    // Verify ownership
    const comic = await db.query.comics.findFirst({
      where: and(eq(comics.id, comicId), eq(comics.userId, userId)),
    });

    if (!comic) {
      throw new AppError('Comic not found or access denied', 'COMIC_NOT_FOUND', 404);
    }

    try {
      await db.delete(comics).where(eq(comics.id, comicId));
    } catch (error) {
      throw new AppError('Failed to delete comic', 'COMIC_DELETE_FAILED', 500);
    }
  }

  static async publishComic(comicId: string, userId: string): Promise<Comic> {
    const comic = await db.query.comics.findFirst({
      where: and(eq(comics.id, comicId), eq(comics.userId, userId)),
    });

    if (!comic) {
      throw new AppError('Comic not found', 'COMIC_NOT_FOUND', 404);
    }

    if (comic.status === 'generating') {
      throw new AppError('Cannot publish while generating', 'INVALID_STATUS', 400);
    }

    try {
      await db
        .update(comics)
        .set({
          status: 'published',
          updatedAt: new Date(),
        })
        .where(eq(comics.id, comicId));

      return this.getComicById(comicId, userId);
    } catch (error) {
      throw new AppError('Failed to publish comic', 'PUBLISH_FAILED', 500);
    }
  }

  static async getPublishedComics(page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    const published = await db.query.comics.findMany({
      where: eq(comics.status, 'published'),
      orderBy: desc(comics.createdAt),
      limit,
      offset,
      with: {
        pages: {
          limit: 3,
        },
      },
    });

    const total = await db.query.comics.findMany({
      where: eq(comics.status, 'published'),
    });

    return {
      data: published.map((c) => this.mapComicFromDB(c)),
      pagination: {
        total: total.length,
        page,
        pageSize: limit,
        totalPages: Math.ceil(total.length / limit),
      },
    };
  }

  private static mapComicFromDB(dbComic: any): Comic {
    return {
      id: dbComic.id,
      userId: dbComic.userId,
      title: dbComic.title,
      description: dbComic.description || '',
      theme: dbComic.theme,
      status: dbComic.status,
      pages: dbComic.pages || [],
      characterIds: dbComic.characterIds || [],
      thumbnail: dbComic.thumbnail || undefined,
      metadata: dbComic.metadata || {
        ageRating: 'PG',
        genre: [],
        tags: [],
        views: 0,
        likes: 0,
        shares: 0,
      },
      createdAt: dbComic.createdAt,
      updatedAt: dbComic.updatedAt,
    };
  }
}
