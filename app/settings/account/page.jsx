'use client';

import { useEffect, useState } from 'react';

export default function AccountSettingsPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [isGoogleAccount, setIsGoogleAccount] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/auth/account')
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load account.');
        return data;
      })
      .then((data) => {
        if (!active) return;
        setForm({ name: data.name, email: data.email, password: '' });
        setIsGoogleAccount(data.isGoogleAccount);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function saveAccount(event) {
    event.preventDefault();
    setIsSaving(true);
    setMessage('');
    setError('');
    try {
      const response = await fetch('/api/auth/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to save changes.');
      setForm((current) => ({ ...current, password: '' }));
      setMessage(
        data.emailConfirmationPending
          ? 'Check your email to confirm the new address. Your name and other changes were saved.'
          : 'Your account details have been saved.',
      );
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="settings_panel" aria-labelledby="account-title">
      <div className="settings_page_heading">
        <p className="settings_eyebrow">YOUR DETAILS</p>
        <h1 id="account-title">Account</h1>
        <p>Update the details associated with your Briefly account.</p>
      </div>

      {isLoading ? (
        <p className="settings_status">Loading your account…</p>
      ) : (
        <form className="account_form" onSubmit={saveAccount}>
          <label>
            Name
            <input
              name="name"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={updateField}
              maxLength={100}
              required
            />
          </label>
          <label>
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={updateField}
              maxLength={254}
              required
            />
          </label>
          {isGoogleAccount ? (
            <div className="google_password_note">
              This account uses Google sign-in. Manage your password with Google.
            </div>
          ) : (
            <label>
              New password
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={updateField}
                minLength={8}
                placeholder="Leave blank to keep your current password"
              />
              <span className="field_hint">Use at least 8 characters. Password changes take effect immediately.</span>
            </label>
          )}
          {error && <p className="settings_error" role="alert">{error}</p>}
          {message && <p className="settings_success" role="status">{message}</p>}
          <button className="settings_save_button" type="submit" disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      )}
    </section>
  );
}
