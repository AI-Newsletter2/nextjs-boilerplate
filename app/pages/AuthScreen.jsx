'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import './auth.css';

export default function AuthScreen({ mode, defaultEmail = '', defaultName = 'Admin' }) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const isSignUp = mode === 'signup';

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch(isSignUp ? '/api/auth/signup' : '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(formData)),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error || 'Unable to sign in. Please try again.');
        return;
      }

      if (result.needsEmailConfirmation) {
        setMessage('Check your email to confirm your account, then sign in.');
        return;
      }

      router.replace('/');
      router.refresh();
    } catch {
      setMessage('Unable to complete that request. Check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth_screen">
      <section className="auth_card" aria-labelledby="auth_title">
        <Link className="auth_brand" href="/" aria-label="Briefly home">
          <span className="auth_brand_mark" aria-hidden="true">b</span>
          <span>briefly</span>
        </Link>

        <h1 id="auth_title">{isSignUp ? 'Create your account' : 'Welcome back'}</h1>
        <p className="auth_description">
          {isSignUp
            ? 'Create a Briefly account to get started.'
            : 'Sign in to continue to your newsletters.'}
        </p>

        <form className="auth_form" onSubmit={handleSubmit}>
          {isSignUp && (
            <label>
              Name
              <input
                type="text"
                name="name"
                autoComplete="name"
                placeholder="Your name"
                defaultValue={defaultName}
                required
              />
            </label>
          )}
          <label>
            {isSignUp ? 'Email' : 'Email or username'}
            <input
              type={isSignUp ? 'email' : 'text'}
              name="email"
              autoComplete={isSignUp ? 'email' : 'username'}
              placeholder={isSignUp ? 'you@example.com' : 'Email or username'}
              defaultValue={isSignUp ? defaultEmail : undefined}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              placeholder="Enter your password"
              required
            />
          </label>
          <button className="auth_submit_button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (isSignUp ? 'Creating account…' : 'Signing in…') : isSignUp ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="auth_switch">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <a href={isSignUp ? '/login' : '/signup'}>
            {isSignUp ? 'Sign in' : 'Sign up'}
          </a>
        </p>
        {message && <p className="auth_message" role="status">{message}</p>}
      </section>
    </main>
  );
}
