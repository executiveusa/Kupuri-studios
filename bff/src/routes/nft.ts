import { Hono } from 'hono';
import { z } from 'zod';
import { nftService } from '../services/nftService';
import { getUser } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const app = new Hono();

// POST /api/nft/mint
const mintSchema = z.object({
  type: z.enum(['character', 'comic', 'badge']),
  relatedId: z.string(),
  name: z.string(),
  description: z.string(),
  imageUrl: z.string().url(),
});

app.post('/mint', async (c) => {
  const user = getUser(c);
  const body = mintSchema.parse(await c.req.json());

  try {
    const result = await nftService.mintNFT(user.userId, {
      type: body.type,
      relatedId: body.relatedId,
      name: body.name,
      description: body.description,
      imageUrl: body.imageUrl,
    });

    return c.json(result);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to mint NFT', 'NFT_MINT_ERROR', 500);
  }
});

// GET /api/nft/status/:nftId
app.get('/status/:nftId', async (c) => {
  const { nftId } = c.req.param();

  try {
    const status = await nftService.getNFTStatus(nftId);
    return c.json(status);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to retrieve NFT status', 'NFT_STATUS_ERROR', 500);
  }
});

// GET /api/nft/my-nfts
app.get('/my-nfts', async (c) => {
  const user = getUser(c);

  try {
    const nfts = await nftService.getUserNFTs(user.userId);
    return c.json(nfts);
  } catch (error) {
    throw new AppError('Failed to retrieve NFTs', 'NFT_LIST_ERROR', 500);
  }
});

// GET /api/nft/character/:characterId/metadata
app.get('/character/:characterId/metadata', async (c) => {
  const { characterId } = c.req.param();

  try {
    const metadata = await nftService.exportCharacterMetadata(characterId);
    return c.json(metadata);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to export character metadata', 'METADATA_ERROR', 500);
  }
});

// GET /api/nft/comic/:comicId/metadata
app.get('/comic/:comicId/metadata', async (c) => {
  const { comicId } = c.req.param();

  try {
    const metadata = await nftService.exportComicMetadata(comicId);
    return c.json(metadata);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to export comic metadata', 'METADATA_ERROR', 500);
  }
});

export default app;
