'use client';

import { useState } from 'react';

async function TestMessage() {
  // Calls the Python function running on Vercel at api/test-message.py
  const res = await fetch('/api/python_app');
  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`);
  }
  const data = await res.json();
  return data.message;
}

export default function NewslettersPage() {
  const [result, setResult] = useState('');

  async function handleRunTest() {
    setResult('Running...');
    try {
      setResult(await TestMessage());
    } catch (err) {
      setResult(`Error: ${err.message}`);
    }
  }

  return (
    <main
      style={{
        display: 'flex',
        minHeight: '100vh',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '24px',
      }}
    >
      <button
        type="button"
        onClick={handleRunTest}
        style={{
          padding: '10px 16px',
          border: 0,
          borderRadius: '6px',
          background: '#172a46',
          color: '#fff',
          cursor: 'pointer',
          font: 'inherit',
        }}
      >
        Run test
      </button>
      <textarea
        aria-label="Function result"
        value={result}
        readOnly
        rows={4}
        style={{
          width: 'min(100%, 360px)',
          padding: '10px',
          border: '1px solid #cbd2dc',
          borderRadius: '6px',
          font: 'inherit',
          resize: 'vertical',
        }}
      />
    </main>
  );
}