"""FastAPI backend for LLM Council."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
import uuid
import json
import asyncio

from . import storage
from .config import get_runtime_config, update_runtime_config
from .council import run_full_council, generate_conversation_title, stage1_collect_responses, stage2_collect_rankings, stage3_synthesize_final, calculate_aggregate_rankings

app = FastAPI(title="LLM Council API")

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CreateConversationRequest(BaseModel):
    """Request to create a new conversation."""
    pass


class SendMessageRequest(BaseModel):
    """Request to send a message in a conversation."""
    content: str
    system_prompt: Optional[str] = None
    history: Optional[List[Dict[str, str]]] = None


class CouncilConfigRequest(BaseModel):
    council_models: List[str]
    chairman_model: str


class ConversationMetadata(BaseModel):
    """Conversation metadata for list view."""
    id: str
    created_at: str
    title: str
    message_count: int


class Conversation(BaseModel):
    """Full conversation with all messages."""
    id: str
    created_at: str
    title: str
    messages: List[Dict[str, Any]]


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "service": "LLM Council API"}


@app.get("/api/conversations", response_model=List[ConversationMetadata])
async def list_conversations():
    """List all conversations (metadata only)."""
    return storage.list_conversations()


@app.post("/api/conversations", response_model=Conversation)
async def create_conversation(request: CreateConversationRequest):
    """Create a new conversation."""
    conversation_id = str(uuid.uuid4())
    conversation = storage.create_conversation(conversation_id)
    return conversation


@app.get("/api/conversations/{conversation_id}", response_model=Conversation)
async def get_conversation(conversation_id: str):
    """Get a specific conversation with all its messages."""
    conversation = storage.get_conversation(conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation


def _stats_reset_path():
    return os.path.join(os.path.dirname(storage.DATA_DIR), "stats_reset.json")


def _get_stats_reset_at():
    path = _stats_reset_path()
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f).get("reset_at")
    return None


@app.get("/api/stats")
async def get_stats():
    """Aggregate model performance statistics across all stored conversations."""
    from collections import defaultdict
    from .council import parse_ranking_from_text

    reset_at = _get_stats_reset_at()
    storage.ensure_data_dir()
    model_stats = defaultdict(lambda: {'appearances': 0, 'rankings_received': 0, 'rank_sum': 0, 'wins': 0})
    total_runs = 0

    for filename in os.listdir(storage.DATA_DIR):
        if not filename.endswith('.json'):
            continue
        conv = storage.get_conversation(filename[:-5])
        if conv is None:
            continue

        if reset_at and conv.get("created_at", "") < reset_at:
            continue

        for msg in conv.get('messages', []):
            if msg.get('role') != 'assistant':
                continue
            stage1 = msg.get('stage1') or []
            stage2 = msg.get('stage2') or []
            if not stage1 or not stage2:
                continue

            total_runs += 1

            for result in stage1:
                model_stats[result['model']]['appearances'] += 1

            label_to_model = {
                f"Response {chr(65 + i)}": result['model']
                for i, result in enumerate(stage1)
            }

            for ranking in stage2:
                parsed = parse_ranking_from_text(ranking.get('ranking', ''))
                for pos, label in enumerate(parsed, start=1):
                    if label in label_to_model:
                        model = label_to_model[label]
                        model_stats[model]['rankings_received'] += 1
                        model_stats[model]['rank_sum'] += pos
                        if pos == 1:
                            model_stats[model]['wins'] += 1

    stats = []
    for model, s in model_stats.items():
        rc = s['rankings_received']
        stats.append({
            'model': model,
            'appearances': s['appearances'],
            'rankings_received': rc,
            'average_rank': round(s['rank_sum'] / rc, 2) if rc > 0 else None,
            'wins': s['wins'],
            'win_rate': round(s['wins'] / rc, 2) if rc > 0 else 0,
        })

    stats.sort(key=lambda x: (x['average_rank'] or 999))

    return {'models': stats, 'total_council_runs': total_runs, 'reset_at': reset_at}


@app.post("/api/stats/reset")
async def reset_stats():
    """Reset statistics: only conversations after this point will be counted."""
    from datetime import datetime
    reset_at = datetime.utcnow().isoformat()
    path = _stats_reset_path()
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        json.dump({"reset_at": reset_at}, f)
    return {"reset_at": reset_at}


@app.get("/api/metrics")
async def get_metrics():
    """Aggregate latency and token metrics across stored conversations."""
    from collections import defaultdict

    reset_at = _get_stats_reset_at()
    storage.ensure_data_dir()

    model_data = defaultdict(lambda: {'latencies': [], 'prompt_tokens': [], 'completion_tokens': [], 'costs': []})
    total_runs = 0

    for filename in os.listdir(storage.DATA_DIR):
        if not filename.endswith('.json'):
            continue
        conv = storage.get_conversation(filename[:-5])
        if conv is None:
            continue
        if reset_at and conv.get("created_at", "") < reset_at:
            continue

        for msg in conv.get('messages', []):
            if msg.get('role') != 'assistant':
                continue
            stage1 = msg.get('stage1') or []
            if not stage1 or not any(r.get('latency_ms') is not None for r in stage1):
                continue

            total_runs += 1
            for result in stage1:
                model = result['model']
                if result.get('latency_ms') is not None:
                    model_data[model]['latencies'].append(result['latency_ms'])
                if result.get('prompt_tokens') is not None:
                    model_data[model]['prompt_tokens'].append(result['prompt_tokens'])
                    model_data[model]['completion_tokens'].append(result['completion_tokens'])
                if result.get('cost') is not None:
                    model_data[model]['costs'].append(result['cost'])

    by_model = []
    for model, d in model_data.items():
        entry = {
            'model': model,
            'short_name': model.split('/')[-1],
            'sample_count': len(d['latencies']),
        }
        if d['latencies']:
            entry['avg_latency_ms'] = round(sum(d['latencies']) / len(d['latencies']))
        if d['prompt_tokens']:
            entry['avg_prompt_tokens'] = round(sum(d['prompt_tokens']) / len(d['prompt_tokens']))
            entry['avg_completion_tokens'] = round(sum(d['completion_tokens']) / len(d['completion_tokens']))
        if d['costs']:
            entry['avg_cost'] = sum(d['costs']) / len(d['costs'])
            entry['total_cost'] = sum(d['costs'])
        by_model.append(entry)

    by_model.sort(key=lambda x: x.get('avg_latency_ms', 0))

    # Aggregate Stage 3 (chairman) data separately
    s3_data = defaultdict(lambda: {'latencies': [], 'prompt_tokens': [], 'completion_tokens': [], 'costs': []})
    for filename in os.listdir(storage.DATA_DIR):
        if not filename.endswith('.json'):
            continue
        conv = storage.get_conversation(filename[:-5])
        if conv is None:
            continue
        if reset_at and conv.get("created_at", "") < reset_at:
            continue
        for msg in conv.get('messages', []):
            if msg.get('role') != 'assistant':
                continue
            s3 = msg.get('stage3') or {}
            model = s3.get('model')
            if not model or s3.get('latency_ms') is None:
                continue
            s3_data[model]['latencies'].append(s3['latency_ms'])
            if s3.get('prompt_tokens') is not None:
                s3_data[model]['prompt_tokens'].append(s3['prompt_tokens'])
                s3_data[model]['completion_tokens'].append(s3['completion_tokens'])
            if s3.get('cost') is not None:
                s3_data[model]['costs'].append(s3['cost'])

    chairman_stats = []
    for model, d in s3_data.items():
        entry = {
            'model': model,
            'short_name': model.split('/')[-1],
            'sample_count': len(d['latencies']),
        }
        if d['latencies']:
            entry['avg_latency_ms'] = round(sum(d['latencies']) / len(d['latencies']))
        if d['prompt_tokens']:
            entry['avg_prompt_tokens'] = round(sum(d['prompt_tokens']) / len(d['prompt_tokens']))
            entry['avg_completion_tokens'] = round(sum(d['completion_tokens']) / len(d['completion_tokens']))
        if d['costs']:
            entry['avg_cost'] = sum(d['costs']) / len(d['costs'])
            entry['total_cost'] = sum(d['costs'])
        chairman_stats.append(entry)

    return {'by_model': by_model, 'chairman': chairman_stats, 'total_runs': total_runs}


@app.get("/api/models")
async def list_available_models():
    """Fetch available models from OpenRouter and return a simplified list."""
    import httpx
    from .config import OPENROUTER_API_KEY

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://openrouter.ai/api/v1/models",
            headers={"Authorization": f"Bearer {OPENROUTER_API_KEY}"},
            timeout=10.0,
        )
        if not resp.is_success:
            raise HTTPException(status_code=502, detail="Failed to fetch models from OpenRouter")
        data = resp.json()

    models = [
        {
            "id": m["id"],
            "name": m.get("name", m["id"]),
        }
        for m in data.get("data", [])
    ]
    models.sort(key=lambda x: x["name"].lower())
    return {"models": models}


@app.get("/api/config")
async def get_config():
    """Get current council configuration."""
    return get_runtime_config()


@app.put("/api/config")
async def set_config(request: CouncilConfigRequest):
    """Update council configuration."""
    return update_runtime_config(request.council_models, request.chairman_model)


@app.delete("/api/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """Delete a conversation."""
    deleted = storage.delete_conversation(conversation_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"status": "deleted"}


@app.post("/api/conversations/{conversation_id}/message")
async def send_message(conversation_id: str, request: SendMessageRequest):
    """
    Send a message and run the 3-stage council process.
    Returns the complete response with all stages.
    """
    # Check if conversation exists
    conversation = storage.get_conversation(conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Check if this is the first message
    is_first_message = len(conversation["messages"]) == 0

    # Add user message
    storage.add_user_message(conversation_id, request.content, request.system_prompt)

    # If this is the first message, generate a title
    if is_first_message:
        title = await generate_conversation_title(request.content)
        storage.update_conversation_title(conversation_id, title)

    # Run the 3-stage council process
    stage1_results, stage2_results, stage3_result, metadata = await run_full_council(
        request.content, request.system_prompt, request.history
    )

    # Add assistant message with all stages
    storage.add_assistant_message(
        conversation_id,
        stage1_results,
        stage2_results,
        stage3_result
    )

    # Return the complete response with metadata
    return {
        "stage1": stage1_results,
        "stage2": stage2_results,
        "stage3": stage3_result,
        "metadata": metadata
    }


@app.post("/api/conversations/{conversation_id}/message/stream")
async def send_message_stream(conversation_id: str, request: SendMessageRequest):
    """
    Send a message and stream the 3-stage council process.
    Returns Server-Sent Events as each stage completes.
    """
    # Check if conversation exists
    conversation = storage.get_conversation(conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Check if this is the first message
    is_first_message = len(conversation["messages"]) == 0

    async def event_generator():
        try:
            # Add user message
            storage.add_user_message(conversation_id, request.content)

            # Start title generation in parallel (don't await yet)
            title_task = None
            if is_first_message:
                title_task = asyncio.create_task(generate_conversation_title(request.content))

            # Stage 1: Collect responses
            yield f"data: {json.dumps({'type': 'stage1_start'})}\n\n"
            stage1_results = await stage1_collect_responses(request.content, request.system_prompt, request.history)
            yield f"data: {json.dumps({'type': 'stage1_complete', 'data': stage1_results})}\n\n"

            # Stage 2: Collect rankings
            yield f"data: {json.dumps({'type': 'stage2_start'})}\n\n"
            stage2_results, label_to_model = await stage2_collect_rankings(request.content, stage1_results, request.system_prompt, request.history)
            aggregate_rankings = calculate_aggregate_rankings(stage2_results, label_to_model)
            yield f"data: {json.dumps({'type': 'stage2_complete', 'data': stage2_results, 'metadata': {'label_to_model': label_to_model, 'aggregate_rankings': aggregate_rankings}})}\n\n"

            # Stage 3: Synthesize final answer
            yield f"data: {json.dumps({'type': 'stage3_start'})}\n\n"
            stage3_result = await stage3_synthesize_final(request.content, stage1_results, stage2_results, request.system_prompt, request.history)
            yield f"data: {json.dumps({'type': 'stage3_complete', 'data': stage3_result})}\n\n"

            # Wait for title generation if it was started
            if title_task:
                title = await title_task
                storage.update_conversation_title(conversation_id, title)
                yield f"data: {json.dumps({'type': 'title_complete', 'data': {'title': title}})}\n\n"

            # Save complete assistant message
            storage.add_assistant_message(
                conversation_id,
                stage1_results,
                stage2_results,
                stage3_result
            )

            # Send completion event
            yield f"data: {json.dumps({'type': 'complete'})}\n\n"

        except Exception as e:
            # Send error event
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@app.post("/api/conversations/{conversation_id}/message/rerun")
async def rerun_message(conversation_id: str, request: SendMessageRequest):
    """
    Re-run the council on the same question, replacing the last assistant message.
    """
    conversation = storage.get_conversation(conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    async def event_generator():
        try:
            yield f"data: {json.dumps({'type': 'stage1_start'})}\n\n"
            stage1_results = await stage1_collect_responses(request.content, request.system_prompt)
            yield f"data: {json.dumps({'type': 'stage1_complete', 'data': stage1_results})}\n\n"

            yield f"data: {json.dumps({'type': 'stage2_start'})}\n\n"
            stage2_results, label_to_model = await stage2_collect_rankings(request.content, stage1_results, request.system_prompt)
            aggregate_rankings = calculate_aggregate_rankings(stage2_results, label_to_model)
            yield f"data: {json.dumps({'type': 'stage2_complete', 'data': stage2_results, 'metadata': {'label_to_model': label_to_model, 'aggregate_rankings': aggregate_rankings}})}\n\n"

            yield f"data: {json.dumps({'type': 'stage3_start'})}\n\n"
            stage3_result = await stage3_synthesize_final(request.content, stage1_results, stage2_results, request.system_prompt)
            yield f"data: {json.dumps({'type': 'stage3_complete', 'data': stage3_result})}\n\n"

            storage.replace_last_assistant_message(conversation_id, stage1_results, stage2_results, stage3_result)

            yield f"data: {json.dumps({'type': 'complete'})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
