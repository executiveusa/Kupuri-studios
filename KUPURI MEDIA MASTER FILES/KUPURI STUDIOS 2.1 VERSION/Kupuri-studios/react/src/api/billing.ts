import { BASE_API_URL } from '../constants'
import { authenticatedFetch } from './auth'

export interface BalanceResponse {
  balance: number; // Changed to number for animation math
  currency: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  credits: number;
  price: number;
  currency: string;
  features: string[];
  popular?: boolean;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  transactionId: string;
}

export interface TransactionStatusResponse {
  status: 'pending' | 'processing' | 'succeeded' | 'failed';
  newBalance?: number;
  message?: string;
}

/**
 * Fetches the user's current credit balance.
 */
export async function getBalance(): Promise<BalanceResponse> {
  const response = await authenticatedFetch(
    `${BASE_API_URL}/api/billing/balance`
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch balance: ${response.status}`)
  }

  return await response.json()
}

/**
 * Fetches available credit packages/plans.
 */
export async function getPricingPlans(): Promise<PricingPlan[]> {
  const response = await authenticatedFetch(
    `${BASE_API_URL}/api/billing/plans`
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch pricing plans: ${response.status}`)
  }

  return await response.json()
}

/**
 * Creates a Stripe PaymentIntent for a specific plan.
 */
export async function createPaymentIntent(planId: string): Promise<PaymentIntentResponse> {
  const response = await authenticatedFetch(
    `${BASE_API_URL}/api/billing/create-payment-intent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ planId }),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to create payment intent')
  }

  return await response.json()
}

/**
 * Polls the status of a transaction.
 */
export async function pollTransactionStatus(transactionId: string): Promise<TransactionStatusResponse> {
  const response = await authenticatedFetch(
    `${BASE_API_URL}/api/billing/transaction/${transactionId}`
  )

  if (!response.ok) {
    throw new Error(`Failed to check transaction status: ${response.status}`)
  }

  return await response.json()
}
