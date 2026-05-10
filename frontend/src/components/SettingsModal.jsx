import { useState, useEffect } from 'react';
import { api } from '../api';
import './SettingsModal.css';

export default function SettingsModal({ onClose }) {
  const [councilModels, setCouncilModels] = useState([]);
  const [chairmanModel, setChairmanModel] = useState('');
  const [newModel, setNewModel] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getConfig().then((config) => {
      setCouncilModels(config.council_models);
      setChairmanModel(config.chairman_model);
      setLoading(false);
    });
  }, []);

  const handleAddModel = () => {
    const trimmed = newModel.trim();
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
                <input
                  className="model-add-input"
                  type="text"
                  placeholder="provider/model-name"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddModel()}
                />
                <button className="model-add-btn" onClick={handleAddModel}>
                  Add
                </button>
              </div>
            </section>

            <section className="settings-section">
              <h3>Chairman Model</h3>
              <input
                className="chairman-input"
                type="text"
                value={chairmanModel}
                onChange={(e) => setChairmanModel(e.target.value)}
                placeholder="provider/model-name"
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
