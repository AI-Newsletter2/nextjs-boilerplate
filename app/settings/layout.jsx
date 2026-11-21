import Link from 'next/link';
import SettingsNav from './SettingsNav';
import './settings.css';

export default function SettingsLayout({ children }) {
  return (
    <div className="settings_page">
      <aside className="settings_sidebar">
        <Link className="settings_back" href="/">
          <span aria-hidden="true">←</span> Back home
        </Link>
        <div className="settings_sidebar_title">Settings</div>
        <SettingsNav />
      </aside>
      <main className="settings_main">
        <header className="settings_header">
          <Link className="settings_mobile_back" href="/">← Home</Link>
          <span>BRIEFLY ACCOUNT</span>
        </header>
        <div className="settings_content">{children}</div>
        <footer className="settings_footer">
          <span>briefly</span>
          <span>© 2026 Briefly</span>
        </footer>
      </main>
    </div>
  );
}
