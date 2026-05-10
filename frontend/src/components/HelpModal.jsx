import './HelpModal.css';

const sections = [
  {
    icon: '⚡',
    title: 'How it works',
    content: (
      <div className="help-stages">
        <div className="help-stage">
          <span className="help-stage-badge">Stage 1</span>
          <span>All models receive the question in parallel and produce an independent response.</span>
        </div>
        <div className="help-stage">
          <span className="help-stage-badge">Stage 2</span>
          <span>Each model reads the others' responses (anonymized as "Response A, B…") and ranks them. This prevents favoritism.</span>
        </div>
        <div className="help-stage">
          <span className="help-stage-badge">Stage 3</span>
          <span>The Chairman reads everything and produces the final synthesized answer.</span>
        </div>
      </div>
    ),
  },
  {
    icon: '⌨️',
    title: 'Sending a message',
    content: (
      <ul className="help-list">
        <li><kbd>Enter</kbd> — send the message</li>
        <li><kbd>Shift</kbd> + <kbd>Enter</kbd> — new line without sending</li>
        <li>Click <strong>+ New Conversation</strong> in the sidebar to start a new chat.</li>
      </ul>
    ),
  },
  {
    icon: '📋',
    title: 'System prompt',
    content: (
      <p>
        Click <strong>System prompt</strong> above the message field to add global instructions
        (e.g. language, role, constraints). The <strong>●</strong> indicator shows when a prompt is active.
        It is applied to all three stages and preserved during Re-run.
      </p>
    ),
  },
  {
    icon: '🔄',
    title: 'Multi-turn conversation',
    content: (
      <p>
        Enable <strong>Include context</strong> below the message field to pass the conversation
        history (questions + Stage 3 answers) to all stages. Useful for follow-up questions.
        Leave it off for independent queries (uses fewer tokens).
      </p>
    ),
  },
  {
    icon: '↺',
    title: 'Re-run',
    content: (
      <p>
        Click the <strong>↺</strong> button in the header of any completed response to re-run
        the council on the same question. The previous answer is replaced.
        The original system prompt is reused automatically.
      </p>
    ),
  },
  {
    icon: '💬',
    title: 'Managing conversations',
    content: (
      <ul className="help-list">
        <li>Search by title in the <strong>Search</strong> field in the sidebar — filters in real time.</li>
        <li>Click <strong>×</strong> next to a conversation to delete it.</li>
        <li>Click <strong>Export MD</strong> in the top bar to download the conversation as a Markdown file.</li>
      </ul>
    ),
  },
  {
    icon: '⚙',
    title: 'Model configuration',
    content: (
      <>
        <p>
          Click <strong>⚙</strong> in the sidebar to open Settings. Type a name or keyword in the
          search field to find models — a dropdown shows matching results with name, identifier, and
          pricing (input / output cost per 1M tokens, or <code>free</code>). Select a model to add
          it to the council, or press <kbd>Enter</kbd> to add an identifier typed manually.
          Changes take effect immediately without restarting the server.
        </p>
      </>
    ),
  },
  {
    icon: '▤',
    title: 'Model statistics',
    content: (
      <p>
        Click <strong>▤</strong> to view each model's historical performance: average rank in peer
        evaluations, win count, and win rate. Use <strong>Reset Stats</strong> to clear the counters
        and start fresh from now.
      </p>
    ),
  },
  {
    icon: '~',
    title: 'Performance metrics',
    content: (
      <p>
        Click <strong>~</strong> to open the metrics dashboard. The <em>Latest run</em> tab shows
        latency, token usage, and cost per model for the most recent council run.
        The <em>Historical</em> tab shows aggregated averages across all stored runs.
      </p>
    ),
  },
  {
    icon: '☀',
    title: 'Light / dark theme',
    content: (
      <p>
        Click <strong>☾</strong> (or <strong>☀</strong>) at the top of the sidebar to toggle
        between light and dark theme. The preference is saved in the browser.
      </p>
    ),
  },
];

export default function HelpModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content help-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Quick reference</h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body help-modal-body">
          {sections.map((s) => (
            <section key={s.title} className="help-section">
              <h3 className="help-section-title">
                <span className="help-section-icon">{s.icon}</span>
                {s.title}
              </h3>
              <div className="help-section-body">{s.content}</div>
            </section>
          ))}
        </div>

        <div className="modal-footer">
          <button className="modal-cancel-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
