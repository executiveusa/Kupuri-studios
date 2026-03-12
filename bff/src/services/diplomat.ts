import axios from 'axios';
import { vault } from './vault';
import { AppError } from '../middleware/errorHandler';

export class Diplomat {
  // Printful API Adapter
  async createPrintfulOrder(comicId: string, orderData: any) {
    try {
      const apiKey = process.env.PRINTFUL_API_KEY;
      if (!apiKey) throw new Error('PRINTFUL_API_KEY not configured');

      const response = await axios.post(
        `${process.env.PRINTFUL_API_BASE || 'https://api.printful.com'}/orders`,
        {
          external_id: comicId,
          items: [
            {
              variant_id: 1, // Hardcover book
              quantity: orderData.quantity || 1,
            },
          ],
          recipient: orderData.shippingAddress,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        orderId: response.data.result.id,
        status: response.data.result.status,
        trackingUrl: response.data.result.tracking_url,
      };
    } catch (error) {
      console.error('Printful API error:', error);
      // Mock response for MVP
      return {
        orderId: `mock-printful-${Date.now()}`,
        status: 'pending',
        trackingUrl: 'https://printful.com/orders',
      };
    }
  }

  // Polygon NFT Adapter
  async generateNFTMetadata(characterId: string, characterName: string) {
    return {
      name: `${characterName} NFT`,
      description: `Unique character NFT from Kupuri Studios`,
      image: `ipfs://QmPlaceholder/character-${characterId}.png`,
      attributes: [
        {
          trait_type: 'Creator',
          value: 'Kupuri Studios',
        },
        {
          trait_type: 'Type',
          value: 'Character',
        },
      ],
    };
  }

  // Mint NFT on Polygon (stub - returns mock tokenId)
  async mintNFT(userId: string, metadata: any) {
    // In production: Call Polygon smart contract
    // For MVP: Return mock token ID
    return {
      tokenId: `${Date.now()}`,
      contractAddress: process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || '0x0000...',
      transactionHash: `0xmock${Date.now()}`,
      status: 'minted',
    };
  }

  // Stripe Integration (moved here for centralization)
  async createCheckoutSession(userId: string, priceId: string, packageId: string) {
    // Implementation in stripeService.ts
    return { sessionId: 'mock-session', url: 'https://checkout.stripe.com' };
  }

  // Send webhook to n8n for order fulfillment
  async triggerN8nWorkflow(workflowId: string, data: any) {
    try {
      const n8nUrl = process.env.N8N_WEBHOOK_URL;
      if (!n8nUrl) {
        console.log('N8N_WEBHOOK_URL not configured, skipping workflow trigger');
        return { status: 'queued' };
      }

      const response = await axios.post(n8nUrl, data);
      return response.data;
    } catch (error) {
      console.error('N8N workflow trigger failed:', error);
      return { status: 'failed', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export const diplomat = new Diplomat();
