import { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import './SettingsModal.css';

function formatPrice(pricing) {
  const prompt = parseFloat(pricing?.prompt ?? 0);
  const completion = parseFloat(pricing?.completion ?? 0);
  if (!prompt && !completion) return 'free';
  const fmt = (v) => {
    const perM = v * 1_000_000;
    return perM < 0.01 ? '<$0.01' : `$${perM.toFixed(2)}`;
  };
  return `in ${fmt(prompt)} / out ${fmt(completion)} per 1M`;
}

function ModelComboBox({ availableModels, value, onChange, onSelect, placeholder, className }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const results = value.length > 0
    ? availableModels
        .filter(m =>
          m.id.toLowerCase().includes(value.toLowerCase()) ||
          m.name.toLowerCase().includes(value.toLowerCase())
        )
        .slice(0, 25)
    : [];

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const commit = (id) => {
    if (onSelect) onSelect(id);
    else onChange(id);
    setOpen(false);
  };

  return (
    <div className="model-combobox" ref={wrapperRef}>
      <input
        className={className}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => value && setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { if (onSelect) onSelect(value); setOpen(false); }
          if (e.key === 'Escape') setOpen(false);
        }}
      />
      {open && results.length > 0 && (
        <ul className="model-dropdown">
          {results.map(m => (
            <li
              key={m.id}
              className="model-dropdown-item"
              onMouseDown={(e) => { e.preventDefault(); commit(m.id); }}
            >
              <span className="model-dropdown-name">{m.name}</span>
              <span className="model-dropdown-id">{m.id}</span>
              <span className="model-dropdown-price">{formatPrice(m.pricing)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function SettingsModal({ onClose }) {
  const [councilModels, setCouncilModels] = useState([]);
  const [fastModels, setFastModels] = useState([]);
  const [budgetModels, setBudgetModels] = useState([]);
  const [chairmanModel, setChairmanModel] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newFastModel, setNewFastModel] = useState('');
  const [newBudgetModel, setNewBudgetModel] = useState('');
  const [availableModels, setAvailableModels] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getConfig().then((config) => {
      setCouncilModels(config.council_models);
      setFastModels(config.fast_models || []);
      setBudgetModels(config.budget_models || []);
      setChairmanModel(config.chairman_model);
      setLoading(false);
    });
    api.getModels()
      .then((data) => setAvailableModels(data.models || []))
      .catch(() => {});
  }, []);

  const makeAdder = (list, setList, setNew) => (id) => {
    const trimmed = (typeof id === 'string' ? id : '').trim() || '';
    if (trimmed && !list.includes(trimmed)) {
      setList([...list, trimmed]);
      setNew('');
    }
  };

  const handleAddModel = makeAdder(councilModels, setCouncilModels, setNewModel);
  const handleAddFast = makeAdder(fastModels, setFastModels, setNewFastModel);
  const handleAddBudget = makeAdder(budgetModels, setBudgetModels, setNewBudgetModel);

  const handleRemoveModel = (index) => setCouncilModels(councilModels.filter((_, i) => i !== index));
  const handleRemoveFast = (index) => setFastModels(fastModels.filter((_, i) => i !== index));
  const handleRemoveBudget = (index) => setBudgetModels(budgetModels.filter((_, i) => i !== index));

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateConfig({
        council_models: councilModels,
        chairman_model: chairmanModel,
        fast_models: fastModels,
        budget_models: budgetModels,
      });
      onClose();
    } catch (e) {
      console.error('Failed to save config:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Council Settings</h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        {loading ? (
          <div className="modal-loading">Loading...</div>
        ) : (
          <div className="modal-body">
            <section className="settings-section">
              <h3>Council Models</h3>
              <div className="model-list">
                {councilModels.map((model, i) => (
                  <div key={i} className="model-item">
                    <span className="model-item-name">{model}</span>
                    <button
                      className="model-remove-btn"
                      onClick={() => handleRemoveModel(i)}
                      title="Remove model"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="model-add-row">
                <ModelComboBox
                  availableModels={availableModels}
                  value={newModel}
                  onChange={setNewModel}
                  onSelect={handleAddModel}
                  placeholder="Search models…"
                  className="model-add-input"
                />
                <button className="model-add-btn" onClick={handleAddModel}>
                  Add
                </button>
              </div>
            </section>

            <section className="settings-section">
              <h3>Execution Modes</h3>
              <table className="mode-table">
                <thead>
                  <tr>
                    <th>Mode</th>
                    <th>Stage 1</th>
                    <th>Stage 2</th>
                    <th>Stage 3</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Normal</td><td>Council</td><td>Council</td><td>Chairman</td></tr>
                  <tr><td>Fast</td><td>Fast</td><td>Fast</td><td>Chairman</td></tr>
                  <tr><td>Budget</td><td>Budget</td><td>Budget</td><td>Chairman</td></tr>
                  <tr><td>Hybrid</td><td>Council</td><td>Budget</td><td>Chairman</td></tr>
                </tbody>
              </table>
              <p className="settings-section-hint">If a list is empty, Normal models are used as fallback.</p>
            </section>

            <section className="settings-section">
              <h3>Fast Models</h3>
              <p className="settings-section-hint">Used in Fast mode (Stage 1 &amp; 2). Falls back to Normal if empty.</p>
              <div className="model-list">
                {fastModels.map((model, i) => (
                  <div key={i} className="model-item">
                    <span className="model-item-name">{model}</span>
                    <button className="model-remove-btn" onClick={() => handleRemoveFast(i)} title="Remove model">×</button>
                  </div>
                ))}
              </div>
              <div className="model-add-row">
                <ModelComboBox
                  availableModels={availableModels}
                  value={newFastModel}
                  onChange={setNewFastModel}
                  onSelect={handleAddFast}
                  placeholder="Search models…"
                  className="model-add-input"
                />
                <button className="model-add-btn" onClick={handleAddFast}>Add</button>
              </div>
            </section>

            <section className="settings-section">
              <h3>Budget Models</h3>
              <p className="settings-section-hint">Used in Budget mode (Stage 1 &amp; 2) and Hybrid mode (Stage 2). Falls back to Normal if empty.</p>
              <div className="model-list">
                {budgetModels.map((model, i) => (
                  <div key={i} className="model-item">
                    <span className="model-item-name">{model}</span>
                    <button className="model-remove-btn" onClick={() => handleRemoveBudget(i)} title="Remove model">×</button>
                  </div>
                ))}
              </div>
              <div className="model-add-row">
                <ModelComboBox
                  availableModels={availableModels}
                  value={newBudgetModel}
                  onChange={setNewBudgetModel}
                  onSelect={handleAddBudget}
                  placeholder="Search models…"
                  className="model-add-input"
                />
                <button className="model-add-btn" onClick={handleAddBudget}>Add</button>
              </div>
            </section>

            <section className="settings-section">
              <h3>Chairman Model</h3>
              <ModelComboBox
                availableModels={availableModels}
                value={chairmanModel}
                onChange={setChairmanModel}
                placeholder="provider/model-name"
                className="chairman-input"
              />
            </section>
          </div>
        )}

        <div className="modal-footer">
          <button className="modal-cancel-btn" onClick={onClose}>Cancel</button>
          <button className="modal-save-btn" onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
