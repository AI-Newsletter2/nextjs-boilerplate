'use client';

import { useState } from 'react';

function TestMessage() {
  return 'Output here';
}

export default function NewslettersPage() {
  const [result, setResult] = useState('');

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
        onClick={() => setResult(TestMessage())}
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
