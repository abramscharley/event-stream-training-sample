import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  const [stopMessage, setStopMessage] = useState('');
  const [showRaw, setShowRaw] = useState(false);
  const [showNormalized, setShowNormalized] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const mountedRef = useRef(false);

  const runDemo = async () => {
    setIsRunning(true);
    setError('');
    setStopMessage('');
    try {
      const res = await fetch('/api/demo');
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (mountedRef.current) setBackendData(data);
    } catch (e) {
      if (!mountedRef.current) return;
      const msg = e?.message ? String(e.message) : String(e);
      setError(
        msg.includes('Failed to fetch')
          ? 'Backend not reachable. Start backend on http://localhost:8000 and retry.'
          : msg
      );
    } finally {
      if (mountedRef.current) setIsRunning(false);
    }
  };

  const stopBackend = async () => {
    setIsStopping(true);
    setError('');
    setStopMessage('');
    try {
      const res = await fetch('/api/stop-backend', { method: 'POST' });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || `HTTP ${res.status}`);

      setBackendData(null);
      setStopMessage(payload.message || 'Backend stopped.');
    } catch (e) {
      setError(e?.message ? String(e.message) : String(e));
    } finally {
      setIsStopping(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    // Initial load: fetch once so the page looks "alive" immediately.
    runDemo();
    return () => {
      mountedRef.current = false;
    };
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
          <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
            <button onClick={runDemo} disabled={isRunning || isStopping}>
              {isRunning ? 'Running...' : 'Run demo (starts backend)'}
            </button>
            <button onClick={stopBackend} disabled={isRunning || isStopping}>
              {isStopping ? 'Stopping...' : 'Stop backend'}
            </button>
          </div>
          {backendData && validationErrors.length === 0 ? (
            <div className="status success"><CheckCircle /> No validation issues found.</div>
          ) : (
            <div className="status warning">
              <AlertTriangle /> {backendData ? `${validationErrors.length} issue(s) found.` : 'Run backend demo to see results.'}
            </div>
          )}

          {stopMessage && (
            <div style={{ marginBottom: 16, color: '#065f46' }}>
              {stopMessage}
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
