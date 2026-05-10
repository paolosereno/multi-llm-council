import { useState, useEffect } from 'react';
import { api } from '../api';
import './StatsModal.css';

export default function StatsModal({ onClose }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);

  const loadStats = () => {
    setLoading(true);
    api.getStats().then((data) => {
      setStats(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { loadStats(); }, []);

  const handleReset = async () => {
    setResetting(true);
    try {
      await api.resetStats();
      await loadStats();
    } finally {
      setResetting(false);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return null;
    return new Date(iso + 'Z').toLocaleString();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content stats-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Model Statistics</h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        {loading ? (
          <div className="modal-loading">Loading...</div>
        ) : !stats ? (
          <div className="modal-loading">Failed to load stats.</div>
        ) : (
          <div className="modal-body">
            <p className="stats-summary">
              Based on <strong>{stats.total_council_runs}</strong> council run{stats.total_council_runs !== 1 ? 's' : ''}
              {stats.reset_at && (
                <span className="stats-since"> — since {formatDate(stats.reset_at)}</span>
              )}
            </p>

            {stats.models.length === 0 ? (
              <p className="no-stats">No data yet. Run some council queries to see stats.</p>
            ) : (
              <table className="stats-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Model</th>
                    <th title="Times used as council member">Runs</th>
                    <th title="Average rank across all peer evaluations (lower is better)">Avg Rank</th>
                    <th title="Times ranked #1 by peers">Wins</th>
                    <th title="Percentage of rankings where ranked #1">Win Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.models.map((m, i) => (
                    <tr key={m.model} className={i === 0 ? 'stats-top' : ''}>
                      <td className="stats-pos">{i + 1}</td>
                      <td className="stats-model" title={m.model}>
                        {m.model.split('/')[1] || m.model}
                      </td>
                      <td>{m.appearances}</td>
                      <td className="stats-rank">
                        {m.average_rank != null ? m.average_rank.toFixed(2) : '—'}
                      </td>
                      <td>{m.wins}</td>
                      <td>{m.rankings_received > 0 ? `${Math.round(m.win_rate * 100)}%` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        <div className="modal-footer">
          <button
            className="stats-reset-btn"
            onClick={handleReset}
            disabled={resetting || loading}
            title="Ignore all previous runs and start counting from now"
          >
            {resetting ? 'Resetting...' : 'Reset Stats'}
          </button>
          <button className="modal-cancel-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
