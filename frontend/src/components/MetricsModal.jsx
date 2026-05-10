import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { api } from '../api';
import './MetricsModal.css';

const shortName = (model) => model.split('/').pop();

export default function MetricsModal({ onClose, currentConversation, theme }) {
  const [tab, setTab] = useState('current');
  const [historicalData, setHistoricalData] = useState(null);
  const [loadingHist, setLoadingHist] = useState(false);

  const lastAssistant = currentConversation?.messages
    ?.filter((m) => m.role === 'assistant' && m.stage1)
    ?.at(-1);

  const hasCurrentData = lastAssistant?.stage1?.some((r) => r.latency_ms != null);

  useEffect(() => {
    if (tab === 'historical' && !historicalData) {
      setLoadingHist(true);
      api.getMetrics()
        .then((data) => { setHistoricalData(data); setLoadingHist(false); })
        .catch(() => setLoadingHist(false));
    }
  }, [tab]);

  const isDark = theme === 'dark';
  const textColor = isDark ? '#aaaaaa' : '#666666';
  const gridColor = isDark ? '#3a3a3a' : '#e0e0e0';
  const tooltipStyle = {
    contentStyle: {
      background: isDark ? '#2d2d2d' : '#fff',
      border: `1px solid ${gridColor}`,
      borderRadius: 6,
      fontSize: 12,
    },
    labelStyle: { color: isDark ? '#e0e0e0' : '#333' },
  };

  const latencyData = lastAssistant?.stage1
    ?.filter((r) => r.latency_ms != null)
    ?.map((r) => ({ model: shortName(r.model), 'Latenza (ms)': r.latency_ms })) ?? [];

  const tokenData = lastAssistant?.stage1
    ?.filter((r) => r.prompt_tokens != null)
    ?.map((r) => ({
      model: shortName(r.model),
      'Input': r.prompt_tokens,
      'Output': r.completion_tokens,
    })) ?? [];

  const histLatencyData = historicalData?.by_model
    ?.filter((m) => m.avg_latency_ms != null)
    ?.map((m) => ({ model: m.short_name, 'Latenza media (ms)': m.avg_latency_ms, _runs: m.sample_count })) ?? [];

  const histTokenData = historicalData?.by_model
    ?.filter((m) => m.avg_prompt_tokens != null)
    ?.map((m) => ({
      model: m.short_name,
      'Input medio': m.avg_prompt_tokens,
      'Output medio': m.avg_completion_tokens,
    })) ?? [];

  const s3 = lastAssistant?.stage3;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content metrics-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Metriche</h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="metrics-tabs">
          <button
            className={`metrics-tab${tab === 'current' ? ' active' : ''}`}
            onClick={() => setTab('current')}
          >
            Ultima run
          </button>
          <button
            className={`metrics-tab${tab === 'historical' ? ' active' : ''}`}
            onClick={() => setTab('historical')}
          >
            Storico
          </button>
        </div>

        <div className="modal-body metrics-modal-body">

          {tab === 'current' && (
            !hasCurrentData ? (
              <div className="metrics-empty">
                Nessun dato disponibile. Invia una domanda al council per vedere le metriche in tempo reale.
              </div>
            ) : (
              <>
                {latencyData.length > 0 && (
                  <section className="metrics-section">
                    <h3 className="metrics-section-title">Latenza Stage 1 per modello</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={latencyData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis dataKey="model" tick={{ fill: textColor, fontSize: 12 }} />
                        <YAxis tick={{ fill: textColor, fontSize: 12 }} unit="ms" width={56} />
                        <Tooltip {...tooltipStyle} />
                        <Bar dataKey="Latenza (ms)" fill="#4a90e2" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </section>
                )}

                {tokenData.length > 0 && (
                  <section className="metrics-section">
                    <h3 className="metrics-section-title">Token Stage 1 per modello</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={tokenData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis dataKey="model" tick={{ fill: textColor, fontSize: 12 }} />
                        <YAxis tick={{ fill: textColor, fontSize: 12 }} width={56} />
                        <Tooltip {...tooltipStyle} />
                        <Legend wrapperStyle={{ fontSize: 12, color: textColor }} />
                        <Bar dataKey="Input" fill="#4a90e2" stackId="t" />
                        <Bar dataKey="Output" fill="#82ca9d" stackId="t" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </section>
                )}

                {s3?.latency_ms != null && (
                  <section className="metrics-section">
                    <h3 className="metrics-section-title">Chairman — Stage 3</h3>
                    <div className="metrics-stat-row">
                      <div className="metrics-stat">
                        <span className="metrics-stat-value">{s3.latency_ms} ms</span>
                        <span className="metrics-stat-label">Latenza</span>
                      </div>
                      {s3.prompt_tokens != null && (
                        <>
                          <div className="metrics-stat">
                            <span className="metrics-stat-value">{s3.prompt_tokens}</span>
                            <span className="metrics-stat-label">Token input</span>
                          </div>
                          <div className="metrics-stat">
                            <span className="metrics-stat-value">{s3.completion_tokens}</span>
                            <span className="metrics-stat-label">Token output</span>
                          </div>
                        </>
                      )}
                    </div>
                  </section>
                )}
              </>
            )
          )}

          {tab === 'historical' && (
            loadingHist ? (
              <div className="modal-loading">Caricamento...</div>
            ) : !historicalData ? (
              <div className="metrics-empty">Errore nel caricamento dei dati.</div>
            ) : historicalData.total_runs === 0 ? (
              <div className="metrics-empty">
                Nessun dato storico disponibile. Le metriche vengono salvate a partire dalla prossima run.
              </div>
            ) : (
              <>
                <p className="metrics-total">
                  Basato su <strong>{historicalData.total_runs}</strong> run con metriche disponibili
                </p>

                {histLatencyData.length > 0 && (
                  <section className="metrics-section">
                    <h3 className="metrics-section-title">Latenza media Stage 1 per modello</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={histLatencyData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis dataKey="model" tick={{ fill: textColor, fontSize: 12 }} />
                        <YAxis tick={{ fill: textColor, fontSize: 12 }} unit="ms" width={56} />
                        <Tooltip
                          {...tooltipStyle}
                          formatter={(v, _name, props) => [`${v} ms (n=${props.payload._runs})`, 'Latenza media']}
                        />
                        <Bar dataKey="Latenza media (ms)" fill="#4a90e2" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </section>
                )}

                {histTokenData.length > 0 && (
                  <section className="metrics-section">
                    <h3 className="metrics-section-title">Token medi Stage 1 per modello</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={histTokenData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis dataKey="model" tick={{ fill: textColor, fontSize: 12 }} />
                        <YAxis tick={{ fill: textColor, fontSize: 12 }} width={56} />
                        <Tooltip {...tooltipStyle} />
                        <Legend wrapperStyle={{ fontSize: 12, color: textColor }} />
                        <Bar dataKey="Input medio" fill="#4a90e2" stackId="t" />
                        <Bar dataKey="Output medio" fill="#82ca9d" stackId="t" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </section>
                )}
              </>
            )
          )}
        </div>

        <div className="modal-footer">
          <button className="modal-cancel-btn" onClick={onClose}>Chiudi</button>
        </div>
      </div>
    </div>
  );
}
