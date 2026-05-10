import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import './Stage3.css';

export default function Stage3({ finalResponse }) {
  const [collapsed, setCollapsed] = useState(false);

  if (!finalResponse) {
    return null;
  }

  return (
    <div className="stage stage3">
      <div className="stage-header" onClick={() => setCollapsed(!collapsed)}>
        <h3 className="stage-title">Stage 3: Final Council Answer</h3>
        <span className="collapse-toggle">{collapsed ? '▶' : '▼'}</span>
      </div>
      {!collapsed && <div className="final-response">
        <div className="chairman-label">
          Chairman: {finalResponse.model.split('/')[1] || finalResponse.model}
        </div>
        <div className="final-text markdown-content">
          <ReactMarkdown>{finalResponse.response}</ReactMarkdown>
        </div>
      </div>}
    </div>
  );
}
