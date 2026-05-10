import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import Stage1 from './Stage1';
import Stage2 from './Stage2';
import Stage3 from './Stage3';
import './ChatInterface.css';

function buildMarkdown(conversation) {
  const lines = [`# ${conversation.title || 'LLM Council Conversation'}`, ''];

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
  isLoading,
}) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
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
          <h2>Welcome to LLM Council</h2>
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
            <p>Ask a question to consult the LLM Council</p>
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
                  <div className="message-label">LLM Council</div>

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

      {conversation.messages.length === 0 && (
        <form className="input-form" onSubmit={handleSubmit}>
          <textarea
            className="message-input"
            placeholder="Ask your question... (Shift+Enter for new line, Enter to send)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            rows={3}
          />
          <button
            type="submit"
            className="send-button"
            disabled={!input.trim() || isLoading}
          >
            Send
          </button>
        </form>
      )}
    </div>
  );
}
