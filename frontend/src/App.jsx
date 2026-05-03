import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import './styles.css';

function getValue(obj, path) {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

function formatValue(value) {
  return value == null ? 'Not found' : String(value);
}

function App() {
  const [backendData, setBackendData] = useState(null);
  const [error, setError] = useState('');
  const [showRaw, setShowRaw] = useState(false);
  const [showNormalized, setShowNormalized] = useState(true);

  const debugEnabled = typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).get('debug') === '1';
  const debugIngestUrl = import.meta.env?.VITE_DEBUG_INGEST_URL;
  const debugSessionId = import.meta.env?.VITE_DEBUG_SESSION_ID || 'local-debug';
  const debugTelemetryEnabled = debugEnabled && typeof debugIngestUrl === 'string' && debugIngestUrl.length > 0;

  useEffect(() => {
    let isMounted = true;
    setError('');
    let telemetryWarned = false;
    const warnTelemetry = () => {
      if (telemetryWarned) return;
      telemetryWarned = true;
      // Intentionally minimal to avoid noisy console spam.
      // Debug telemetry must never break the main app.
      console.warn('Debug telemetry POST failed; continuing without it.');
    };

    // Only emit runtime debug evidence when explicitly enabled via `?debug=1`.
    // This keeps normal training/demo runs clean.
    if (debugTelemetryEnabled) {
      // #region agent log: fetch start
      fetch(debugIngestUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': debugSessionId },
        body: JSON.stringify({
          sessionId: debugSessionId,
          location: 'frontend/src/App.jsx:useEffect(fetch)',
          hypothesisId: 'H1_backend_unreachable_or_502',
          message: 'Starting GET /api/demo fetch',
          data: { path: '/api/demo' },
          timestamp: Date.now(),
        }),
      }).catch(() => warnTelemetry());
      // #endregion
    }

    fetch(`/api/demo${debugEnabled ? '?debug=1' : ''}`)
      .then(async (res) => {
        if (debugTelemetryEnabled) {
          // #region agent log: response status
          fetch(debugIngestUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': debugSessionId },
            body: JSON.stringify({
              sessionId: debugSessionId,
              location: 'frontend/src/App.jsx:fetch(response)',
              hypothesisId: 'H1_backend_unreachable_or_502',
              message: 'Received response from /api/demo',
              data: { status: res.status, ok: res.ok },
              timestamp: Date.now(),
            }),
          }).catch(() => warnTelemetry());
          // #endregion
        }

        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          if (debugTelemetryEnabled) {
            // #region agent log: non-ok payload
            fetch(debugIngestUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': debugSessionId },
              body: JSON.stringify({
                sessionId: debugSessionId,
                location: 'frontend/src/App.jsx:fetch(non-ok)',
                hypothesisId: 'H1_backend_unreachable_or_502',
                message: 'Non-OK response payload from /api/demo',
                data: payload,
                timestamp: Date.now(),
              }),
            }).catch(() => warnTelemetry());
            // #endregion
          }

          throw new Error(payload.error || `HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;

        if (debugTelemetryEnabled) {
          // #region agent log: successful payload shape
          fetch(debugIngestUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': debugSessionId },
            body: JSON.stringify({
              sessionId: debugSessionId,
              location: 'frontend/src/App.jsx:fetch(success)',
              hypothesisId: 'H2_backend_returns_shape_but_summary_missing',
              message: 'Backend payload received; checking normalized fields',
              data: {
                hasBackendData: !!data,
                userName: getValue(data?.normalized_event || {}, 'user.name'),
                sourceIp: getValue(data?.normalized_event || {}, 'source.ip'),
                cloudAccountId: getValue(data?.normalized_event || {}, 'cloud.account.id'),
              },
              timestamp: Date.now(),
            }),
          }).catch(() => warnTelemetry());
          // #endregion
        }

        setBackendData(data);
      })
      .catch((e) => {
        if (!isMounted) return;

        if (debugTelemetryEnabled) {
          // #region agent log: fetch error
          fetch(debugIngestUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': debugSessionId },
            body: JSON.stringify({
              sessionId: debugSessionId,
              location: 'frontend/src/App.jsx:fetch(catch)',
              hypothesisId: 'H1_backend_unreachable_or_502',
              message: 'Fetch /api/demo failed',
              data: { error: e?.message || String(e) },
              timestamp: Date.now(),
            }),
          }).catch(() => warnTelemetry());
          // #endregion
        }

        setError(e.message || String(e));
      });
    return () => { isMounted = false; };
  }, []);

  const mappingEntries = useMemo(() => {
    if (!backendData?.mapping?.mappings) return [];
    return Object.entries(backendData.mapping.mappings)
      .sort(([a], [b]) => a.localeCompare(b));
  }, [backendData]);

  const mappingRows = useMemo(() => (
    mappingEntries.map(([target, source]) => {
      const rawValue = getValue(backendData?.raw_event || {}, source);
      const normalizedValue = getValue(backendData?.normalized_event || {}, target);
      let status = 'ok';

      if (normalizedValue == null || normalizedValue === '') {
        status = 'missing';
      } else if (String(rawValue) !== String(normalizedValue)) {
        status = 'changed';
      }

      return {
        target,
        source,
        rawValue,
        normalizedValue,
        status,
      };
    })
  ), [backendData, mappingEntries]);

  const validationErrors = backendData?.validation_errors || [];

  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Synthetic event stream processor</p>
        <h1>Cybersecurity Data Mapping Workbench</h1>
        <p>
          Demo frontend for previewing how source event attributes map into a normalized target schema.
        </p>
      </section>

      <section className="grid">
        <div className="card">
          <h2>Mapping Preview</h2>
          {backendData && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                margin: '0 0 16px',
              }}
            >
              <div>
                <div style={{ fontSize: 12, color: '#4b5563' }}>user.name</div>
                <div style={{ fontWeight: 600 }}>{formatValue(getValue(backendData.normalized_event, 'user.name'))}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#4b5563' }}>source.ip</div>
                <div style={{ fontWeight: 600 }}>{formatValue(getValue(backendData.normalized_event, 'source.ip'))}</div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 12, color: '#4b5563' }}>cloud.account.id</div>
                <div style={{ fontWeight: 600 }}>{formatValue(getValue(backendData.normalized_event, 'cloud.account.id'))}</div>
              </div>
            </div>
          )}
          <p className="card-copy">
            Most rows keep the same underlying value and move it into a new ECS-style field path. This view shows the source value and where that value lands after mapping.
          </p>
          <div className="legend">
            <span className="legend-item"><span className="legend-dot legend-dot-ok" /> Same value, new field path</span>
            <span className="legend-item"><span className="legend-dot legend-dot-missing" /> Missing normalized value</span>
            <span className="legend-item"><span className="legend-dot legend-dot-changed" /> Value changed</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Target Field</th>
                <th>Source Field</th>
                <th>Source Value</th>
                <th>Mapped Output Value</th>
              </tr>
            </thead>
            <tbody>
              {mappingRows.map(({ target, source, rawValue, normalizedValue, status }) => (
                <tr key={target} className={`mapping-row mapping-row-${status}`}>
                  <td>{target}</td>
                  <td>{source}</td>
                  <td>{formatValue(rawValue)}</td>
                  <td>
                    {formatValue(normalizedValue)}
                    {status !== 'ok' && (
                      <span className={`row-badge row-badge-${status}`}>
                        {status === 'missing' ? 'Missing' : 'Changed'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2>Validation Status</h2>
          {backendData && validationErrors.length === 0 ? (
            <div className="status success"><CheckCircle /> No validation issues found.</div>
          ) : (
            <div className="status warning">
              <AlertTriangle /> {backendData ? `${validationErrors.length} issue(s) found.` : 'Run backend demo to see results.'}
            </div>
          )}

          {error && (
            <div style={{ marginBottom: 16, color: '#b91c1c' }}>
              {error}
            </div>
          )}

          {backendData?.validation_errors?.length > 0 && (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {backendData.validation_errors.map((e, idx) => (
                <li key={`${idx}-${e}`}>{e}</li>
              ))}
            </ul>
          )}

          <button onClick={() => setShowRaw(!showRaw)}>{showRaw ? 'Hide' : 'Show'} Raw Event</button>
          {showRaw && backendData && <pre>{JSON.stringify(backendData.raw_event, null, 2)}</pre>}
        </div>

        <div className="card card-wide">
          <h2>Normalized Event</h2>
          <p className="card-copy">
            This is the ECS-shaped payload returned by the backend after applying the mapping and constants.
          </p>
          <button onClick={() => setShowNormalized(!showNormalized)}>
            {showNormalized ? 'Hide' : 'Show'} Normalized Event
          </button>
          {showNormalized && backendData && (
            <pre>{JSON.stringify(backendData.normalized_event, null, 2)}</pre>
          )}
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
