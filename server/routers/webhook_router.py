"""
Kupuri Studios - WhatsApp & Chatwoot Webhook Router
===================================================
Handles incoming webhooks from Chatwoot and WhatsApp Business API.
Integrates with Lightning Orchestrator for automated responses.
"""

from fastapi import APIRouter, Request, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
import logging
import json
import hmac
import hashlib

from services.chatwoot_service import chatwoot_service
from services.litellm_router_service import smart_router
from services.lightning_orchestrator import lightning_orchestrator

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])


# ===========================================
# MODELS
# ===========================================

class ChatwootWebhookPayload(BaseModel):
    """Chatwoot webhook payload structure"""
    event: str
    id: Optional[int] = None
    account: Optional[Dict[str, Any]] = None
    inbox: Optional[Dict[str, Any]] = None
    conversation: Optional[Dict[str, Any]] = None
    message: Optional[Dict[str, Any]] = None
    sender: Optional[Dict[str, Any]] = None
    contact: Optional[Dict[str, Any]] = None
    
    
class WhatsAppMessage(BaseModel):
    """WhatsApp Cloud API message structure"""
    from_: str = Field(alias="from")
    id: str
    timestamp: str
    type: str
    text: Optional[Dict[str, str]] = None
    image: Optional[Dict[str, Any]] = None
    audio: Optional[Dict[str, Any]] = None
    video: Optional[Dict[str, Any]] = None
    document: Optional[Dict[str, Any]] = None
    

class WhatsAppWebhookPayload(BaseModel):
    """WhatsApp Cloud API webhook payload"""
    object: str
    entry: List[Dict[str, Any]]


class AutoResponseConfig(BaseModel):
    """Configuration for automated responses"""
    enabled: bool = True
    greeting_message: str = "¡Hola! Soy Synthia, tu asistente de Kupuri Studios. ¿En qué puedo ayudarte hoy?"
    business_hours_start: int = 9  # 9 AM
    business_hours_end: int = 18  # 6 PM
    timezone: str = "America/Mexico_City"
    fallback_message: str = "Gracias por tu mensaje. Un miembro de nuestro equipo te responderá pronto."


# Default config
auto_response_config = AutoResponseConfig()


# ===========================================
# CHATWOOT WEBHOOKS
# ===========================================

@router.post("/chatwoot")
async def chatwoot_webhook(
    request: Request,
    background_tasks: BackgroundTasks
):
    """
    Handle Chatwoot webhook events.
    
    Supported events:
    - message_created: New message received
    - message_updated: Message updated
    - conversation_created: New conversation started
    - conversation_status_changed: Conversation status changed
    - conversation_updated: Conversation updated
    - webwidget_triggered: Widget interaction
    """
    try:
        payload = await request.json()
        event = payload.get("event", "unknown")
        
        logger.info(f"📨 Chatwoot webhook received: {event}")
        
        # Handle different events
        if event == "message_created":
            await handle_message_created(payload, background_tasks)
        elif event == "conversation_created":
            await handle_conversation_created(payload, background_tasks)
        elif event == "conversation_status_changed":
            await handle_conversation_status_changed(payload)
        elif event == "webwidget_triggered":
            await handle_webwidget_triggered(payload)
        else:
            logger.debug(f"Unhandled Chatwoot event: {event}")
            
        return {"status": "ok", "event": event}
        
    except Exception as e:
        logger.error(f"Chatwoot webhook error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def handle_message_created(payload: Dict, background_tasks: BackgroundTasks):
    """Handle new message from Chatwoot"""
    
    message = payload.get("message", {})
    conversation = payload.get("conversation", {})
    sender = payload.get("sender", {})
    
    # Skip outgoing messages (from our agents)
    message_type = message.get("message_type", "")
    if message_type == "outgoing":
        return
        
    # Skip private notes
    if message.get("private", False):
        return
        
    content = message.get("content", "")
    conversation_id = conversation.get("id")
    inbox_id = conversation.get("inbox_id")
    
    if not content or not conversation_id:
        return
        
    logger.info(f"📩 New message in conversation {conversation_id}: {content[:50]}...")
    
    # Check if auto-response is enabled
    if auto_response_config.enabled:
        background_tasks.add_task(
            generate_ai_response,
            conversation_id=conversation_id,
            message_content=content,
            sender_info=sender,
            inbox_id=inbox_id
        )


async def generate_ai_response(
    conversation_id: int,
    message_content: str,
    sender_info: Dict,
    inbox_id: int
):
    """Generate AI response using Lightning Orchestrator"""
    
    try:
        # Use LiteLLM smart router to generate response
        response = await smart_router.chat_completion(
            messages=[
                {
                    "role": "system",
                    "content": """Eres Synthia, la asistente de IA de Kupuri Studios. 
                    Eres amable, profesional y hablas principalmente en español.
                    Ayudas a clientes con:
                    - Creación de videos con IA
                    - Automatización de marketing
                    - Consultas sobre servicios
                    Mantén las respuestas concisas y útiles."""
                },
                {
                    "role": "user",
                    "content": message_content
                }
            ],
            task_type="simple"
        )
        
        ai_message = response.get("choices", [{}])[0].get("message", {}).get("content", "")
        
        if ai_message:
            # Send response via Chatwoot
            await chatwoot_service.send_message(
                conversation_id=conversation_id,
                message=ai_message,
                message_type="outgoing"
            )
            logger.info(f"✅ AI response sent to conversation {conversation_id}")
            
    except Exception as e:
        logger.error(f"Failed to generate AI response: {e}")
        
        # Send fallback message
        try:
            await chatwoot_service.send_message(
                conversation_id=conversation_id,
                message=auto_response_config.fallback_message,
                message_type="outgoing"
            )
        except:
            pass


async def handle_conversation_created(payload: Dict, background_tasks: BackgroundTasks):
    """Handle new conversation created"""
    
    conversation = payload.get("conversation", {})
    contact = payload.get("contact", {})
    
    conversation_id = conversation.get("id")
    contact_name = contact.get("name", "amigo")
    
    if not conversation_id:
        return
        
    logger.info(f"🆕 New conversation created: {conversation_id}")
    
    # Send greeting message
    if auto_response_config.enabled:
        greeting = auto_response_config.greeting_message
        if contact_name:
            greeting = greeting.replace("¡Hola!", f"¡Hola {contact_name}!")
            
        background_tasks.add_task(
            chatwoot_service.send_message,
            conversation_id=conversation_id,
            message=greeting,
            message_type="outgoing"
        )


async def handle_conversation_status_changed(payload: Dict):
    """Handle conversation status change"""
    
    conversation = payload.get("conversation", {})
    conversation_id = conversation.get("id")
    status = conversation.get("status")
    
    logger.info(f"📊 Conversation {conversation_id} status changed to: {status}")
    
    # Could trigger different actions based on status
    if status == "resolved":
        # Send satisfaction survey, etc.
        pass


async def handle_webwidget_triggered(payload: Dict):
    """Handle web widget interactions"""
    
    logger.info(f"🔔 Web widget triggered")
    # Track widget interactions for analytics


# ===========================================
# WHATSAPP CLOUD API WEBHOOKS
# ===========================================

@router.get("/whatsapp")
async def whatsapp_verify(
    hub_mode: str = None,
    hub_challenge: str = None,
    hub_verify_token: str = None
):
    """
    WhatsApp webhook verification endpoint.
    Meta sends a GET request to verify the webhook URL.
    """
    import os
    
    verify_token = os.getenv("WHATSAPP_VERIFY_TOKEN", "kupuri_whatsapp_2024")
    
    if hub_mode == "subscribe" and hub_verify_token == verify_token:
        logger.info("✅ WhatsApp webhook verified")
        return int(hub_challenge)
    else:
        logger.warning("❌ WhatsApp webhook verification failed")
        raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/whatsapp")
async def whatsapp_webhook(
    request: Request,
    background_tasks: BackgroundTasks
):
    """
    Handle WhatsApp Cloud API webhook events.
    
    Events:
    - messages: New message received
    - statuses: Message status updates (sent, delivered, read)
    """
    try:
        payload = await request.json()
        
        # Validate webhook signature if configured
        # signature = request.headers.get("X-Hub-Signature-256")
        # await validate_whatsapp_signature(payload, signature)
        
        logger.info(f"📱 WhatsApp webhook received")
        
        # Process entries
        for entry in payload.get("entry", []):
            for change in entry.get("changes", []):
                value = change.get("value", {})
                
                # Handle messages
                messages = value.get("messages", [])
                for message in messages:
                    await handle_whatsapp_message(
                        message=message,
                        metadata=value.get("metadata", {}),
                        contacts=value.get("contacts", []),
                        background_tasks=background_tasks
                    )
                    
                # Handle status updates
                statuses = value.get("statuses", [])
                for status in statuses:
                    await handle_whatsapp_status(status)
                    
        return {"status": "ok"}
        
    except Exception as e:
        logger.error(f"WhatsApp webhook error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def handle_whatsapp_message(
    message: Dict,
    metadata: Dict,
    contacts: List[Dict],
    background_tasks: BackgroundTasks
):
    """Handle incoming WhatsApp message"""
    
    message_type = message.get("type", "")
    from_number = message.get("from", "")
    message_id = message.get("id", "")
    
    logger.info(f"📩 WhatsApp message from {from_number}: type={message_type}")
    
    # Get message content based on type
    content = ""
    if message_type == "text":
        content = message.get("text", {}).get("body", "")
    elif message_type == "audio":
        # Handle audio message - could transcribe with Whisper
        content = "[Audio message received - transcription pending]"
    elif message_type == "image":
        content = "[Image received]"
    elif message_type == "document":
        content = "[Document received]"
        
    if not content:
        return
        
    # Get contact info
    contact_info = contacts[0] if contacts else {}
    contact_name = contact_info.get("profile", {}).get("name", "")
    
    # Create or update contact in Chatwoot
    try:
        chatwoot_contact = await chatwoot_service.find_or_create_contact(
            identifier=from_number,
            phone_number=from_number,
            name=contact_name
        )
        
        # Create or find conversation
        conversation = await chatwoot_service.find_or_create_conversation(
            contact_id=chatwoot_contact.id,
            source_id=from_number
        )
        
        # Log the incoming message
        await chatwoot_service.create_message(
            conversation_id=conversation.id,
            content=content,
            message_type="incoming"
        )
        
        # Generate AI response
        if auto_response_config.enabled:
            background_tasks.add_task(
                generate_whatsapp_response,
                phone_number=from_number,
                message_content=content,
                contact_name=contact_name
            )
            
    except Exception as e:
        logger.error(f"Failed to process WhatsApp message: {e}")


async def generate_whatsapp_response(
    phone_number: str,
    message_content: str,
    contact_name: str
):
    """Generate and send AI response via WhatsApp"""
    
    try:
        # Generate response using LiteLLM
        response = await smart_router.chat_completion(
            messages=[
                {
                    "role": "system",
                    "content": """Eres Synthia de Kupuri Studios en WhatsApp.
                    Sé concisa y amigable. Usa emojis ocasionalmente.
                    Responde en español a menos que te hablen en otro idioma."""
                },
                {
                    "role": "user",
                    "content": message_content
                }
            ],
            task_type="simple"
        )
        
        ai_message = response.get("choices", [{}])[0].get("message", {}).get("content", "")
        
        if ai_message:
            # Send via WhatsApp Cloud API
            await send_whatsapp_message(phone_number, ai_message)
            logger.info(f"✅ WhatsApp response sent to {phone_number}")
            
    except Exception as e:
        logger.error(f"Failed to generate WhatsApp response: {e}")


async def send_whatsapp_message(phone_number: str, message: str):
    """Send message via WhatsApp Cloud API"""
    
    import httpx
    import os
    
    access_token = os.getenv("WHATSAPP_ACCESS_TOKEN")
    phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
    
    if not access_token or not phone_number_id:
        logger.error("WhatsApp credentials not configured")
        return
        
    url = f"https://graph.facebook.com/v18.0/{phone_number_id}/messages"
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": phone_number,
        "type": "text",
        "text": {
            "body": message
        }
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, json=payload)
        response.raise_for_status()
        
    logger.info(f"📤 WhatsApp message sent to {phone_number}")


async def handle_whatsapp_status(status: Dict):
    """Handle WhatsApp message status update"""
    
    status_type = status.get("status", "")
    message_id = status.get("id", "")
    recipient = status.get("recipient_id", "")
    
    logger.debug(f"📊 WhatsApp status: {status_type} for {message_id}")
    
    # Could update message status in database
    # sent -> delivered -> read


# ===========================================
# STRIPE WEBHOOKS
# ===========================================

@router.post("/stripe")
async def stripe_webhook(request: Request):
    """
    Handle Stripe webhook events.
    
    Events:
    - checkout.session.completed
    - customer.subscription.created
    - customer.subscription.updated
    - customer.subscription.deleted
    - invoice.paid
    - invoice.payment_failed
    """
    import os
    import stripe
    
    stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
    endpoint_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
    
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        )
    except ValueError as e:
        logger.error(f"Invalid Stripe payload: {e}")
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid Stripe signature: {e}")
        raise HTTPException(status_code=400, detail="Invalid signature")
        
    event_type = event["type"]
    event_data = event["data"]["object"]
    
    logger.info(f"💳 Stripe webhook: {event_type}")
    
    if event_type == "checkout.session.completed":
        await handle_checkout_completed(event_data)
    elif event_type == "customer.subscription.updated":
        await handle_subscription_updated(event_data)
    elif event_type == "customer.subscription.deleted":
        await handle_subscription_deleted(event_data)
    elif event_type == "invoice.paid":
        await handle_invoice_paid(event_data)
    elif event_type == "invoice.payment_failed":
        await handle_payment_failed(event_data)
        
    return {"status": "ok", "event": event_type}


async def handle_checkout_completed(session: Dict):
    """Handle successful checkout"""
    customer_id = session.get("customer")
    subscription_id = session.get("subscription")
    
    logger.info(f"✅ Checkout completed for customer {customer_id}")
    # Update user subscription in database


async def handle_subscription_updated(subscription: Dict):
    """Handle subscription update"""
    subscription_id = subscription.get("id")
    status = subscription.get("status")
    
    logger.info(f"📝 Subscription {subscription_id} updated: {status}")
    # Update subscription status in database


async def handle_subscription_deleted(subscription: Dict):
    """Handle subscription cancellation"""
    subscription_id = subscription.get("id")
    
    logger.info(f"❌ Subscription {subscription_id} deleted")
    # Update user to free tier


async def handle_invoice_paid(invoice: Dict):
    """Handle successful payment"""
    customer_id = invoice.get("customer")
    amount = invoice.get("amount_paid", 0) / 100  # Convert cents to dollars
    
    logger.info(f"💰 Invoice paid: ${amount} from customer {customer_id}")
    # Record payment, reset monthly credits


async def handle_payment_failed(invoice: Dict):
    """Handle failed payment"""
    customer_id = invoice.get("customer")
    
    logger.warning(f"⚠️ Payment failed for customer {customer_id}")
    # Send notification, update subscription status


# ===========================================
# CONFIGURATION ENDPOINTS
# ===========================================

@router.get("/config")
async def get_webhook_config():
    """Get current webhook configuration"""
    return {
        "chatwoot_enabled": True,
        "whatsapp_enabled": bool(os.getenv("WHATSAPP_ACCESS_TOKEN")),
        "stripe_enabled": bool(os.getenv("STRIPE_SECRET_KEY")),
        "auto_response": {
            "enabled": auto_response_config.enabled,
            "greeting": auto_response_config.greeting_message[:50] + "...",
            "business_hours": f"{auto_response_config.business_hours_start}:00 - {auto_response_config.business_hours_end}:00"
        }
    }


@router.post("/config/auto-response")
async def update_auto_response_config(config: AutoResponseConfig):
    """Update auto-response configuration"""
    global auto_response_config
    auto_response_config = config
    
    logger.info(f"🔧 Auto-response config updated: enabled={config.enabled}")
    
    return {"status": "updated", "config": config.dict()}


# Import at module level for config
import os
