'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const settingsSections = [
  { href: '/settings/account', label: 'Account', icon: '◉' },
  { href: '/settings/subscription', label: 'Subscription', icon: '◇' },
];

export default function SettingsNav() {
  const pathname = usePathname();
  return (
    <nav className="settings_nav" aria-label="Settings">
      {settingsSections.map((section) => (
        <Link
          className={`settings_nav_link${pathname === section.href ? ' active' : ''}`}
          href={section.href}
          aria-current={pathname === section.href ? 'page' : undefined}
          key={section.href}
        >
          <span aria-hidden="true">{section.icon}</span>
          {section.label}
        </Link>
      ))}
    </nav>
  );
}
