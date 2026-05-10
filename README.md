# LLM Council

![llmcouncil](header.jpg)

The idea of this repo is that instead of asking a question to your favorite LLM provider (e.g. OpenAI GPT 5.1, Google Gemini 3.0 Pro, Anthropic Claude Sonnet 4.5, xAI Grok 4, eg.c), you can group them into your "LLM Council". This repo is a simple, local web app that essentially looks like ChatGPT except it uses OpenRouter to send your query to multiple LLMs, it then asks them to review and rank each other's work, and finally a Chairman LLM produces the final response.

In a bit more detail, here is what happens when you submit a query:

1. **Stage 1: First opinions**. The user query is given to all LLMs individually, and the responses are collected. The individual responses are shown in a "tab view", so that the user can inspect them all one by one.
2. **Stage 2: Review**. Each individual LLM is given the responses of the other LLMs. Under the hood, the LLM identities are anonymized so that the LLM can't play favorites when judging their outputs. The LLM is asked to rank them in accuracy and insight.
3. **Stage 3: Final response**. The designated Chairman of the LLM Council takes all of the model's responses and compiles them into a single final answer that is presented to the user.

## About this fork

This is a fork of [karpathy/llm-council](https://github.com/karpathy/llm-council), originally vibe-coded as a Saturday hack to explore multiple LLMs side by side. This fork extends the original with a richer UI and additional features — see the Features section below for the full list. It is provided as-is for inspiration; ask your LLM to adapt it however you like.

## Setup

### 1. Install Dependencies

The project uses [uv](https://docs.astral.sh/uv/) for project management.

**Backend:**
```bash
uv sync
```

**Frontend:**
```bash
cd frontend
npm install
cd ..
```

### 2. Configure API Key

Copy the example file and add your key:

```bash
cp .env.example .env
```

Then edit `.env` and replace the placeholder with your actual key. Get your API key at [openrouter.ai](https://openrouter.ai/). Make sure to purchase the credits you need, or sign up for automatic top up.

### 3. Configure Models (Optional)

The default models are set in `backend/config.py`, but you can change them at any time from the **Settings** panel (⚙ icon) in the app's sidebar — no restart required.

## Running the Application

**Option 1: Use the start script**
```bash
./start.sh
```

**Option 2: Run manually**

Terminal 1 (Backend):
```bash
uv run python -m backend.main
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

Then open http://localhost:5173 in your browser.

## Features

- **Multi-model deliberation** — Stage 1 collects parallel responses, Stage 2 cross-ranks them anonymously, Stage 3 synthesizes the final answer.
- **Collapsible stages** — Stage 1 and 3 start expanded; Stage 2 (peer reviews) starts collapsed to keep the view clean.
- **Multi-turn conversations** — An optional "Include context" toggle passes the conversation history to all three stages so follow-up questions work naturally.
- **System prompt** — An optional system prompt field lets you give context or persona instructions that apply to all three stages.
- **Re-run council** — A ↺ button on any completed response re-runs the full council on the same question, replacing the previous answer.
- **Model configuration UI** — Change the council models and chairman directly from the ⚙ Settings panel; the change persists and takes effect immediately without a restart.
- **Model statistics** — The ▤ icon opens a dashboard showing each model's average rank, win count, and win rate across all past council runs. Stats can be reset to start fresh.
- **Performance metrics** — The ~ icon opens a metrics dashboard with latency, token usage, and cost per model for the latest run and aggregated historical averages (powered by Recharts).
- **Light / dark theme** — Toggle with the ☾/☀ button in the sidebar header.
- **Conversation search** — Filter the sidebar list in real time by title.
- **Markdown export** — Export any conversation to a `.md` file.
- **Delete conversations** — Remove individual conversations from the sidebar.

## Tech Stack

- **Backend:** FastAPI (Python 3.10+), async httpx, OpenRouter API
- **Frontend:** React + Vite, react-markdown, Recharts
- **Storage:** JSON files in `data/conversations/`
- **Package Management:** uv for Python, npm for JavaScript

## Credits

This project is hosted at [paolosereno/multi-llm-council](https://github.com/paolosereno/multi-llm-council).
Based on [karpathy/llm-council](https://github.com/karpathy/llm-council) by Andrej Karpathy.
