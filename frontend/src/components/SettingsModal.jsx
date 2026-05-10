import { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import './SettingsModal.css';

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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function SettingsModal({ onClose }) {
  const [councilModels, setCouncilModels] = useState([]);
  const [chairmanModel, setChairmanModel] = useState('');
  const [newModel, setNewModel] = useState('');
  const [availableModels, setAvailableModels] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getConfig().then((config) => {
      setCouncilModels(config.council_models);
      setChairmanModel(config.chairman_model);
      setLoading(false);
    });
    api.getModels()
      .then((data) => setAvailableModels(data.models || []))
      .catch(() => {});
  }, []);

  const handleAddModel = (id) => {
    const trimmed = (typeof id === 'string' ? id : newModel).trim();
    if (trimmed && !councilModels.includes(trimmed)) {
      setCouncilModels([...councilModels, trimmed]);
      setNewModel('');
    }
  };

  const handleRemoveModel = (index) => {
    setCouncilModels(councilModels.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateConfig({ council_models: councilModels, chairman_model: chairmanModel });
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
