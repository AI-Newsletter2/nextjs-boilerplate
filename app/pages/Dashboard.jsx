'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import './dashboard.css';

const coverColors = ['red', 'blue', 'purple'];

const frequencyNames = {
  daily: 'Daily',
  every_other_day: 'Every other day',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

function Mark({ children }) {
  return <span className="dashboard_mark" aria-hidden="true">{children}</span>;
}

export default function Dashboard() {
  const [message, setMessage] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [newsletters, setNewsletters] = useState([]);
  const [isLoadingNewsletters, setIsLoadingNewsletters] = useState(true);
  const [user, setUser] = useState({ name: 'there', email: '' });

  useEffect(() => {
    let active = true;
    fetch('/api/auth/account')
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Unable to load your account.');
        return result;
      })
      .then((account) => {
        if (active) setUser({ name: account.name || account.email.split('@')[0], email: account.email });
      })
      .catch((loadError) => {
        if (active) setMessage(loadError.message);
      });

    fetch('/api/newsletters')
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Unable to load newsletters.');
        return result.newsletters;
      })
      .then((items) => {
        if (active) setNewsletters(items);
      })
      .catch((loadError) => {
        if (active) setMessage(loadError.message);
      })
      .finally(() => {
        if (active) setIsLoadingNewsletters(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function logOut() {
    setIsLoggingOut(true);
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) throw new Error('Unable to sign out.');
      window.location.assign('/login');
    } catch {
      setMessage('Unable to sign out. Please try again.');
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="dashboard_page">
      <aside className="dashboard_sidebar">
        <Link className="dashboard_brand" href="/" aria-label="Briefly home">
          <Mark>b</Mark>
          <span>briefly</span>
        </Link>

        <nav className="sidebar_nav" aria-label="Main navigation">
          <Link className="sidebar_link selected" href="/" aria-current="page">
            <span aria-hidden="true">⌂</span> Home
          </Link>
          <Link className="sidebar_link" href="/newsletters">
            <span aria-hidden="true">▤</span> My newsletters
          </Link>
          <Link className="sidebar_link" href="/create/build">
            <span aria-hidden="true">＋</span> Create
          </Link>
          <Link className="sidebar_link" href="/settings/account">
            <span aria-hidden="true">⚙</span> Settings
          </Link>
        </nav>

        <div className="sidebar_bottom">
          <div className="profile_card">
            <span className="avatar" aria-hidden="true">{user.name.slice(0, 1).toUpperCase()}</span>
            <span className="profile_copy"><strong>{user.name}</strong><small>{user.email}</small></span>
          </div>
          <button
            className="sidebar_link sidebar_button"
            type="button"
            onClick={logOut}
            disabled={isLoggingOut}
          >
            <span aria-hidden="true">↪</span> {isLoggingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </aside>

      <div className="dashboard_main">
        <header className="dashboard_topbar">
          <span className="breadcrumb">Home <span aria-hidden="true">/</span> Overview</span>
        </header>

        <main className="dashboard_content">
          <section className="welcome_block">
            <p className="dashboard_eyebrow">YOUR BRIEFLY SPACE</p>
            <h1>Hello, {user.name}<span>.</span></h1>
            <p>Your newsletters, ready for today.</p>
          </section>

          <section className="dashboard_section" aria-labelledby="my-newsletters">
            <div className="dashboard_section_heading">
              <div>
                <p className="dashboard_eyebrow">YOUR READING LIST</p>
                <h2 id="my-newsletters">My newsletters</h2>
              </div>
              <a className="text_link" href="/newsletters">See all <span aria-hidden="true">→</span></a>
            </div>
            {isLoadingNewsletters ? (
              <p className="dashboard_list_message">Loading your newsletters…</p>
            ) : newsletters.length ? (
              <div className="my_newsletter_grid">
                {newsletters.slice(0, 3).map((newsletter, index) => (
                  <Link
                    className="my_newsletter_card"
                    href={`/create/build?id=${newsletter.id}`}
                    key={newsletter.id}
                  >
                    {newsletter.thumbnail_url ? (
                      <span
                        className="newsletter_cover uploaded_cover"
                        style={{ backgroundImage: `url("${newsletter.thumbnail_url}")` }}
                        role="img"
                        aria-label={`${newsletter.title} thumbnail`}
                      />
                    ) : (
                      <span className={`newsletter_cover ${coverColors[index % coverColors.length]}`}>
                        <span className="cover_number">0{index + 1}</span>
                        <span className="cover_wordmark">briefly</span>
                      </span>
                    )}
                    <span className="my_newsletter_details">
                      <strong>{newsletter.title}</strong>
                      <span>{newsletter.description || frequencyNames[newsletter.frequency]}</span>
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="dashboard_empty_newsletters">
                <p>No newsletters yet. Build your first personal brief.</p>
                <Link href="/create/build">Create a newsletter <span aria-hidden="true">→</span></Link>
              </div>
            )}
          </section>

          {message && <p className="dashboard_message" role="status">{message}</p>}
        </main>

        <footer className="dashboard_footer">
          <a className="footer_brand" href="/welcome">briefly</a>
          <nav aria-label="Footer navigation">
            <a href="/welcome">Home</a>
            <a href="/welcome#about">About</a>
          </nav>
          <span>© 2026 Briefly</span>
        </footer>
      </div>
    </div>
  );
}
