"""
Kupuri Studios - Stripe Payments Router
Handles subscriptions, checkout, and webhooks
Part of the 7-Day MVP Sprint
"""

import os
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Request, Header
from pydantic import BaseModel, Field
import stripe

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/payments", tags=["payments"])

# Stripe Configuration
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY

# Price IDs - Configure in Stripe Dashboard
PRICE_IDS = {
    "professional": os.getenv("STRIPE_PRICE_PROFESSIONAL", "price_professional_monthly"),
    "enterprise": os.getenv("STRIPE_PRICE_ENTERPRISE", "price_enterprise_monthly"),
}


class CreateCheckoutRequest(BaseModel):
    plan_id: str = Field(..., description="Plan ID (professional/enterprise)")
    user_id: Optional[str] = Field(None, description="User ID for metadata")
    success_url: str = Field(..., description="Redirect URL on success")
    cancel_url: str = Field(..., description="Redirect URL on cancel")
    email: Optional[str] = Field(None, description="Customer email")


class CreatePortalRequest(BaseModel):
    user_id: str = Field(..., description="User ID")
    return_url: str = Field(..., description="Return URL after portal")


class CheckoutSessionResponse(BaseModel):
    sessionId: str
    url: str


class SubscriptionResponse(BaseModel):
    id: str
    status: str
    plan_id: str
    current_period_end: str
    cancel_at_period_end: bool


@router.post("/create-checkout-session", response_model=CheckoutSessionResponse)
async def create_checkout_session(request: CreateCheckoutRequest):
    """
    Create a Stripe Checkout session for subscription
    """
    if not STRIPE_SECRET_KEY:
        raise HTTPException(status_code=503, detail="Stripe not configured")
    
    price_id = PRICE_IDS.get(request.plan_id)
    if not price_id:
        raise HTTPException(status_code=400, detail=f"Invalid plan: {request.plan_id}")
    
    try:
        # Create checkout session
        checkout_params = {
            "mode": "subscription",
            "payment_method_types": ["card"],
            "line_items": [{
                "price": price_id,
                "quantity": 1,
            }],
            "success_url": request.success_url,
            "cancel_url": request.cancel_url,
            "metadata": {
                "user_id": request.user_id or "",
                "plan_id": request.plan_id,
            },
            "subscription_data": {
                "metadata": {
                    "user_id": request.user_id or "",
                    "plan_id": request.plan_id,
                }
            },
            "allow_promotion_codes": True,
        }
        
        if request.email:
            checkout_params["customer_email"] = request.email
        
        session = stripe.checkout.Session.create(**checkout_params)
        
        return CheckoutSessionResponse(
            sessionId=session.id,
            url=session.url
        )
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/subscription/{user_id}", response_model=Optional[SubscriptionResponse])
async def get_subscription(user_id: str):
    """
    Get active subscription for a user
    """
    if not STRIPE_SECRET_KEY:
        raise HTTPException(status_code=503, detail="Stripe not configured")
    
    try:
        # Search for customer by metadata
        customers = stripe.Customer.list(limit=1)
        
        # In production, you'd store customer_id in your database
        # For MVP, search by metadata
        subscriptions = stripe.Subscription.list(
            status="active",
            limit=10,
        )
        
        for sub in subscriptions.data:
            if sub.metadata.get("user_id") == user_id:
                return SubscriptionResponse(
                    id=sub.id,
                    status=sub.status,
                    plan_id=sub.metadata.get("plan_id", "unknown"),
                    current_period_end=str(sub.current_period_end),
                    cancel_at_period_end=sub.cancel_at_period_end
                )
        
        return None
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/subscription/{subscription_id}/cancel")
async def cancel_subscription(subscription_id: str):
    """
    Cancel a subscription at period end
    """
    if not STRIPE_SECRET_KEY:
        raise HTTPException(status_code=503, detail="Stripe not configured")
    
    try:
        subscription = stripe.Subscription.modify(
            subscription_id,
            cancel_at_period_end=True
        )
        
        return {
            "id": subscription.id,
            "status": subscription.status,
            "cancel_at_period_end": subscription.cancel_at_period_end
        }
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/create-portal-session")
async def create_portal_session(request: CreatePortalRequest):
    """
    Create a Stripe Customer Portal session
    """
    if not STRIPE_SECRET_KEY:
        raise HTTPException(status_code=503, detail="Stripe not configured")
    
    try:
        # Find customer by user_id
        # In production, store customer_id in database
        customers = stripe.Customer.search(
            query=f"metadata['user_id']:'{request.user_id}'"
        )
        
        if not customers.data:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        customer_id = customers.data[0].id
        
        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=request.return_url,
        )
        
        return {"url": session.url}
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="Stripe-Signature")
):
    """
    Handle Stripe webhooks
    """
    if not STRIPE_SECRET_KEY or not STRIPE_WEBHOOK_SECRET:
        raise HTTPException(status_code=503, detail="Stripe webhooks not configured")
    
    payload = await request.body()
    
    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle events
    event_type = event["type"]
    data = event["data"]["object"]
    
    logger.info(f"Received Stripe event: {event_type}")
    
    if event_type == "checkout.session.completed":
        # Subscription created successfully
        user_id = data.get("metadata", {}).get("user_id")
        subscription_id = data.get("subscription")
        logger.info(f"New subscription for user {user_id}: {subscription_id}")
        
        # TODO: Update user's subscription status in database
        # await update_user_subscription(user_id, subscription_id, "active")
        
    elif event_type == "customer.subscription.updated":
        user_id = data.get("metadata", {}).get("user_id")
        status = data.get("status")
        logger.info(f"Subscription updated for user {user_id}: {status}")
        
        # TODO: Update subscription status in database
        # await update_user_subscription(user_id, data["id"], status)
        
    elif event_type == "customer.subscription.deleted":
        user_id = data.get("metadata", {}).get("user_id")
        logger.info(f"Subscription canceled for user {user_id}")
        
        # TODO: Update user's subscription status
        # await update_user_subscription(user_id, data["id"], "canceled")
        
    elif event_type == "invoice.payment_failed":
        user_id = data.get("metadata", {}).get("user_id")
        logger.warning(f"Payment failed for user {user_id}")
        
        # TODO: Send payment failure notification
        # await send_payment_failure_email(user_id)
    
    return {"received": True}


@router.get("/health")
async def health_check():
    """Check Stripe configuration"""
    return {
        "status": "healthy",
        "stripe_configured": bool(STRIPE_SECRET_KEY),
        "webhook_configured": bool(STRIPE_WEBHOOK_SECRET),
    }
