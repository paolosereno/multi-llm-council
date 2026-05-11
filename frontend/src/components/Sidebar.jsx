import { useState, useEffect, useRef } from 'react';
import SettingsModal from './SettingsModal';
import StatsModal from './StatsModal';
import HelpModal from './HelpModal';
import MetricsModal from './MetricsModal';
import './Sidebar.css';

function buildMenuItems(folders, parentId = null, depth = 0) {
  const items = [];
  for (const f of folders.filter((x) => x.parent_id === parentId)) {
    items.push({ id: f.id, name: f.name, depth });
    items.push(...buildMenuItems(folders, f.id, depth + 1));
  }
  return items;
}

function MoveMenu({ conv, folders, assignments, onMove, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const current = assignments[conv.id] || null;
  const items = buildMenuItems(folders);

  return (
    <div className="move-menu" ref={ref} onClick={(e) => e.stopPropagation()}>
      <div
        className={`move-menu-item ${current === null ? 'move-menu-item-current' : ''}`}
        onClick={() => { onMove(conv.id, null); onClose(); }}
      >
        Unorganized
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          className={`move-menu-item ${current === item.id ? 'move-menu-item-current' : ''}`}
          style={{ paddingLeft: 12 + item.depth * 12 }}
          onClick={() => { onMove(conv.id, item.id); onClose(); }}
        >
          📁 {item.name}
        </div>
      ))}
    </div>
  );
}

function ConversationRow({ conv, isActive, folders, assignments, onSelect, onDelete, onMove }) {
  const [showMove, setShowMove] = useState(false);

  return (
    <div
      className={`conversation-item ${isActive ? 'active' : ''}`}
      onClick={() => onSelect(conv.id)}
    >
      <div className="conversation-title">{conv.title || 'New Conversation'}</div>
      <div className="conversation-meta">{conv.message_count} messages</div>
      <div className="conv-row-actions">
        <div className="move-wrapper">
          <button
            className="conv-action-btn"
            title="Move to folder"
            onClick={(e) => { e.stopPropagation(); setShowMove((v) => !v); }}
          >
            📁
          </button>
          {showMove && (
            <MoveMenu
              conv={conv}
              folders={folders}
              assignments={assignments}
              onMove={onMove}
              onClose={() => setShowMove(false)}
            />
          )}
        </div>
        <button
          className="delete-conversation-btn"
          title="Delete conversation"
          onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
        >
          ×
        </button>
      </div>
    </div>
  );
}

function FolderNode({
  folder, folders, conversations, assignments, currentId,
  expanded, onToggle, onSelect, onDelete, onDeleteConv, onMove, onRename, onAddSub,
  depth = 0,
}) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState(folder.name);

  const isExpanded = expanded.has(folder.id);
  const childFolders = folders.filter((f) => f.parent_id === folder.id);
  const folderConvs = conversations.filter((c) => assignments[c.id] === folder.id);

  const submitRename = () => {
    const trimmed = renameVal.trim();
    if (trimmed && trimmed !== folder.name) onRename(folder.id, trimmed);
    setIsRenaming(false);
  };

  return (
    <div className="folder-node">
      <div className="folder-header" style={{ paddingLeft: 8 + depth * 14 }}>
        <button className="folder-toggle" onClick={() => onToggle(folder.id)}>
          {isExpanded ? '▼' : '▶'}
        </button>
        {isRenaming ? (
          <input
            className="folder-rename-input"
            value={renameVal}
            autoFocus
            onChange={(e) => setRenameVal(e.target.value)}
            onBlur={submitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitRename();
              if (e.key === 'Escape') { setRenameVal(folder.name); setIsRenaming(false); }
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className="folder-name"
            title="Double-click to rename"
            onDoubleClick={() => { setRenameVal(folder.name); setIsRenaming(true); }}
          >
            📁 {folder.name}
          </span>
        )}
        <div className="folder-header-actions">
          <button className="folder-action-btn" title="Add subfolder" onClick={() => onAddSub(folder.id)}>+</button>
          <button className="folder-action-btn folder-action-delete" title="Delete folder" onClick={() => onDelete(folder.id)}>×</button>
        </div>
      </div>
      {isExpanded && (
        <div className="folder-children">
          {folderConvs.map((conv) => (
            <ConversationRow
              key={conv.id}
              conv={conv}
              isActive={conv.id === currentId}
              folders={folders}
              assignments={assignments}
              onSelect={onSelect}
              onDelete={onDeleteConv}
              onMove={onMove}
            />
          ))}
          {childFolders.map((child) => (
            <FolderNode
              key={child.id}
              folder={child}
              folders={folders}
              conversations={conversations}
              assignments={assignments}
              currentId={currentId}
              expanded={expanded}
              onToggle={onToggle}
              onSelect={onSelect}
              onDelete={onDelete}
              onDeleteConv={onDeleteConv}
              onMove={onMove}
              onRename={onRename}
              onAddSub={onAddSub}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({
  conversations, currentConversationId, currentConversation,
  onSelectConversation, onNewConversation, onDeleteConversation,
  theme, onToggleTheme, showModels, onToggleModels,
  folders, assignments, onCreateFolder, onRenameFolder, onDeleteFolder, onAssignFolder,
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [metricsOpen, setMetricsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(new Set());
  const expandedInitialized = useRef(false);

  useEffect(() => {
    if (!expandedInitialized.current && folders.length > 0) {
      setExpanded(new Set(folders.map((f) => f.id)));
      expandedInitialized.current = true;
    }
  }, [folders]);

  const handleToggleExpand = (folderId) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  const handleAddFolder = async (parentId = null) => {
    const name = window.prompt(parentId ? 'Subfolder name:' : 'New folder name:');
    if (!name || !name.trim()) return;
    const folder = await onCreateFolder(name.trim(), parentId);
    setExpanded((prev) => {
      const next = new Set(prev);
      next.add(folder.id);
      if (parentId) next.add(parentId);
      return next;
    });
  };

  const topLevelFolders = folders.filter((f) => f.parent_id === null);
  const unorganized = conversations.filter((c) => !assignments[c.id]);
  const filteredConversations = search.trim()
    ? conversations.filter((c) =>
        (c.title || 'New Conversation').toLowerCase().includes(search.toLowerCase())
      )
    : null;

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
        <h1 className="sidebar-title">Multi LLM Council</h1>
        <div className="sidebar-header-actions">
          <button className="theme-toggle-btn" onClick={onToggleTheme} title="Toggle theme">
            {theme === 'dark' ? '☀' : '☾'}
          </button>
          <button
            className={`theme-toggle-btn ${showModels ? 'sidebar-btn-active' : ''}`}
            onClick={onToggleModels}
            title="OpenRouter model catalogue"
          >
            ⊟
          </button>
          <button className="theme-toggle-btn" onClick={() => setStatsOpen(true)} title="Model statistics">▤</button>
          <button className="theme-toggle-btn" onClick={() => setMetricsOpen(true)} title="Performance metrics">~</button>
          <button className="theme-toggle-btn" onClick={() => setHelpOpen(true)} title="Help">?</button>
          <button className="theme-toggle-btn" onClick={() => setSettingsOpen(true)} title="Settings">⚙</button>
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
        {filteredConversations ? (
          filteredConversations.length === 0 ? (
            <div className="no-conversations">No results</div>
          ) : (
            filteredConversations.map((conv) => (
              <ConversationRow
                key={conv.id}
                conv={conv}
                isActive={conv.id === currentConversationId}
                folders={folders}
                assignments={assignments}
                onSelect={onSelectConversation}
                onDelete={onDeleteConversation}
                onMove={onAssignFolder}
              />
            ))
          )
        ) : (
          <>
            {topLevelFolders.map((folder) => (
              <FolderNode
                key={folder.id}
                folder={folder}
                folders={folders}
                conversations={conversations}
                assignments={assignments}
                currentId={currentConversationId}
                expanded={expanded}
                onToggle={handleToggleExpand}
                onSelect={onSelectConversation}
                onDelete={onDeleteFolder}
                onDeleteConv={onDeleteConversation}
                onMove={onAssignFolder}
                onRename={onRenameFolder}
                onAddSub={handleAddFolder}
              />
            ))}

            {unorganized.length > 0 && (
              <div className="unorganized-section">
                {(topLevelFolders.length > 0) && (
                  <div className="unorganized-header">Unorganized</div>
                )}
                {unorganized.map((conv) => (
                  <ConversationRow
                    key={conv.id}
                    conv={conv}
                    isActive={conv.id === currentConversationId}
                    folders={folders}
                    assignments={assignments}
                    onSelect={onSelectConversation}
                    onDelete={onDeleteConversation}
                    onMove={onAssignFolder}
                  />
                ))}
              </div>
            )}

            {conversations.length === 0 && folders.length === 0 && (
              <div className="no-conversations">No conversations yet</div>
            )}

            <button className="new-folder-btn" onClick={() => handleAddFolder(null)}>
              + New Folder
            </button>
          </>
        )}
      </div>
    </div>
  );
}
