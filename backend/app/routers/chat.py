# Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
# YesBill -- Daily Billing Tracker
# Created by Ishan Chakraborty

"""Chat endpoints: conversations, streaming messages, agent, rephrase, export."""
import json
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.core.security import get_current_user_id
from app.services.supabase import supabase_service
from app.services.chat_service import (
    get_models_payload,
    run_model_probe_suite,
    get_or_generate_reasoning_summary,
    stream_response,
    rephrase_text,
)
from app.services.agent_service import (
    stream_agent_response,
    execute_confirmed_action,
)

router = APIRouter(prefix="/chat", tags=["chat"])


# ──────────────────────────────────────────────
# Schemas
# ──────────────────────────────────────────────

class CreateConversationRequest(BaseModel):
    title: Optional[str] = "New Conversation"
    conv_type: Optional[str] = "main"


class RenameConversationRequest(BaseModel):
    title: str


class SendMessageRequest(BaseModel):
    content: str
    context_tags: Optional[list[str]] = []
    model: Optional[str] = None  # override the default model
    reasoning_effort: Optional[str] = "none"  # none | low | medium | high | xhigh


class RephraseRequest(BaseModel):
    text: str


class ExecuteActionRequest(BaseModel):
    action_id: str
    confirmed: bool


class FeedbackRequest(BaseModel):
    conv_id: str
    feedback: str  # 'positive' or 'negative'


class ModelProbeRequest(BaseModel):
    provider: Optional[str] = None
    force_refresh: bool = True


class ReasoningSummaryRequest(BaseModel):
    conv_id: str


# ──────────────────────────────────────────────
# Models
# ──────────────────────────────────────────────

@router.get("/models", summary="List available models for the user's configured provider")
async def list_models(user_id: str = Depends(get_current_user_id)):
    payload = await get_models_payload(user_id)
    return payload


@router.post("/models/probe", summary="Probe model availability and refresh user cache")
async def probe_models(
    body: Optional[ModelProbeRequest] = None,
    user_id: str = Depends(get_current_user_id),
):
    payload = body or ModelProbeRequest()
    report = await run_model_probe_suite(
        user_id=user_id,
        provider_filter=payload.provider,
        force_refresh=payload.force_refresh,
    )
    return report


# ──────────────────────────────────────────────
# Conversation CRUD
# ──────────────────────────────────────────────

@router.get("/conversations", summary="List conversations")
async def list_conversations(
    conv_type: Optional[str] = None,
    user_id: str = Depends(get_current_user_id),
):
    conversations = await supabase_service.list_conversations(user_id, conv_type)
    return {"conversations": conversations}


@router.post("/conversations", status_code=status.HTTP_201_CREATED, summary="Create conversation")
async def create_conversation(
    body: CreateConversationRequest,
    user_id: str = Depends(get_current_user_id),
):
    conversation = await supabase_service.create_conversation(
        user_id, body.title or "New Conversation", body.conv_type or "main"
    )
    return conversation


@router.patch("/conversations/{conv_id}", summary="Rename conversation")
async def rename_conversation(
    conv_id: str,
    body: RenameConversationRequest,
    user_id: str = Depends(get_current_user_id),
):
    result = await supabase_service.update_conversation_title(conv_id, user_id, body.title)
    if not result:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return result


@router.delete("/conversations/{conv_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete conversation")
async def delete_conversation(
    conv_id: str,
    user_id: str = Depends(get_current_user_id),
):
    deleted = await supabase_service.delete_conversation(conv_id, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Conversation not found")


@router.delete("/conversations", status_code=status.HTTP_204_NO_CONTENT, summary="Delete all conversations for user")
async def delete_all_conversations(
    user_id: str = Depends(get_current_user_id),
    conv_type: Optional[str] = None,
):
    """Delete all chat conversations for the authenticated user (cascades to messages + agent_actions via FK).

    Optional query param ?conv_type=agent|main limits deletion to that type only.
    """
    await supabase_service.delete_all_conversations(user_id, conv_type=conv_type)


# ──────────────────────────────────────────────
# Messages
# ──────────────────────────────────────────────

@router.get("/conversations/{conv_id}/messages", summary="Get messages in a conversation")
async def get_messages(
    conv_id: str,
    user_id: str = Depends(get_current_user_id),
):
    # Verify ownership
    conv = await supabase_service.get_conversation(conv_id, user_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    messages = await supabase_service.get_messages(conv_id, user_id)
    return {"messages": messages}


@router.post("/conversations/{conv_id}/messages", summary="Send a message (SSE streaming)")
async def send_message(
    conv_id: str,
    body: SendMessageRequest,
    user_id: str = Depends(get_current_user_id),
):
    # Verify ownership
    conv = await supabase_service.get_conversation(conv_id, user_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if not body.content.strip():
        raise HTTPException(status_code=400, detail="Message content cannot be empty")

    async def generate():
        async for event in stream_response(
            user_id=user_id,
            conv_id=conv_id,
            content=body.content.strip(),
            context_tags=body.context_tags or [],
            model_override=body.model,
            reasoning_effort=body.reasoning_effort or "none",
        ):
            yield f"data: {json.dumps(event)}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ──────────────────────────────────────────────
# Agent endpoints
# ──────────────────────────────────────────────

@router.post(
    "/agent/conversations/{conv_id}/messages",
    summary="Send an agent message (SSE — may emit action_required)",
)
async def send_agent_message(
    conv_id: str,
    body: SendMessageRequest,
    request: Request,
    user_id: str = Depends(get_current_user_id),
):
    # Verify ownership
    conv = await supabase_service.get_conversation(conv_id, user_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if not body.content.strip():
        raise HTTPException(status_code=400, detail="Message content cannot be empty")

    user_tz = request.headers.get("X-User-Timezone", "Asia/Kolkata")

    async def generate():
        async for event in stream_agent_response(
            user_id=user_id,
            conv_id=conv_id,
            content=body.content.strip(),
            user_tz=user_tz,
            reasoning_effort=body.reasoning_effort or "none",
        ):
            yield f"data: {json.dumps(event)}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/agent/execute", summary="Confirm or cancel a pending agent action")
async def execute_action(
    body: ExecuteActionRequest,
    user_id: str = Depends(get_current_user_id),
):
    if not body.confirmed:
        # Cancel the action
        result = await supabase_service.update_agent_action_status(
            body.action_id, user_id, "cancelled"
        )
        if not result:
            raise HTTPException(status_code=404, detail="Action not found")
        return {"status": "cancelled", "message": "Action cancelled."}

    # Execute the confirmed action
    try:
        result = await execute_confirmed_action(body.action_id, user_id)
        return {"status": "executed", "message": result["message"], "message_id": result["message_id"]}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ──────────────────────────────────────────────
# Rephrase (Alt+L)
# ──────────────────────────────────────────────

@router.post("/rephrase", summary="Rephrase text using AI (Alt+L)")
async def rephrase(
    body: RephraseRequest,
    user_id: str = Depends(get_current_user_id),
):
    if not body.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    rephrased = await rephrase_text(user_id, body.text.strip())
    if rephrased is None:
        raise HTTPException(status_code=503, detail="No AI configured. Go to Settings → AI Settings.")
    return {"rephrased": rephrased}


# ──────────────────────────────────────────────
# Feedback
# ──────────────────────────────────────────────

@router.post("/messages/{message_id}/feedback", summary="Save thumbs-up/down feedback for a message")
async def save_feedback(
    message_id: str,
    body: FeedbackRequest,
    user_id: str = Depends(get_current_user_id),
):
    if body.feedback not in ("positive", "negative"):
        raise HTTPException(status_code=400, detail="feedback must be 'positive' or 'negative'")
    # Verify conversation ownership
    conv = await supabase_service.get_conversation(body.conv_id, user_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    result = await supabase_service.save_message_feedback(
        user_id=user_id,
        conv_id=body.conv_id,
        message_id=message_id,
        feedback=body.feedback,
    )
    if result is None:
        raise HTTPException(status_code=500, detail="Failed to save feedback")
    return {"status": "ok", "feedback": body.feedback}


@router.post(
    "/messages/{message_id}/reasoning-summary",
    summary="Generate or fetch cached reasoning summary for a message",
)
async def reasoning_summary(
    message_id: str,
    body: ReasoningSummaryRequest,
    user_id: str = Depends(get_current_user_id),
):
    conv = await supabase_service.get_conversation(body.conv_id, user_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    result = await get_or_generate_reasoning_summary(
        user_id=user_id,
        conv_id=body.conv_id,
        message_id=message_id,
    )
    if not result.get("ok"):
        raise HTTPException(status_code=400, detail=result.get("error", "Failed to generate reasoning summary"))
    return result


# ──────────────────────────────────────────────
# Export (Markdown / All)
# ──────────────────────────────────────────────

@router.get("/conversations/export-all", summary="Export all conversations as Markdown")
async def export_all_conversations(
    format: str = "markdown",
    user_id: str = Depends(get_current_user_id),
):
    conversations = await supabase_service.list_conversations(user_id, conv_type=None)
    if not conversations:
        raise HTTPException(status_code=404, detail="No conversations found")

    if format == "markdown":
        sections: list[str] = [
            "# YesBill — All Conversations Export\n",
            f"*Exported on {datetime.now(timezone.utc).strftime('%Y-%m-%d')}*\n\n---\n",
        ]
        for conv in conversations:
            sections.append(f"\n## {conv.get('title', 'Untitled')}\n")
            sections.append(
                f"*{conv.get('updated_at', '')[:10]}*\n\n"
            )
            messages = await supabase_service.get_messages(conv["id"], user_id)
            for m in messages:
                role_label = "**You**" if m["role"] == "user" else "**YesBill Assistant**"
                sections.append(f"{role_label}\n\n{m['content']}\n\n---\n")
        content = "\n".join(sections)
        return StreamingResponse(
            iter([content]),
            media_type="text/markdown",
            headers={"Content-Disposition": 'attachment; filename="yesbill_all_conversations.md"'},
        )

    raise HTTPException(status_code=400, detail=f"Unsupported format: {format}")


@router.get("/analytics/summary", summary="Get AI usage analytics summary")
async def get_analytics_summary(
    year_month: Optional[str] = None,
    days: Optional[int] = None,
    user_id: str = Depends(get_current_user_id),
):
    """
    Return aggregated AI usage stats for the authenticated user.

    Query params (mutually exclusive, days takes priority):
    - year_month: Filter to a specific month, e.g. '2026-02'
    - days: Filter to last N days, e.g. 30

    If neither is provided, defaults to the current calendar month.
    """
    if not year_month and not days:
        from datetime import datetime, timezone
        year_month = datetime.now(timezone.utc).strftime("%Y-%m")

    return await supabase_service.get_analytics_summary(
        user_id=user_id,
        year_month=year_month if not days else None,
        days=days,
    )
@router.get("/conversations/{conv_id}/export", summary="Export conversation as Markdown")
async def export_conversation(
    conv_id: str,
    format: str = "markdown",
    user_id: str = Depends(get_current_user_id),
):
    conv = await supabase_service.get_conversation(conv_id, user_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = await supabase_service.get_messages(conv_id, user_id)

    if format == "markdown":
        lines = [f"# {conv.get('title', 'Conversation')}\n"]
        lines.append(f"*Exported from YesBill on {conv.get('updated_at', '')[:10]}*\n\n---\n")
        for m in messages:
            role_label = "**You**" if m["role"] == "user" else "**YesBill Assistant**"
            lines.append(f"{role_label}\n\n{m['content']}\n\n---\n")
        content = "\n".join(lines)
        filename = f"{conv.get('title', 'conversation').replace(' ', '_')}.md"
        return StreamingResponse(
            iter([content]),
            media_type="text/markdown",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    raise HTTPException(status_code=400, detail=f"Unsupported format: {format}")


