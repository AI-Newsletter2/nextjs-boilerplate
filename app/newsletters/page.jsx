'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import './newsletters.css';

const frequencyNames = {
  daily: 'Daily',
  every_other_day: 'Every other day',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

const frequencies = Object.entries(frequencyNames);

function formatTime(value) {
  if (!value) return '';
  const [hours, minutes] = value.split(':').map(Number);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${suffix}`;
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

  return (
    <main className="newsletter_list_page">
      <header className="newsletter_list_header">
        <Link className="newsletter_list_brand" href="/">
          <span aria-hidden="true">b</span> briefly
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/">Home</Link>
          <Link href="/settings/account">Settings</Link>
        </nav>
      </header>

      <div className="newsletter_list_content">
        <div className="newsletter_list_heading">
          <div>
            <p className="newsletter_list_eyebrow">YOUR BRIEFLY SPACE</p>
            <h1>My newsletters</h1>
            <p>All your personal briefs, together in one place.</p>
          </div>
          <Link className="newsletter_create_link" href="/create/build">
            <span aria-hidden="true">＋</span> Create newsletter
          </Link>
        </div>

        {isLoading ? (
          <p className="newsletter_list_status">Loading your newsletters…</p>
        ) : loadError ? (
          <p className="newsletter_list_error" role="alert">{loadError}</p>
        ) : newsletters.length === 0 ? (
          <section className="newsletter_empty_state">
            <span aria-hidden="true">✳</span>
            <h2>Your reading list starts here.</h2>
            <p>Create a newsletter around the topics you want to keep up with.</p>
            <Link href="/create/build">Build your first newsletter</Link>
          </section>
        ) : (
          <div className="newsletter_list_grid">
            {newsletters.map((newsletter, index) => (
              <article className="newsletter_list_card" key={newsletter.id}>
                {newsletter.thumbnail_url ? (
                  <div
                    className="newsletter_list_cover uploaded_list_cover"
                    role="img"
                    aria-label={`${newsletter.title} thumbnail`}
                    style={{ backgroundImage: `url("${newsletter.thumbnail_url}")` }}
                  />
                ) : (
                  <div className={`newsletter_list_cover cover_tone_${index % 3}`}>
                    <span>{newsletter.title.slice(0, 1).toUpperCase()}</span>
                    <small>briefly</small>
                  </div>
                )}
                <div className="newsletter_list_card_body">
                  <p className="newsletter_list_frequency">
                    {frequencyNames[newsletter.frequency]} · {formatTime(newsletter.publish_time)}
                  </p>
                  <h2>{newsletter.title}</h2>
                  <p className="newsletter_list_description">
                    {newsletter.description || 'A personal Briefly newsletter.'}
                  </p>
                  <div className="newsletter_list_actions">
                    <Link href={`/create/build?id=${newsletter.id}`}>Edit newsletter</Link>
                    <button type="button" onClick={() => openFrequencyEditor(newsletter)}>
                      Change frequency
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {editingFrequency && (
        <div className="frequency_modal_backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setEditingFrequency(null);
        }}>
          <section
            className="frequency_modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="frequency-modal-title"
          >
            <button
              className="frequency_modal_close"
              type="button"
              aria-label="Close"
              onClick={() => setEditingFrequency(null)}
            >
              ×
            </button>
            <p className="newsletter_list_eyebrow">DELIVERY SCHEDULE</p>
            <h2 id="frequency-modal-title">Change delivery schedule</h2>
            <p className="frequency_modal_newsletter">{editingFrequency.title}</p>
            <div className="frequency_modal_options">
              {frequencies.map(([value, label]) => (
                <label key={value} className={pendingFrequency === value ? 'chosen' : ''}>
                  <input
                    type="radio"
                    name="frequency-modal"
                    value={value}
                    checked={pendingFrequency === value}
                    onChange={() => setPendingFrequency(value)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            <label className="frequency_modal_time">
              Send time
              <input
                type="time"
                value={pendingTime}
                onChange={(event) => setPendingTime(event.target.value)}
                required
              />
            </label>
            {message && <p className="newsletter_list_error" role="alert">{message}</p>}
            <div className="frequency_modal_actions">
              <button type="button" onClick={() => setEditingFrequency(null)}>Cancel</button>
              <button
                type="button"
                className="newsletter_create_link"
                disabled={savingId === editingFrequency.id}
                onClick={saveFrequency}
              >
                {savingId === editingFrequency.id ? 'Saving…' : 'Save schedule'}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
