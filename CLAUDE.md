# CLAUDE.md - Technical Notes for Multi LLM Council

This file contains technical details, architectural decisions, and important implementation notes for future development sessions.

## Project Overview

Multi LLM Council is a 3-stage deliberation system where multiple LLMs collaboratively answer user questions. The key innovation is anonymized peer review in Stage 2, preventing models from playing favorites.

## Architecture

### Backend Structure (`backend/`)

**`config.py`**
- Contains `COUNCIL_MODELS` (list of OpenRouter model identifiers)
- Contains `CHAIRMAN_MODEL` (model that synthesizes final answer)
- Runtime config also stores `fast_models` and `budget_models` (default: empty lists)
- `get_runtime_config()`: loads from `data/council_config.json`, adds missing keys with `setdefault`
- `update_runtime_config()`: accepts `council_models`, `chairman_model`, `fast_models`, `budget_models`
- Uses environment variable `OPENROUTER_API_KEY` from `.env`
- Backend runs on **port 8001** (NOT 8000 - user had another app on 8000)

**`openrouter.py`**
- `query_model()`: Single async model query
- `query_models_parallel()`: Parallel queries using `asyncio.gather()`
- Returns dict with `content`, `latency_ms`, `prompt_tokens`, `completion_tokens`, `cost`
- Graceful degradation: returns None on failure, continues with successful responses
- Headers include `X-Title: LLM Council` and `HTTP-Referer` for OpenRouter app identification

**`council.py`** - The Core Logic
- `_models_for_stage(execution_mode, stage)`: selects the correct model list based on mode and stage
  - `normal`: council_models for both stages
  - `fast`: fast_models (fallback to council_models if empty)
  - `budget`: budget_models (fallback to council_models if empty)
  - `hybrid`: council_models for stage 1, budget_models for stage 2 (fallback if empty)
- `stage1_collect_responses(user_query, system_prompt, history, execution_mode)`: parallel queries
- `stage2_collect_rankings(user_query, stage1_results, system_prompt, history, execution_mode)`:
  - Anonymizes responses as "Response A, B, C, etc."
  - Creates `label_to_model` mapping for de-anonymization
  - Prompts models to evaluate and rank (with strict format requirements)
  - Returns tuple: (rankings_list, label_to_model_dict)
  - Each ranking includes both raw text and `parsed_ranking` list
- `stage3_synthesize_final()`: Chairman synthesizes from all responses + rankings (always uses chairman_model)
- `parse_ranking_from_text()`: Extracts "FINAL RANKING:" section, handles both numbered lists and plain format
- `calculate_aggregate_rankings()`: Computes average rank position across all peer evaluations

**`storage.py`**
- JSON-based conversation storage in `data/conversations/`
- Each conversation: `{id, created_at, messages[]}`
- Assistant messages contain: `{role, stage1, stage2, stage3}`
- Note: metadata (label_to_model, aggregate_rankings) is NOT persisted to storage, only returned via API

**`main.py`**
- FastAPI app with CORS enabled for localhost:5173 and localhost:3000
- `SendMessageRequest` includes `execution_mode: str = 'normal'`
- `CouncilConfigRequest` includes `fast_models: List[str] = []` and `budget_models: List[str] = []`
- `GET /api/models`: proxy to OpenRouter models list, returns `id`, `name`, `pricing` per model
- `GET /api/config` / `PUT /api/config`: read/write runtime config including fast/budget model lists
- `GET /api/stats`: aggregate model performance statistics
- `GET /api/metrics`: latency, token usage, cost per model (Stage 1 and Stage 3)
- Streaming endpoints pass `execution_mode` to `stage1_collect_responses` and `stage2_collect_rankings`

### Frontend Structure (`frontend/src/`)

**`App.jsx`**
- Main orchestration: manages conversations list and current conversation
- Handles message sending and metadata storage
- `handleSendMessage(content, systemPrompt, history, executionMode)`: passes executionMode to API
- `handleRerun(content, systemPrompt, targetIndex, executionMode)`: passes executionMode to API
- Important: metadata is stored in the UI state for display but not persisted to backend JSON

**`api.js`**
- `sendMessageStream(conversationId, content, systemPrompt, history, executionMode, onEvent)`
- `rerunStream(conversationId, content, systemPrompt, executionMode, onEvent)`
- `getModels()`: calls `GET /api/models` to fetch OpenRouter model catalogue

**`components/ChatInterface.jsx`**
- Multiline textarea (3 rows, resizable)
- Enter to send, Shift+Enter for new line
- Execution mode selector: Normal / Fast / Budget / Hybrid buttons
- Fetches config on mount to detect empty fast_models / budget_models; shows ⚠ on affected mode buttons with tooltip explaining the fallback
- executionMode state is local to ChatInterface, passed in `onSendMessage` and `onRerun` calls

**`components/SettingsModal.jsx`**
- Four model list sections: Council Models, Fast Models, Budget Models, Chairman Model
- Each list uses `ModelComboBox` component: searchable dropdown fetching live from `GET /api/models`
- Dropdown shows model name, ID (monospace), and pricing (per 1M tokens or "free")
- Summary table at top shows which list each execution mode uses per stage
- `min-height: 70vh`, `max-height: 92vh` for comfortable browsing

**`components/Stage1.jsx`**
- Tab view of individual model responses
- ReactMarkdown rendering with markdown-content wrapper

**`components/Stage2.jsx`**
- Tab view showing RAW evaluation text from each model
- De-anonymization happens CLIENT-SIDE for display
- Shows "Extracted Ranking" below each evaluation so users can validate parsing
- Aggregate rankings shown with average position and vote count

**`components/Stage3.jsx`**
- Final synthesized answer from chairman
- Green-tinted background (#f0fff0) to highlight conclusion

**`components/MetricsModal.jsx`**
- Two tabs: "Latest run" and "Historical"
- Shows latency, token usage, cost per model for Stage 1, Stage 2, and Stage 3
- Uses Recharts (BarChart, ResponsiveContainer)
- `formatCost()`: shows USD values per 1M tokens; shows "free" for 0

**Styling (`*.css`)**
- Light/dark theme via CSS variables (`var(--bg-*)`, `var(--text-*)`, etc.)
- Primary color: #4a90e2 (blue)
- Global markdown styling in `index.css` with `.markdown-content` class

## Key Design Decisions

### Execution Modes
- Mode is selected per-message in the chat UI (not a global setting)
- `normal` is the default; other modes require the corresponding model lists to be configured
- If a model list is empty, falls back to council_models silently
- When an unconfigured mode is selected: the active button turns orange (`.mode-btn-warn`) and an inline warning message appears below the selector explaining the fallback and directing the user to ⚙ Settings
- Warning logic: Fast → check `emptyLists.fast`; Budget → check `emptyLists.budget`; Hybrid → check `emptyLists.budget` (Stage 2 uses Budget)
- `emptyLists` state is populated by fetching config on ChatInterface mount

### Model Selection for Searchable Dropdown
- Backend proxies `GET https://openrouter.ai/api/v1/models` to avoid exposing API key in frontend
- Returns `id`, `name`, `pricing` per model, sorted alphabetically by name
- Frontend filters by name or id as user types; shows up to 25 results

### Stage 2 Prompt Format
The Stage 2 prompt is very specific to ensure parseable output:
```
1. Evaluate each response individually first
2. Provide "FINAL RANKING:" header
3. Numbered list format: "1. Response C", "2. Response A", etc.
4. No additional text after ranking section
```

### De-anonymization Strategy
- Models receive: "Response A", "Response B", etc.
- Backend creates mapping: `{"Response A": "openai/gpt-5.1", ...}`
- Frontend displays model names in **bold** for readability
- This prevents bias while maintaining transparency

### Error Handling Philosophy
- Continue with successful responses if some models fail (graceful degradation)
- Never fail the entire request due to single model failure
- Log errors but don't expose to user unless all models fail

## Important Implementation Details

### Relative Imports
All backend modules use relative imports (e.g., `from .config import ...`) not absolute imports. This is critical for Python's module system to work correctly when running as `python -m backend.main`.

### Port Configuration
- Backend: 8001 (changed from 8000 to avoid conflict)
- Frontend: 5173 (Vite default)
- Update both `backend/main.py` and `frontend/src/api.js` if changing

### Markdown Rendering
All ReactMarkdown components must be wrapped in `<div className="markdown-content">` for proper spacing. This class is defined globally in `index.css`.

### Model Configuration Persistence
Runtime config is saved to `data/council_config.json`. The file includes all four lists (council_models, chairman_model, fast_models, budget_models). `get_runtime_config()` uses `setdefault` to add missing keys when loading old config files.

## Common Gotchas

1. **Module Import Errors**: Always run backend as `python -m backend.main` from project root, not from backend directory
2. **CORS Issues**: Frontend must match allowed origins in `main.py` CORS middleware
3. **Ranking Parse Failures**: If models don't follow format, fallback regex extracts any "Response X" patterns in order
4. **Missing Metadata**: Metadata is ephemeral (not persisted), only available in API responses
5. **Model list fallback**: Empty fast_models or budget_models silently fall back to council_models — check ⚠ in UI

## Features Implemented (as of 2026-05-10)

- Multi-model deliberation (3 stages, async/parallel)
- Collapsible stages in UI
- Multi-turn conversations with optional context toggle
- System prompt field
- Re-run council on same question
- Execution modes: Normal / Fast / Budget / Hybrid
- Model configuration UI with searchable OpenRouter dropdown (name + pricing)
- Separate model lists for Council, Fast, Budget modes
- Model statistics dashboard (avg rank, win rate)
- Performance metrics dashboard (latency, tokens, cost — Recharts)
- Real cost tracking from OpenRouter `usage.cost`
- Light / dark theme
- Conversation search, delete, Markdown export

## Data Flow Summary

```
User Query + executionMode
    ↓
_models_for_stage(mode, 1) → Stage 1 model list
Stage 1: Parallel queries → [individual responses]
    ↓
_models_for_stage(mode, 2) → Stage 2 model list
Stage 2: Anonymize → Parallel ranking queries → [evaluations + parsed rankings]
    ↓
Aggregate Rankings Calculation → [sorted by avg position]
    ↓
Stage 3: Chairman synthesis (always uses chairman_model)
    ↓
Return: {stage1, stage2, stage3, metadata}
    ↓
Frontend: Display with tabs + validation UI
```

The entire flow is async/parallel where possible to minimize latency.
