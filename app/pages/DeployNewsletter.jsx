'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  createEmptyDraft,
  readNewsletterDraft,
  writeNewsletterDraft,
} from '../create/draft';
import './create.css';

const frequencies = [
  { value: 'daily', label: 'Daily', detail: 'Every day' },
  { value: 'every_other_day', label: 'Every other day', detail: 'A new issue every two days' },
  { value: 'weekly', label: 'Weekly', detail: 'Once a week' },
  { value: 'monthly', label: 'Monthly', detail: 'Once a month' },
];

export default function DeployNewsletter() {
  const router = useRouter();
  const [draft, setDraft] = useState(createEmptyDraft);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedDraft = readNewsletterDraft();
    savedDraft.publish_time = savedDraft.publish_time?.slice(0, 5) || '08:00';
    savedDraft.timezone =
      savedDraft.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    setDraft(savedDraft);
    setThumbnailPreview(savedDraft.thumbnail_url || '');
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) writeNewsletterDraft(draft);
  }, [draft, isLoading]);

  function updateField(event) {
    setDraft((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function selectThumbnail(event) {
    const file = event.target.files?.[0];
    setError('');
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError('Choose a PNG, JPEG, or WebP image up to 5 MB.');
      event.target.value = '';
      return;
    }
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  }

  async function uploadThumbnail() {
    if (!thumbnailFile) return draft.thumbnail_url;
    const formData = new FormData();
    formData.set('file', thumbnailFile);
    const response = await fetch('/api/newsletters/thumbnail', {
      method: 'POST',
      body: formData,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Unable to upload the thumbnail.');
    return result.thumbnail_url;
  }

  async function publish(event) {
    event.preventDefault();
    setIsPublishing(true);
    setError('');
    try {
      const thumbnail_url = await uploadThumbnail();
      const newsletter = {
        title: draft.title.trim(),
        description: draft.description.trim(),
        publish_time: draft.publish_time,
        timezone: draft.timezone,
        frequency: draft.frequency,
        layout: draft.layout,
        template: draft.template || 'editorial',
        thumbnail_url: thumbnail_url || null,
      };
      const response = await fetch(
        draft.id ? `/api/newsletters/${draft.id}` : '/api/newsletters',
        {
          method: draft.id ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newsletter),
        },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to publish newsletter.');
      window.localStorage.removeItem('briefly_newsletter_draft');
      router.push('/newsletters');
    } catch (publishError) {
      setError(publishError.message);
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <div className="create_page">
      <header className="create_header">
        <Link className="create_brand" href="/">
          <span aria-hidden="true">b</span> briefly
        </Link>
        <div className="create_steps" aria-label="Newsletter creation steps">
          <Link className="create_step complete" href="/create/build">
            <b>1</b> Build
          </Link>
          <span className="step_line" />
          <span className="create_step active"><b>2</b> Deploy</span>
        </div>
        <Link className="create_exit" href="/newsletters">Save &amp; exit</Link>
      </header>

      <main className="deploy_workspace">
        <section className="deploy_intro">
          <p className="create_eyebrow">ALMOST THERE</p>
          <h1>Make it yours.</h1>
          <p>Give your newsletter a name, choose when it arrives, and publish.</p>
        </section>

        {isLoading ? (
          <p className="deploy_loading">Loading your draft…</p>
        ) : (
          <form className="deploy_form" onSubmit={publish}>
            <div className="deploy_details">
              <label>
                Newsletter title
                <input
                  name="title"
                  type="text"
                  value={draft.title}
                  onChange={updateField}
                  maxLength={120}
                  placeholder="e.g. The Daily Brief"
                  required
                />
              </label>
              <label>
                Short description
                <textarea
                  name="description"
                  value={draft.description}
                  onChange={updateField}
                  maxLength={1000}
                  rows={4}
                  placeholder="What will readers find in this newsletter?"
                  required
                />
              </label>
              <label>
                Thumbnail <span className="optional_label">Optional</span>
                <input
                  className="thumbnail_file_input"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={selectThumbnail}
                />
                <span className="file_hint">PNG, JPEG, or WebP · up to 5 MB</span>
              </label>
              {thumbnailPreview && (
                <div
                  className="thumbnail_preview"
                  role="img"
                  aria-label="Newsletter thumbnail preview"
                  style={{ backgroundImage: `url("${thumbnailPreview}")` }}
                />
              )}
            </div>

            <div className="publish_schedule">
              <p className="create_eyebrow">DELIVERY SCHEDULE</p>
              <h2>When should it arrive?</h2>
              <label className="time_picker">
                Time of day
                <input
                  name="publish_time"
                  type="time"
                  value={draft.publish_time}
                  onChange={updateField}
                  required
                />
              </label>
              <fieldset className="frequency_picker">
                <legend>How often?</legend>
                {frequencies.map((frequency) => (
                  <label
                    className={`frequency_option${draft.frequency === frequency.value ? ' selected' : ''}`}
                    key={frequency.value}
                  >
                    <input
                      type="radio"
                      name="frequency"
                      value={frequency.value}
                      checked={draft.frequency === frequency.value}
                      onChange={updateField}
                    />
                    <span className="frequency_radio" />
                    <span className="frequency_option_copy">
                      <strong>{frequency.label}</strong>
                      <small>{frequency.detail}</small>
                    </span>
                  </label>
                ))}
              </fieldset>
            </div>

            <div className="publish_confirmation">
              <span className="publish_check" aria-hidden="true">✓</span>
              <span>Your newsletter is saved to your account. You can edit it any time.</span>
            </div>
            {error && <p className="publish_error" role="alert">{error}</p>}

            <footer className="create_bottom_bar">
              <Link href="/create/build">← Back to build</Link>
              <button
                className="primary_create_button"
                type="submit"
                disabled={isPublishing || isLoading}
              >
                {isPublishing ? 'Publishing…' : draft.id ? 'Save changes' : 'Publish newsletter'}
                {!isPublishing && <span aria-hidden="true">→</span>}
              </button>
            </footer>
          </form>
        )}
      </main>
    </div>
  );
}
