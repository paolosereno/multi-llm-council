import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import './Stage1.css';

export default function Stage1({ responses }) {
  const [activeTab, setActiveTab] = useState(0);
  const [collapsed, setCollapsed] = useState(false);

  if (!responses || responses.length === 0) {
    return null;
  }

  return (
    <div className="stage stage1">
      <div className="stage-header" onClick={() => setCollapsed(!collapsed)}>
        <h3 className="stage-title">Stage 1: Individual Responses</h3>
        <span className="collapse-toggle">{collapsed ? '▶' : '▼'}</span>
      </div>

      {!collapsed && <><div className="tabs">
        {responses.map((resp, index) => (
          <button
            key={index}
            className={`tab ${activeTab === index ? 'active' : ''} ${resp.error ? 'tab-error' : ''}`}
            onClick={() => setActiveTab(index)}
          >
            {resp.model.split('/')[1] || resp.model}
            {resp.error && ' ⚠'}
          </button>
        ))}
      </div>

      <div className="tab-content">
        <div className="model-name">{responses[activeTab].model}</div>
        {responses[activeTab].error ? (
          <div className="stage1-error">
            <p>This model failed to respond.</p>
            <p className="stage1-error-detail">{responses[activeTab].error}</p>
          </div>
        ) : (
          <div className="response-text markdown-content">
            <ReactMarkdown>{responses[activeTab].response}</ReactMarkdown>
          </div>
        )}
      </div></>}
    </div>
  );
}
