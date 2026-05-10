import { useState } from 'react';
import SettingsModal from './SettingsModal';
import StatsModal from './StatsModal';
import './Sidebar.css';

export default function Sidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  theme,
  onToggleTheme,
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
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
      <div className="sidebar-header">
        <div className="sidebar-header-top">
          <h1>LLM Council</h1>
          <div className="sidebar-header-actions">
            <button className="theme-toggle-btn" onClick={onToggleTheme} title="Toggle theme">
              {theme === 'dark' ? '☀' : '☾'}
            </button>
            <button className="theme-toggle-btn" onClick={() => setStatsOpen(true)} title="Model statistics">
              ▤
            </button>
            <button className="theme-toggle-btn" onClick={() => setSettingsOpen(true)} title="Settings">
              ⚙
            </button>
          </div>
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
