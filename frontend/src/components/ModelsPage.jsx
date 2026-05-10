import { useState, useEffect } from 'react';
import { api } from '../api';
import './ModelsPage.css';

function formatPrice(price) {
  if (!price || price === '0') return 'free';
  const perM = parseFloat(price) * 1_000_000;
  if (perM === 0) return 'free';
  if (perM < 0.01) return `$${perM.toFixed(4)}`;
  return `$${perM.toFixed(3)}`;
}

function formatContext(len) {
  if (!len) return '—';
  if (len >= 1_000_000) return `${(len / 1_000_000).toFixed(1)}M`;
  if (len >= 1000) return `${Math.round(len / 1000)}K`;
  return String(len);
}

export default function ModelsPage({ onClose }) {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  useEffect(() => {
    api.getModels()
      .then((data) => { setModels(data.models || []); setLoading(false); })
      .catch(() => { setFetchError('Failed to load models from OpenRouter.'); setLoading(false); });
  }, []);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const filtered = models.filter((m) => {
    const q = search.toLowerCase();
    return !q || m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q);
  });

  const sorted = [...filtered].sort((a, b) => {
    let av, bv;
    switch (sortKey) {
      case 'context':
        av = a.context_length || 0; bv = b.context_length || 0; break;
      case 'input':
        av = parseFloat(a.pricing?.prompt || '0'); bv = parseFloat(b.pricing?.prompt || '0'); break;
      case 'output':
        av = parseFloat(a.pricing?.completion || '0'); bv = parseFloat(b.pricing?.completion || '0'); break;
      default:
        av = a.name.toLowerCase(); bv = b.name.toLowerCase();
    }
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const ind = (key) => sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '';

  return (
    <div className="models-page">
      <div className="models-page-header">
        <div className="models-page-title-row">
          <h2 className="models-page-title">OpenRouter Model Catalogue</h2>
          <button className="models-page-back" onClick={onClose}>← Back to chat</button>
        </div>
        <div className="models-page-controls">
          <input
            className="models-search"
            type="text"
            placeholder="Search by name or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          {!loading && !fetchError && (
            <span className="models-count">
              {sorted.length} model{sorted.length !== 1 ? 's' : ''}{search ? ` matching "${search}"` : ''}
            </span>
          )}
        </div>
      </div>

      <div className="models-table-container">
        {loading && <div className="models-status">Loading models…</div>}
        {fetchError && <div className="models-status models-error">{fetchError}</div>}
        {!loading && !fetchError && sorted.length === 0 && (
          <div className="models-status">No models match your search.</div>
        )}
        {!loading && !fetchError && sorted.length > 0 && (
          <table className="models-table">
            <thead>
              <tr>
                <th className="sortable" onClick={() => handleSort('name')}>Name{ind('name')}</th>
                <th>ID</th>
                <th className="sortable col-num" onClick={() => handleSort('context')}>Context{ind('context')}</th>
                <th className="sortable col-num" onClick={() => handleSort('input')}>Input $/1M{ind('input')}</th>
                <th className="sortable col-num" onClick={() => handleSort('output')}>Output $/1M{ind('output')}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((m) => (
                <tr
                  key={m.id}
                  className="model-row-link"
                  onClick={() => window.open(`https://openrouter.ai/${m.id}`, '_blank', 'noopener,noreferrer')}
                >
                  <td>
                    <div className="model-name-cell">{m.name}</div>
                    {m.description && <div className="model-desc">{m.description}</div>}
                  </td>
                  <td><code className="model-id">{m.id}</code></td>
                  <td className="col-num">{formatContext(m.context_length)}</td>
                  <td className="col-num">{formatPrice(m.pricing?.prompt)}</td>
                  <td className="col-num">{formatPrice(m.pricing?.completion)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
