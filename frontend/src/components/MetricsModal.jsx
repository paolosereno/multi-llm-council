import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { api } from '../api';
import './MetricsModal.css';

const shortName = (model) => model.split('/').pop();

const formatCost = (v) => {
  if (v == null) return '—';
  if (v === 0) return 'free';
  if (v < 0.0001) return `$${v.toFixed(6)}`;
  if (v < 0.01)   return `$${v.toFixed(4)}`;
  return `$${v.toFixed(3)}`;
};

function StatBox({ label, value, unit = '' }) {
  return (
    <div className="metrics-stat">
      <span className="metrics-stat-value">{value != null ? `${value}${unit}` : '—'}</span>
      <span className="metrics-stat-label">{label}</span>
    </div>
  );
}

function CostStatBox({ label, value }) {
  return (
    <div className="metrics-stat">
      <span className="metrics-stat-value metrics-stat-cost">{formatCost(value)}</span>
      <span className="metrics-stat-label">{label}</span>
    </div>
  );
}

function StageChart({ title, latencyData, tokenData, costData, tooltipStyle, textColor, gridColor }) {
  return (
    <section className="metrics-section">
      <h3 className="metrics-section-title">{title}</h3>
      {latencyData.length > 0 && (
        <>
          <p className="metrics-chart-label">Latency (ms)</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={latencyData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="model" tick={{ fill: textColor, fontSize: 12 }} />
              <YAxis tick={{ fill: textColor, fontSize: 12 }} unit="ms" width={56} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="Latency (ms)" fill="#4a90e2" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
      {tokenData.length > 0 && (
        <>
          <p className="metrics-chart-label">Tokens (input + output)</p>
          <ResponsiveContainer width="100%" height={180}>
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
        </>
      )}
      {costData.length > 0 && (
        <>
          <p className="metrics-chart-label">Cost (USD)</p>
          <div className="metrics-cost-row">
            {costData.map((d) => (
              <div key={d.model} className="metrics-cost-item">
                <span className="metrics-cost-value">{formatCost(d.cost)}</span>
                <span className="metrics-cost-model">{d.model}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

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

  const s1LatencyData = lastAssistant?.stage1
    ?.filter((r) => r.latency_ms != null)
    ?.map((r) => ({ model: shortName(r.model), 'Latency (ms)': r.latency_ms })) ?? [];

  const s1TokenData = lastAssistant?.stage1
    ?.filter((r) => r.prompt_tokens != null)
    ?.map((r) => ({ model: shortName(r.model), 'Input': r.prompt_tokens, 'Output': r.completion_tokens })) ?? [];

  const s1CostData = lastAssistant?.stage1
    ?.filter((r) => r.cost != null)
    ?.map((r) => ({ model: shortName(r.model), cost: r.cost })) ?? [];

  const s2LatencyData = lastAssistant?.stage2
    ?.filter((r) => r.latency_ms != null)
    ?.map((r) => ({ model: shortName(r.model), 'Latency (ms)': r.latency_ms })) ?? [];

  const s2TokenData = lastAssistant?.stage2
    ?.filter((r) => r.prompt_tokens != null)
    ?.map((r) => ({ model: shortName(r.model), 'Input': r.prompt_tokens, 'Output': r.completion_tokens })) ?? [];

  const s2CostData = lastAssistant?.stage2
    ?.filter((r) => r.cost != null)
    ?.map((r) => ({ model: shortName(r.model), cost: r.cost })) ?? [];

  const s3 = lastAssistant?.stage3;

  // Total run cost
  const allCosts = [
    ...(lastAssistant?.stage1?.map((r) => r.cost) ?? []),
    ...(lastAssistant?.stage2?.map((r) => r.cost) ?? []),
    s3?.cost,
  ].filter((c) => c != null);
  const totalRunCost = allCosts.length > 0 ? allCosts.reduce((a, b) => a + b, 0) : null;

  const histLatencyData = historicalData?.by_model
    ?.filter((m) => m.avg_latency_ms != null)
    ?.map((m) => ({ model: m.short_name, 'Avg latency (ms)': m.avg_latency_ms, _runs: m.sample_count })) ?? [];

  const histTokenData = historicalData?.by_model
    ?.filter((m) => m.avg_prompt_tokens != null)
    ?.map((m) => ({ model: m.short_name, 'Avg input': m.avg_prompt_tokens, 'Avg output': m.avg_completion_tokens })) ?? [];

  const histCostData = historicalData?.by_model
    ?.filter((m) => m.avg_cost != null)
    ?.map((m) => ({ model: m.short_name, avg_cost: m.avg_cost, total_cost: m.total_cost })) ?? [];

  const histChairman = historicalData?.chairman?.[0];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content metrics-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Metrics</h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="metrics-tabs">
          <button className={`metrics-tab${tab === 'current' ? ' active' : ''}`} onClick={() => setTab('current')}>
            Latest run
          </button>
          <button className={`metrics-tab${tab === 'historical' ? ' active' : ''}`} onClick={() => setTab('historical')}>
            Historical
          </button>
        </div>

        <div className="modal-body metrics-modal-body">

          {tab === 'current' && (
            !hasCurrentData ? (
              <div className="metrics-empty">
                No data available. Send a query to the council to see real-time metrics.
              </div>
            ) : (
              <>
                {totalRunCost != null && (
                  <div className="metrics-run-cost">
                    Total run cost: <strong>{formatCost(totalRunCost)}</strong>
                  </div>
                )}

                <StageChart
                  title="Stage 1 — Individual responses"
                  latencyData={s1LatencyData}
                  tokenData={s1TokenData}
                  costData={s1CostData}
                  tooltipStyle={tooltipStyle}
                  textColor={textColor}
                  gridColor={gridColor}
                />

                <StageChart
                  title="Stage 2 — Peer review"
                  latencyData={s2LatencyData}
                  tokenData={s2TokenData}
                  costData={s2CostData}
                  tooltipStyle={tooltipStyle}
                  textColor={textColor}
                  gridColor={gridColor}
                />

                <section className="metrics-section">
                  <h3 className="metrics-section-title">
                    Stage 3 — Chairman
                    {s3?.model && <span className="metrics-model-name"> ({shortName(s3.model)})</span>}
                  </h3>
                  <div className="metrics-stat-row">
                    <StatBox label="Latency" value={s3?.latency_ms} unit=" ms" />
                    <StatBox label="Input tokens" value={s3?.prompt_tokens} />
                    <StatBox label="Output tokens" value={s3?.completion_tokens} />
                    <CostStatBox label="Cost" value={s3?.cost} />
                  </div>
                </section>
              </>
            )
          )}

          {tab === 'historical' && (
            loadingHist ? (
              <div className="modal-loading">Loading...</div>
            ) : !historicalData ? (
              <div className="metrics-empty">Failed to load data.</div>
            ) : historicalData.total_runs === 0 ? (
              <div className="metrics-empty">
                No historical data yet. Metrics are recorded starting from the next run.
              </div>
            ) : (
              <>
                <p className="metrics-total">
                  Based on <strong>{historicalData.total_runs}</strong> runs with metrics available
                </p>

                {histLatencyData.length > 0 && (
                  <section className="metrics-section">
                    <h3 className="metrics-section-title">Stage 1 — Average latency per model</h3>
                    <ResponsiveContainer width="100%" height={190}>
                      <BarChart data={histLatencyData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis dataKey="model" tick={{ fill: textColor, fontSize: 12 }} />
                        <YAxis tick={{ fill: textColor, fontSize: 12 }} unit="ms" width={56} />
                        <Tooltip
                          {...tooltipStyle}
                          formatter={(v, _n, props) => [`${v} ms (n=${props.payload._runs})`, 'Avg latency']}
                        />
                        <Bar dataKey="Avg latency (ms)" fill="#4a90e2" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </section>
                )}

                {histTokenData.length > 0 && (
                  <section className="metrics-section">
                    <h3 className="metrics-section-title">Stage 1 — Average tokens per model</h3>
                    <ResponsiveContainer width="100%" height={190}>
                      <BarChart data={histTokenData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis dataKey="model" tick={{ fill: textColor, fontSize: 12 }} />
                        <YAxis tick={{ fill: textColor, fontSize: 12 }} width={56} />
                        <Tooltip {...tooltipStyle} />
                        <Legend wrapperStyle={{ fontSize: 12, color: textColor }} />
                        <Bar dataKey="Avg input" fill="#4a90e2" stackId="t" />
                        <Bar dataKey="Avg output" fill="#82ca9d" stackId="t" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </section>
                )}

                {histCostData.length > 0 && (
                  <section className="metrics-section">
                    <h3 className="metrics-section-title">Stage 1 — Cost per model</h3>
                    <div className="metrics-cost-table">
                      <div className="metrics-cost-table-header">
                        <span>Model</span>
                        <span>Avg / run</span>
                        <span>Total</span>
                      </div>
                      {histCostData.map((m) => (
                        <div key={m.model} className="metrics-cost-table-row">
                          <span className="metrics-cost-table-model">{m.model}</span>
                          <span>{formatCost(m.avg_cost)}</span>
                          <span>{formatCost(m.total_cost)}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {histChairman && (
                  <section className="metrics-section">
                    <h3 className="metrics-section-title">
                      Stage 3 — Chairman
                      <span className="metrics-model-name"> ({histChairman.short_name})</span>
                    </h3>
                    <div className="metrics-stat-row">
                      <StatBox label="Avg latency" value={histChairman.avg_latency_ms} unit=" ms" />
                      <StatBox label="Avg input tokens" value={histChairman.avg_prompt_tokens} />
                      <StatBox label="Avg output tokens" value={histChairman.avg_completion_tokens} />
                      <CostStatBox label="Avg cost" value={histChairman.avg_cost} />
                      <StatBox label="Samples" value={histChairman.sample_count} />
                    </div>
                  </section>
                )}
              </>
            )
          )}
        </div>

        <div className="modal-footer">
          <button className="modal-cancel-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
