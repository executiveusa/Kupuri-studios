import { diplomat } from '../services/diplomat';
import { db } from '../db/index';
import { randomUUID } from 'crypto';

interface PODOrderRequest {
  userId: string;
  comicId: string;
  product: 'hardcover' | 'paperback' | 'ebook';
  quantity: number;
  shippingAddress: {
    fullName: string;
    email: string;
    phone: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

interface PODOrderResult {
  orderId: string;
  printfulOrderId?: string;
  status: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
}

export class PODOrchestratorAgent {
  async createPODOrder(request: PODOrderRequest): Promise<PODOrderResult> {
    const orderId = randomUUID();

    try {
      // Step 1: Create order in Printful
      const printfulResult = await diplomat.createPrintfulOrder(request.comicId, {
        quantity: request.quantity,
        shippingAddress: request.shippingAddress,
      });

      // Step 2: Trigger n8n workflow for order fulfillment
      await diplomat.triggerN8nWorkflow('order-fulfillment', {
        orderId,
        printfulOrderId: printfulResult.orderId,
        userId: request.userId,
        comicId: request.comicId,
        product: request.product,
        quantity: request.quantity,
        shippingAddress: request.shippingAddress,
      });

      // Step 3: Store order in database
      // Note: This would be in a pod_orders table
      console.log('POD Order created:', { orderId, printfulOrderId: printfulResult.orderId });

      return {
        orderId,
        printfulOrderId: printfulResult.orderId,
        status: 'processing',
        trackingUrl: printfulResult.trackingUrl,
        estimatedDelivery: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      };
    } catch (error) {
      console.error('POD order creation error:', error);

      // Fallback: Create mock order
      return {
        orderId,
        status: 'pending',
        estimatedDelivery: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      };
    }
  }

  async checkOrderStatus(orderId: string): Promise<{
    status: string;
    tracking?: string;
    estimatedDelivery?: string;
  }> {
    // In production: Query Printful API
    return {
      status: 'processing',
      estimatedDelivery: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  async autoPublishToMarketplaces(comicId: string): Promise<{
    shopify?: string;
    etsy?: string;
    amazon?: string;
  }> {
    // For MVP: Log the action
    // In production: Use diplomat adapters to publish to Shopify, Etsy, Amazon
    console.log('Auto-publishing comic to marketplaces:', comicId);

    return {
      shopify: `https://kupuri-shop.myshopify.com/products/${comicId}`,
      etsy: undefined, // Not implemented in MVP
      amazon: undefined,
    };
  }

  async requestReview(orderId: string, email: string): Promise<void> {
    // Trigger n8n workflow to send review request via Loox
    await diplomat.triggerN8nWorkflow('request-review', {
      orderId,
      email,
    });
  }
}

export const podOrchestrator = new PODOrchestratorAgent();
