# Multi LLM Council — User Manual

## Table of Contents

1. [How it works](#how-it-works)
2. [Sending a message](#sending-a-message)
3. [System prompt](#system-prompt)
4. [Multi-turn conversation](#multi-turn-conversation)
5. [Execution mode](#execution-mode)
6. [Re-run](#re-run)
7. [Managing conversations](#managing-conversations)
8. [Model configuration](#model-configuration)
9. [Model catalogue](#model-catalogue)
10. [Model statistics](#model-statistics)
11. [Performance metrics](#performance-metrics)
12. [Light / dark theme](#light--dark-theme)

---

## ⚡ How it works

When you submit a query, the council runs a three-stage deliberation process:

| Stage | What happens |
|-------|-------------|
| **Stage 1** | All models receive the question in parallel and produce an independent response. |
| **Stage 2** | Each model reads the others' responses (anonymized as "Response A, B…") and ranks them. This prevents favoritism. |
| **Stage 3** | The Chairman reads everything and produces the final synthesized answer. |

Each stage is shown in the chat as a collapsible section. Stage 1 and Stage 3 start expanded; Stage 2 starts collapsed to keep the view clean.

If a model fails to respond, its tab in Stage 1 is shown in red with a ⚠ indicator. The error detail is visible in the tab content. Failed models are automatically excluded from Stage 2 ranking.

Each model has a **60-second timeout** per request. Each stage has a **90-second overall timeout**: if all models together have not completed within 90 seconds, the stage is aborted and an error banner appears in the chat. The remaining stages are skipped.

---

## ⌨️ Sending a message

- `Enter` — send the message
- `Shift` + `Enter` — new line without sending
- Click **+ New Conversation** in the sidebar to start a new chat.
- Maximum message length is **10,000 characters**. A counter appears when you exceed 80% of the limit and turns red at the limit.

---

## 📋 System prompt

Click **System prompt** above the message field to add global instructions (e.g. language, role, constraints). The **●** indicator shows when a prompt is active. It is applied to all three stages and preserved during Re-run.

---

## 🔄 Multi-turn conversation

Enable **Include context** below the message field to pass the conversation history (questions + Stage 3 answers) to all stages. Useful for follow-up questions. Leave it off for independent queries (uses fewer tokens).

---

## ⚡ Execution mode

Select the execution mode using the **Normal / Fast / Budget / Hybrid** buttons below the message field before sending.

| Mode | Stage 1 | Stage 2 | Stage 3 |
|------|---------|---------|---------|
| **Normal** | Council models | Council models | Chairman |
| **Fast** | Fast models | Fast models | Chairman |
| **Budget** | Budget models | Budget models | Chairman |
| **Hybrid** | Council models | Budget models | Chairman |

- **Normal** — uses the Council model list for all stages.
- **Fast** — uses the Fast model list (typically smaller, quicker models) for Stage 1 and Stage 2.
- **Budget** — uses the Budget model list (cheapest models) for Stage 1 and Stage 2.
- **Hybrid** — uses Council models for Stage 1 (quality responses) and Budget models for Stage 2 (cheap ranking). Stage 3 always uses the Chairman.

If a model list is empty, the Council list is used as fallback. When you select a mode with an unconfigured list, the button turns orange and a warning message appears below the selector explaining the fallback and linking to ⚙ Settings. The Fast, Budget, and Council lists are configured in the **Settings** panel (⚙).

---

## ↺ Re-run

Click the **↺** button in the header of any completed response to re-run the council on the same question. The previous answer is replaced. The original system prompt is reused automatically. The execution mode used is the one **currently selected** in the UI — change it before clicking ↺ to re-run with different models.

---

## 💬 Managing conversations

| Action | How |
|--------|-----|
| Search | Type in the **Search** field in the sidebar — filters in real time by title. |
| Delete | Click **×** next to a conversation. |
| Export | Click **Export MD** in the top bar to download the conversation as a Markdown file. |
| Move to folder | Hover over a conversation and click **📁** — a dropdown lists all available folders. Click a folder to assign the conversation; click **— No folder** to remove the assignment. |

### Folders

Folders let you organise conversations into a hierarchy. They are persisted on the server (not in the browser), so they survive cache clears.

| Action | How |
|--------|-----|
| Create a top-level folder | Click **+ New Folder** at the bottom of the sidebar. |
| Create a subfolder | Hover over an existing folder and click **+** — a prompt asks for the name. |
| Rename a folder | Double-click the folder name to edit it inline; press **Enter** or click away to confirm. |
| Delete a folder | Hover over a folder and click **×**. All subfolders are deleted too; conversations are unassigned (not deleted). |
| Expand / collapse | Click the **▶ / ▼** arrow to the left of the folder name. |

Conversations not assigned to any folder appear under an **Unorganized** heading (visible only when at least one folder exists).

---

## ⚙ Model configuration

Click **⚙** in the sidebar to open Settings. The Settings panel has four model lists — **Council**, **Fast**, **Budget**, and **Chairman** — plus a summary table showing which list is used by each execution mode.



To add a model, start typing a name or keyword in the search field — a dropdown appears with matching models fetched live from OpenRouter. Each entry shows:
- the model name
- the model identifier (e.g. `openai/gpt-4.1`)
- the price per 1M input and output tokens (or `free` for free models)

Select a model from the dropdown to add it, or press **Enter** to add the identifier you typed manually. Changes take effect immediately without restarting the server.

---

## ⊟ Model catalogue

Click **⊟** in the sidebar to open the full OpenRouter model catalogue. The page replaces the chat area and shows a sortable, searchable table with:

| Column | Content |
|--------|---------|
| **Name** | Model display name and (where available) a brief description |
| **ID** | OpenRouter model identifier (e.g. `openai/gpt-4.1`) |
| **Context** | Maximum context window (e.g. 128K, 1M) |
| **Input $/1M** | Cost per 1 million input tokens |
| **Output $/1M** | Cost per 1 million output tokens |

Click any column header to sort; click again to reverse the order. Use the search field to filter by name or ID in real time. Click **← Back to chat** or the **⊟** button again to return to the conversation.

---

## ▤ Model statistics

Click **▤** to view each model's historical performance across all stored council runs:

| Column | Meaning |
|--------|---------|
| **Runs** | Number of times the model participated as a council member |
| **Avg Rank** | Average position in peer rankings (lower is better) |
| **Wins** | Number of times ranked #1 by peers |
| **Win Rate** | Percentage of rankings where the model came first |

Use **Reset Stats** to clear the counters and start fresh from now. Past conversations are not deleted — they are simply excluded from the count.

---

## ~ Performance metrics

Click **~** to open the metrics dashboard.

**Latest run** tab — shows for the most recent council run:
- Latency per model (Stage 1 and Stage 2)
- Token usage per model, split into input and output (Stage 1 and Stage 2)
- Cost per model (Stage 1 and Stage 2)
- Chairman summary: latency, tokens, and cost (Stage 3)
- Total run cost across all stages

**Historical** tab — shows aggregated averages across all stored runs:
- Average latency per model (Stage 1)
- Average token usage per model (Stage 1)
- Average and total cost per model (Stage 1)
- Chairman averages (Stage 3)

> Free models (those with `:free` in their identifier) show `free` instead of a cost value.

---

## ☀ Light / dark theme

Click **☾** (or **☀**) at the top of the sidebar to toggle between light and dark theme. The preference is saved in the browser.
