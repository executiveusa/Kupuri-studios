/**
 * Kupuri Studios - Stripe Integration
 * Handles subscription payments for the MVP
 * $99/month Professional Plan
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  stripePriceId: string;
  popular?: boolean;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 0,
    currency: 'USD',
    interval: 'month',
    stripePriceId: '',
    features: [
      '3 videos por mes',
      'Transcripción básica',
      'Sin marca de agua',
      'Soporte por email',
    ],
  },
  {
    id: 'professional',
    name: 'Profesional',
    price: 99,
    currency: 'USD',
    interval: 'month',
    stripePriceId: 'price_professional_monthly',
    popular: true,
    features: [
      'Videos ilimitados',
      'Avatar AI personalizado',
      'Voz clonada con ElevenLabs',
      'Exportación HD 1080p',
      'Programación automática',
      'Soporte prioritario 24/7',
      'API access',
    ],
  },
  {
    id: 'enterprise',
    name: 'Empresa',
    price: 299,
    currency: 'USD',
    interval: 'month',
    stripePriceId: 'price_enterprise_monthly',
    features: [
      'Todo de Profesional',
      'Multi-usuario (5 seats)',
      'Avatar AI dedicado',
      'Integración WhatsApp',
      'White-label',
      'Account manager dedicado',
      'SLA garantizado',
    ],
  },
];

export interface CheckoutSession {
  sessionId: string;
  url: string;
}

export interface Subscription {
  id: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  planId: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

class StripeClient {
  private stripe: any = null;

  async loadStripe() {
    if (this.stripe) return this.stripe;
    
    if (!STRIPE_PUBLISHABLE_KEY) {
      console.warn('Stripe publishable key not configured');
      return null;
    }

    // Dynamically load Stripe.js
    const { loadStripe } = await import('@stripe/stripe-js');
    this.stripe = await loadStripe(STRIPE_PUBLISHABLE_KEY);
    return this.stripe;
  }

  /**
   * Create a checkout session for subscription
   */
  async createCheckoutSession(planId: string, userId?: string): Promise<CheckoutSession> {
    const response = await fetch(`${API_BASE}/api/payments/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plan_id: planId,
        user_id: userId,
        success_url: `${window.location.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/pricing`,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Checkout failed' }));
      throw new Error(error.detail || 'Failed to create checkout session');
    }

    return response.json();
  }

  /**
   * Redirect to Stripe Checkout
   */
  async redirectToCheckout(planId: string, userId?: string): Promise<void> {
    const stripe = await this.loadStripe();
    if (!stripe) {
      throw new Error('Stripe not configured');
    }

    const { sessionId } = await this.createCheckoutSession(planId, userId);
    
    const { error } = await stripe.redirectToCheckout({ sessionId });
    
    if (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Get current subscription status
   */
  async getSubscription(userId: string): Promise<Subscription | null> {
    const response = await fetch(`${API_BASE}/api/payments/subscription/${userId}`);
    
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Failed to get subscription');
    }

    return response.json();
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/payments/subscription/${subscriptionId}/cancel`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to cancel subscription');
    }
  }

  /**
   * Create customer portal session
   */
  async createPortalSession(userId: string): Promise<{ url: string }> {
    const response = await fetch(`${API_BASE}/api/payments/create-portal-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        return_url: `${window.location.origin}/dashboard`,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create portal session');
    }

    return response.json();
  }

  /**
   * Redirect to customer portal
   */
  async redirectToPortal(userId: string): Promise<void> {
    const { url } = await this.createPortalSession(userId);
    window.location.href = url;
  }
}

// Export singleton
export const stripeClient = new StripeClient();

// React hook for subscription state
export function useSubscription(userId?: string) {
  const [subscription, setSubscription] = React.useState<Subscription | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    stripeClient
      .getSubscription(userId)
      .then(setSubscription)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [userId]);

  return { subscription, loading, error };
}

// Need to import React for the hook
import React from 'react';
