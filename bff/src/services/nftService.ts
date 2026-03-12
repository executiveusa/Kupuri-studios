import { db, nfts, characters, comics } from '../db/index';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { AppError } from '../middleware/errorHandler';
import { diplomat } from './diplomat';

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  external_url?: string;
  animation_url?: string;
}

export interface MintRequest {
  type: 'character' | 'comic' | 'badge';
  relatedId: string;
  name: string;
  description: string;
  imageUrl: string;
}

export class NFTService {
  // Generate NFT metadata for IPFS
  async generateNFTMetadata(request: MintRequest): Promise<NFTMetadata> {
    const metadata: NFTMetadata = {
      name: request.name,
      description: request.description,
      image: request.imageUrl,
      attributes: [],
    };

    if (request.type === 'character') {
      const character = await db.query.characters.findFirst({
        where: eq(characters.id, request.relatedId),
      });

      if (character) {
        metadata.attributes.push(
          { trait_type: 'Type', value: 'Character' },
          { trait_type: 'Creator', value: character.userId },
          { trait_type: 'Created', value: character.createdAt?.toISOString() || 'Unknown' }
        );

        if (character.metadata && typeof character.metadata === 'object') {
          const meta = character.metadata as Record<string, unknown>;
          if (meta.traits) {
            metadata.attributes.push({ trait_type: 'Traits', value: String(meta.traits) });
          }
        }
      }
    } else if (request.type === 'comic') {
      const comic = await db.query.comics.findFirst({
        where: eq(comics.id, request.relatedId),
      });

      if (comic) {
        metadata.attributes.push(
          { trait_type: 'Type', value: 'Comic' },
          { trait_type: 'Theme', value: comic.theme },
          { trait_type: 'Creator', value: comic.userId },
          { trait_type: 'Status', value: comic.status }
        );
      }
    } else if (request.type === 'badge') {
      metadata.attributes.push(
        { trait_type: 'Type', value: 'Badge' },
        { trait_type: 'Achievement', value: 'Community' }
      );
    }

    return metadata;
  }

  // Mint NFT on Polygon (stub for MVP)
  async mintNFT(userId: string, request: MintRequest): Promise<{
    id: string;
    tokenId: string;
    contractAddress: string;
    transactionHash: string;
    metadata: NFTMetadata;
  }> {
    try {
      const metadata = await this.generateNFTMetadata(request);

      // Generate mock Polygon data for MVP
      const tokenId = Math.floor(Math.random() * 1000000).toString();
      const contractAddress = '0x' + 'a'.repeat(40); // Placeholder
      const transactionHash = '0x' + 'b'.repeat(64); // Placeholder
      const nftId = randomUUID();

      // Store NFT record
      await db.insert(nfts).values({
        id: nftId,
        userId,
        relatedId: request.relatedId,
        type: request.type,
        tokenId,
        contractAddress,
        metadata,
        transactionHash,
      });

      console.log(`[NFT] Minted ${request.type} NFT for user ${userId}: Token ID ${tokenId}`);

      // Trigger Polygon adapter for real minting (future)
      // await diplomat.mintNFT(userId, metadata, tokenId);

      return {
        id: nftId,
        tokenId,
        contractAddress,
        transactionHash,
        metadata,
      };
    } catch (error) {
      console.error('NFT minting error:', error);
      throw new AppError('Failed to mint NFT', 'NFT_MINT_ERROR', 500);
    }
  }

  // Check NFT status
  async getNFTStatus(nftId: string): Promise<any> {
    const nft = await db.query.nfts.findFirst({
      where: eq(nfts.id, nftId),
    });

    if (!nft) {
      throw new AppError('NFT not found', 'NFT_NOT_FOUND', 404);
    }

    return {
      id: nft.id,
      tokenId: nft.tokenId,
      contractAddress: nft.contractAddress,
      transactionHash: nft.transactionHash,
      mintedAt: nft.mintedAt,
      metadata: nft.metadata,
      status: 'minted',
    };
  }

  // Get user's NFTs
  async getUserNFTs(userId: string): Promise<any[]> {
    return await db.query.nfts.findMany({
      where: eq(nfts.userId, userId),
      orderBy: (nfts, { desc }) => [desc(nfts.mintedAt)],
    });
  }

  // Export character as NFT metadata (for manual minting)
  async exportCharacterMetadata(characterId: string): Promise<NFTMetadata> {
    const character = await db.query.characters.findFirst({
      where: eq(characters.id, characterId),
    });

    if (!character) {
      throw new AppError('Character not found', 'CHARACTER_NOT_FOUND', 404);
    }

    return this.generateNFTMetadata({
      type: 'character',
      relatedId: characterId,
      name: character.name,
      description: character.description || 'NFT Character',
      imageUrl: character.imageUrl,
    });
  }

  // Export comic as NFT metadata
  async exportComicMetadata(comicId: string): Promise<NFTMetadata> {
    const comic = await db.query.comics.findFirst({
      where: eq(comics.id, comicId),
    });

    if (!comic) {
      throw new AppError('Comic not found', 'COMIC_NOT_FOUND', 404);
    }

    return this.generateNFTMetadata({
      type: 'comic',
      relatedId: comicId,
      name: comic.title,
      description: comic.description || 'NFT Comic',
      imageUrl: comic.thumbnail || '',
    });
  }
}

export const nftService = new NFTService();
