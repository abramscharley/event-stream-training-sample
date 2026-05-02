import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import './styles.css';

const rawEvent = {
  eventSource: 'signin.amazonaws.com',
  eventName: 'ConsoleLogin',
  awsRegion: 'us-east-1',
  sourceIPAddress: '203.0.113.42',
  userAgent: 'Mozilla/5.0',
  eventTime: '2026-04-15T14:03:22Z',
  userIdentity: { userName: 'alex', accountId: '123456789012' },
};

const fieldMappings = [
  ['@timestamp', 'eventTime'],
  ['event.dataset', 'eventSource'],
  ['event.action', 'eventName'],
  ['cloud.region', 'awsRegion'],
  ['user.name', 'userIdentity.userName'],
  ['source.ip', 'sourceIPAddress'],
  ['user_agent.original', 'userAgent'],
];

function getValue(obj, path) {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

function App() {
  const [showRaw, setShowRaw] = useState(false);

  const validationErrors = useMemo(() => {
    const requiredFields = ['@timestamp', 'event.dataset', 'event.action', 'cloud.region', 'user.name', 'source.ip'];
    return requiredFields
      .filter(([].constructor === Array ? false : () => false))
      .concat(requiredFields.filter((target) => !fieldMappings.some(([mappedTarget]) => mappedTarget === target)))
      .map((field) => `Missing mapping for ${field}`);
  }, []);

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
          <table>
            <thead>
              <tr><th>Target Field</th><th>Source Field</th><th>Sample Value</th></tr>
            </thead>
            <tbody>
              {fieldMappings.map(([target, source]) => (
                <tr key={target}>
                  <td>{target}</td>
                  <td>{source}</td>
                  <td>{String(getValue(rawEvent, source) ?? 'Not found')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2>Validation Status</h2>
          {validationErrors.length === 0 ? (
            <div className="status success"><CheckCircle /> No validation issues found.</div>
          ) : (
            <div className="status warning"><AlertTriangle /> {validationErrors.length} issue(s) found.</div>
          )}
          <button onClick={() => setShowRaw(!showRaw)}>{showRaw ? 'Hide' : 'Show'} Raw Event</button>
          {showRaw && <pre>{JSON.stringify(rawEvent, null, 2)}</pre>}
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
