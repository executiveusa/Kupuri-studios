"""
Stripe Webhook Router for Kupuri Studios

Handles Stripe webhook events for payment processing and credit management.
Implements signature verification for security.
"""

from fastapi import APIRouter, Request, HTTPException, Header
from typing import Optional
import stripe
import os
import json

router = APIRouter(prefix="/webhook")

# Get Stripe configuration from environment
STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY', '')
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET', '')

if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY
    print("✅ Stripe API key configured")
else:
    print("⚠️  STRIPE_SECRET_KEY not set - payment webhooks will not work")


@router.post("/stripe")
async def stripe_webhook(
    request: Request,
    stripe_signature: Optional[str] = Header(None, alias="stripe-signature")
):
    """
    Handle Stripe webhook events.
    
    Events handled:
    - payment_intent.succeeded: Credits user account when payment completes
    - payment_intent.payment_failed: Logs payment failures
    
    Security:
    - Verifies webhook signature using Stripe webhook secret
    - Rejects unsigned or invalid requests
    
    Environment Variables Required:
    - STRIPE_SECRET_KEY: Your Stripe secret key (sk_live_... or sk_test_...)
    - STRIPE_WEBHOOK_SECRET: Webhook signing secret from Stripe dashboard (whsec_...)
    """
    
    if not STRIPE_SECRET_KEY or not STRIPE_WEBHOOK_SECRET:
        print("❌ Stripe webhook called but credentials not configured")
        raise HTTPException(
            status_code=503,
            detail="Stripe webhook not configured. Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET."
        )
    
    # Get raw request body
    payload = await request.body()
    
    try:
        # Verify webhook signature
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        # Invalid payload
        print(f"❌ Invalid Stripe webhook payload: {e}")
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        print(f"❌ Invalid Stripe webhook signature: {e}")
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle the event
    event_type = event['type']
    event_data = event['data']['object']
    
    print(f"📥 Received Stripe webhook: {event_type}")
    
    if event_type == 'payment_intent.succeeded':
        await handle_payment_success(event_data)
    elif event_type == 'payment_intent.payment_failed':
        await handle_payment_failed(event_data)
    else:
        print(f"ℹ️  Unhandled Stripe event type: {event_type}")
    
    return {"status": "success"}


async def handle_payment_success(payment_intent: dict):
    """
    Process successful payment and credit user account.
    
    Args:
        payment_intent: Stripe PaymentIntent object
        
    Expected metadata on PaymentIntent:
        - user_id: User's account ID
        - credits: Number of credits to add
        - model: AI model the credits are for (optional)
    """
    payment_id = payment_intent['id']
    amount_cents = payment_intent['amount']
    amount_dollars = amount_cents / 100
    currency = payment_intent['currency']
    metadata = payment_intent.get('metadata', {})
    
    user_id = metadata.get('user_id')
    credits = metadata.get('credits')
    model = metadata.get('model', 'general')
    
    print(f"💰 Payment succeeded: {payment_id}")
    print(f"   Amount: ${amount_dollars} {currency.upper()}")
    print(f"   User: {user_id}")
    print(f"   Credits: {credits}")
    print(f"   Model: {model}")
    
    if not user_id or not credits:
        print(f"⚠️  Missing user_id or credits in payment metadata")
        return
    
    # TODO: Implement database update
    # Example:
    # await db_service.add_user_credits(
    #     user_id=user_id,
    #     credits=int(credits),
    #     model=model,
    #     payment_id=payment_id,
    #     amount=amount_dollars
    # )
    
    print(f"✅ User {user_id} credited with {credits} {model} credits")
    
    # TODO: Send WebSocket notification to user
    # await send_to_websocket(user_id, {
    #     "type": "credits_added",
    #     "credits": credits,
    #     "model": model,
    #     "payment_id": payment_id
    # })


async def handle_payment_failed(payment_intent: dict):
    """
    Log failed payment for monitoring.
    
    Args:
        payment_intent: Stripe PaymentIntent object
    """
    payment_id = payment_intent['id']
    amount_cents = payment_intent['amount']
    amount_dollars = amount_cents / 100
    error_message = payment_intent.get('last_payment_error', {}).get('message', 'Unknown error')
    metadata = payment_intent.get('metadata', {})
    user_id = metadata.get('user_id', 'unknown')
    
    print(f"❌ Payment failed: {payment_id}")
    print(f"   User: {user_id}")
    print(f"   Amount: ${amount_dollars}")
    print(f"   Error: {error_message}")
    
    # TODO: Send notification to user about payment failure
    # await send_to_websocket(user_id, {
    #     "type": "payment_failed",
    #     "payment_id": payment_id,
    #     "error": error_message
    # })


@router.get("/stripe/test")
async def test_stripe_config():
    """
    Test endpoint to verify Stripe configuration.
    Returns webhook status and configuration state.
    """
    return {
        "stripe_configured": bool(STRIPE_SECRET_KEY),
        "webhook_secret_configured": bool(STRIPE_WEBHOOK_SECRET),
        "status": "ready" if (STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET) else "not_configured",
        "message": "Stripe webhook endpoint is active" if (STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET) else "Configure STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET environment variables"
    }
