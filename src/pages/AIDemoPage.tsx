import { useState } from 'react';

type UserPreview = {
  _id: string;
  username: string;
  vibeTags: string[];
};

export default function AIDemoPage() {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserPreview[]>([]);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const runAnalysis = async () => {
    setLoading(true);
    setError('');
    setResult('');
    setUsers([]);
    try {
      const res = await fetch('/api/compat/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Optional: pass specific IDs as { ids: ["<id1>","<id2>"] }
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setUsers(data.users || []);
      setResult(data.resultText || '');
    } catch (e: any) {
      setError(e?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '24px auto', padding: 16 }}>
      <h1>AI Compatibility Demo</h1>

      <button onClick={runAnalysis} disabled={loading} style={{ padding: '8px 16px' }}>
        {loading ? 'Analyzing...' : 'Run Compatibility Analysis'}
      </button>

      {error && (
        <div style={{ color: 'crimson', marginTop: 12 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        {users.map((u) => (
          <div key={u._id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
            <h3 style={{ marginTop: 0 }}>{u.username || '(unknown user)'}</h3>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {(u.vibeTags || []).map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {result && (
        <pre style={{ whiteSpace: 'pre-wrap', marginTop: 16, padding: 12, background: '#f7f7f7', borderRadius: 8 }}>
          {result}
        </pre>
      )}
    </div>
  );
}
