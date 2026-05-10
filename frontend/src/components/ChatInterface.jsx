import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import Stage1 from './Stage1';
import Stage2 from './Stage2';
import Stage3 from './Stage3';
import { api } from '../api';
import './ChatInterface.css';

function buildMarkdown(conversation) {
  const lines = [`# ${conversation.title || 'Multi LLM Council Conversation'}`, ''];

  let qIndex = 0;
  for (const msg of conversation.messages) {
    if (msg.role === 'user') {
      qIndex++;
      lines.push('---', '', `## Question ${qIndex}`, '', msg.content, '');
    } else {
      if (msg.stage1?.length > 0) {
        lines.push('### Stage 1: Individual Responses', '');
        for (const resp of msg.stage1) {
          const name = resp.model.split('/')[1] || resp.model;
          lines.push(`#### ${name}`, '', resp.response || '', '');
        }
      }

      if (msg.stage2?.length > 0) {
        lines.push('### Stage 2: Peer Rankings', '');
        if (msg.metadata?.aggregate_rankings?.length > 0) {
          lines.push('#### Aggregate Rankings', '');
          msg.metadata.aggregate_rankings.forEach((agg, i) => {
            const name = agg.model.split('/')[1] || agg.model;
            lines.push(`${i + 1}. **${name}** — avg: ${agg.average_rank.toFixed(2)} (${agg.rankings_count} votes)`);
          });
          lines.push('');
        }
        lines.push('#### Individual Evaluations', '');
        for (const rank of msg.stage2) {
          const name = rank.model.split('/')[1] || rank.model;
          lines.push(`##### ${name}`, '', rank.ranking || '', '');
          if (rank.parsed_ranking?.length > 0) {
            const labelToModel = msg.metadata?.label_to_model;
            lines.push('**Extracted ranking:**');
            rank.parsed_ranking.forEach((label, i) => {
              const modelName = labelToModel?.[label]?.split('/')[1] || label;
              lines.push(`${i + 1}. ${modelName}`);
            });
            lines.push('');
          }
        }
      }

      if (msg.stage3) {
        const chairman = msg.stage3.model.split('/')[1] || msg.stage3.model;
        lines.push('### Stage 3: Final Answer', '', `*Chairman: ${chairman}*`, '', msg.stage3.response || '', '');
      }
    }
  }

  return lines.join('\n');
}

export default function ChatInterface({
  conversation,
  onSendMessage,
  onRerun,
  isLoading,
}) {
  const MAX_LENGTH = 10000;
  const [input, setInput] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [includeContext, setIncludeContext] = useState(false);
  const [executionMode, setExecutionMode] = useState('normal');
  const [emptyLists, setEmptyLists] = useState({ fast: false, budget: false });
  const messagesEndRef = useRef(null);

  useEffect(() => {
    api.getConfig().then((config) => {
      setEmptyLists({
        fast: !config.fast_models?.length,
        budget: !config.budget_models?.length,
      });
    }).catch(() => {});
  }, []);

  const buildHistory = () => {
    if (!includeContext || !conversation?.messages?.length) return null;
    const history = [];
    for (const msg of conversation.messages) {
      if (msg.role === 'user') {
        history.push({ role: 'user', content: msg.content });
      } else if (msg.role === 'assistant' && msg.stage3?.response) {
        history.push({ role: 'assistant', content: msg.stage3.response });
      }
    }
    return history.length > 0 ? history : null;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input, systemPrompt || null, buildHistory(), executionMode);
      setInput('');
    }
  };

  const handleKeyDown = (e) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleExport = () => {
    const markdown = buildMarkdown(conversation);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = (conversation.title || 'council')
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase();
    a.download = `${filename}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!conversation) {
    return (
      <div className="chat-interface">
        <div className="empty-state">
          <h2>Welcome to Multi LLM Council</h2>
          <p>Create a new conversation to get started</p>
        </div>
      </div>
    );
  }

  const hasResults = conversation.messages.some(
    (m) => m.role === 'assistant' && m.stage3
  );

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <span className="chat-title">{conversation.title || 'New Conversation'}</span>
        {hasResults && (
          <button className="export-btn" onClick={handleExport}>
            Export MD
          </button>
        )}
      </div>
      <div className="messages-container">
        {conversation.messages.length === 0 ? (
          <div className="empty-state">
            <h2>Start a conversation</h2>
            <p>Ask a question to consult the Multi LLM Council</p>
          </div>
        ) : (
          conversation.messages.map((msg, index) => (
            <div key={index} className="message-group">
              {msg.role === 'user' ? (
                <div className="user-message">
                  <div className="message-label">You</div>
                  <div className="message-content">
                    <div className="markdown-content">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="assistant-message">
                  <div className="assistant-message-header">
                    <div className="message-label">Multi LLM Council</div>
                    {msg.stage3 && !msg.loading?.stage3 && (
                      <button
                        className="rerun-btn"
                        disabled={isLoading}
                        onClick={() => {
                          const userMsg = index > 0 ? conversation.messages[index - 1] : null;
                          onRerun(userMsg?.content, userMsg?.system_prompt || null, index, executionMode);
                        }}
                      >
                        ↺ Re-run
                      </button>
                    )}
                  </div>

                  {/* Stage 1 */}
                  {msg.loading?.stage1 && (
                    <div className="stage-loading">
                      <div className="spinner"></div>
                      <span>Running Stage 1: Collecting individual responses...</span>
                    </div>
                  )}
                  {msg.stage1 && <Stage1 responses={msg.stage1} />}

                  {/* Stage 2 */}
                  {msg.loading?.stage2 && (
                    <div className="stage-loading">
                      <div className="spinner"></div>
                      <span>Running Stage 2: Peer rankings...</span>
                    </div>
                  )}
                  {msg.stage2 && (
                    <Stage2
                      rankings={msg.stage2}
                      labelToModel={msg.metadata?.label_to_model}
                      aggregateRankings={msg.metadata?.aggregate_rankings}
                    />
                  )}

                  {/* Stage 3 */}
                  {msg.loading?.stage3 && (
                    <div className="stage-loading">
                      <div className="spinner"></div>
                      <span>Running Stage 3: Final synthesis...</span>
                    </div>
                  )}
                  {msg.stage3 && <Stage3 finalResponse={msg.stage3} />}

                  {/* Stream error */}
                  {msg.streamError && (
                    <div className="stream-error">
                      ⚠ {msg.streamError}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <span>Consulting the council...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form className="input-form" onSubmit={handleSubmit}>
          <div className="system-prompt-section">
            <div className="form-toggles">
              <button
                type="button"
                className="system-prompt-toggle"
                onClick={() => setShowSystemPrompt(!showSystemPrompt)}
              >
                {showSystemPrompt ? '▼' : '▶'} System Prompt
                {systemPrompt && <span className="system-prompt-dot"> ●</span>}
              </button>
              <button
                type="button"
                className={`context-toggle ${includeContext ? 'active' : ''}`}
                onClick={() => setIncludeContext(!includeContext)}
                disabled={conversation.messages.length === 0}
                title={conversation.messages.length === 0 ? 'No previous messages to include' : 'Include previous messages as context'}
              >
                Include context
              </button>
            </div>
            <div className="mode-selector">
              {[
                { id: 'normal',  label: 'Normal',  warn: false },
                { id: 'fast',    label: 'Fast',    warn: emptyLists.fast },
                { id: 'budget',  label: 'Budget',  warn: emptyLists.budget },
                { id: 'hybrid',  label: 'Hybrid',  warn: emptyLists.budget },
              ].map(({ id, label, warn }) => (
                <button
                  key={id}
                  type="button"
                  className={`mode-btn ${executionMode === id ? 'active' : ''} ${executionMode === id && warn ? 'mode-btn-warn' : ''}`}
                  onClick={() => setExecutionMode(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            {executionMode === 'fast' && emptyLists.fast && (
              <p className="mode-warning">
                ⚠ Fast models not configured — Council models will be used for all stages. Configure them in ⚙ Settings.
              </p>
            )}
            {executionMode === 'budget' && emptyLists.budget && (
              <p className="mode-warning">
                ⚠ Budget models not configured — Council models will be used for all stages. Configure them in ⚙ Settings.
              </p>
            )}
            {executionMode === 'hybrid' && emptyLists.budget && (
              <p className="mode-warning">
                ⚠ Budget models not configured — Council models will be used for Stage 2. Configure them in ⚙ Settings.
              </p>
            )}
            {showSystemPrompt && (
              <textarea
                className="system-prompt-input"
                placeholder="Optional: guide the council (e.g. 'Answer in Italian', 'You are a legal expert')"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={2}
              />
            )}
          </div>
          <div className="input-row">
            <textarea
              className="message-input"
              placeholder="Ask your question... (Shift+Enter for new line, Enter to send)"
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, MAX_LENGTH))}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              rows={3}
            />
            {input.length > MAX_LENGTH * 0.8 && (
              <div className={`char-counter ${input.length >= MAX_LENGTH ? 'char-counter-limit' : ''}`}>
                {input.length} / {MAX_LENGTH}
              </div>
            )}
            <button
              type="submit"
              className="send-button"
              disabled={!input.trim() || isLoading || input.length >= MAX_LENGTH}
            >
              Send
            </button>
          </div>
        </form>
    </div>
  );
}
