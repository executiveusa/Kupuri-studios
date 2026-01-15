/**
 * Stripe Integration for Pay-As-You-Go Model
 * Handles payment processing and usage tracking
 */

import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20',
})

export const PRICING = {
  models: {
    'gpt-4': 0.50,
    'gpt-3.5': 0.10,
    'claude-3': 0.40,
    'flux': 0.05,
    'midjourney': 1.00,
  },
}

export async function createPaymentIntent(amount: number, userId: string) {
  try {
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        userId,
      },
    })
    return intent
  } catch (error) {
    console.error('Error creating payment intent:', error)
    throw error
  }
}

export async function trackUsage(userId: string, model: string, count: number) {
  const cost = (PRICING.models[model as keyof typeof PRICING.models] || 0.10) * count
  return {
    userId,
    model,
    count,
    cost,
    timestamp: new Date(),
  }
}

export async function getBillingInfo(userId: string) {
  try {
    // Fetch from your database
    return {
      userId,
      balance: 0,
      usage: [],
      invoices: [],
    }
  } catch (error) {
    console.error('Error fetching billing info:', error)
    throw error
  }
}
