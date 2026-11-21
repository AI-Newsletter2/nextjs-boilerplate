'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import './newsletters.css';

async function TestMessage() {
  // Calls the Python function running on Vercel at api/test-message.py
  const res = await fetch('/api/greet');
  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`);
  }
  const data = await res.json();
  return data.message;
}

export default function NewslettersPage() {
  const [newsletters, setNewsletters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editingFrequency, setEditingFrequency] = useState(null);
  const [pendingFrequency, setPendingFrequency] = useState('');
  const [pendingTime, setPendingTime] = useState('');
  const [savingId, setSavingId] = useState('');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState('');

  async function loadNewsletters() {
    const response = await fetch('/api/newsletters');
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Unable to load newsletters.');
    setNewsletters(result.newsletters);
  }

  useEffect(() => {
    let active = true;
    loadNewsletters()
      .catch((error) => {
        if (active) setLoadError(error.message);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function openFrequencyEditor(newsletter) {
    setEditingFrequency(newsletter);
    setPendingFrequency(newsletter.frequency);
    setPendingTime(newsletter.publish_time?.slice(0, 5) || '08:00');
    setMessage('');
  }

  async function saveFrequency() {
    if (!editingFrequency || !pendingFrequency) return;
    if (!pendingTime) {
      setMessage('Choose a send time.');
      return;
    }
    setSavingId(editingFrequency.id);
    setMessage('');
    try {
      const response = await fetch(`/api/newsletters/${editingFrequency.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frequency: pendingFrequency,
          publish_time: pendingTime,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to update frequency.');
      setNewsletters((current) =>
        current.map((item) => item.id === editingFrequency.id ? result.newsletter : item),
      );
      setEditingFrequency(null);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSavingId('');
    }
  }

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