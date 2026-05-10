import { useState } from 'react';
import SettingsModal from './SettingsModal';
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

  return (
    <div className="sidebar">
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
      <div className="sidebar-header">
        <div className="sidebar-header-top">
          <h1>LLM Council</h1>
          <div className="sidebar-header-actions">
            <button className="theme-toggle-btn" onClick={onToggleTheme} title="Toggle theme">
              {theme === 'dark' ? '☀' : '☾'}
            </button>
            <button className="theme-toggle-btn" onClick={() => setSettingsOpen(true)} title="Settings">
              ⚙
            </button>
          </div>
        </div>
        <button className="new-conversation-btn" onClick={onNewConversation}>
          + New Conversation
        </button>
      </div>

      <div className="conversation-list">
        {conversations.length === 0 ? (
          <div className="no-conversations">No conversations yet</div>
        ) : (
          conversations.map((conv) => (
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
