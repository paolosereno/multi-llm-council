import { useState } from 'react';
import SettingsModal from './SettingsModal';
import StatsModal from './StatsModal';
import HelpModal from './HelpModal';
import MetricsModal from './MetricsModal';
import './Sidebar.css';

export default function Sidebar({
  conversations,
  currentConversationId,
  currentConversation,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  theme,
  onToggleTheme,
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [metricsOpen, setMetricsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredConversations = search.trim()
    ? conversations.filter((c) =>
        (c.title || 'New Conversation').toLowerCase().includes(search.toLowerCase())
      )
    : conversations;

  return (
    <div className="sidebar">
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
      {statsOpen && <StatsModal onClose={() => setStatsOpen(false)} />}
      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
      {metricsOpen && (
        <MetricsModal
          onClose={() => setMetricsOpen(false)}
          currentConversation={currentConversation}
          theme={theme}
        />
      )}
      <div className="sidebar-header">
        <h1 className="sidebar-title">LLM Council</h1>
        <div className="sidebar-header-actions">
          <button className="theme-toggle-btn" onClick={onToggleTheme} title="Toggle theme">
            {theme === 'dark' ? '☀' : '☾'}
          </button>
          <button className="theme-toggle-btn" onClick={() => setStatsOpen(true)} title="Model statistics">
            ▤
          </button>
          <button className="theme-toggle-btn" onClick={() => setMetricsOpen(true)} title="Performance metrics">
            ~
          </button>
          <button className="theme-toggle-btn" onClick={() => setHelpOpen(true)} title="Help">
            ?
          </button>
          <button className="theme-toggle-btn" onClick={() => setSettingsOpen(true)} title="Settings">
            ⚙
          </button>
        </div>
        <button className="new-conversation-btn" onClick={onNewConversation}>
          + New Conversation
        </button>
        <input
          className="search-input"
          type="text"
          placeholder="Search conversations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="conversation-list">
        {filteredConversations.length === 0 ? (
          <div className="no-conversations">
            {search.trim() ? 'No results' : 'No conversations yet'}
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <div
              key={conv.id}
              className={`conversation-item ${
                conv.id === currentConversationId ? 'active' : ''
              }`}
              onClick={() => onSelectConversation(conv.id)}
            >
              <div className="conversation-title">
                {conv.title || 'New Conversation'}
              </div>
              <div className="conversation-meta">
                {conv.message_count} messages
              </div>
              <button
                className="delete-conversation-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteConversation(conv.id);
                }}
                title="Delete conversation"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
