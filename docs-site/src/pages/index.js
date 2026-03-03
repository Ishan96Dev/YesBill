import React from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';
import styles from './index.module.css';

/* ─── Minimal inline SVG icons ─── */
const IconPackage = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);
const IconCalendar = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IconReceipt = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
  </svg>
);
const IconBrain = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 017 4.5v0A2.5 2.5 0 014.5 7H4a2 2 0 00-2 2v2a2 2 0 002 2h.5A2.5 2.5 0 017 15.5v0A2.5 2.5 0 019.5 18H11v3h2v-3h1.5A2.5 2.5 0 0117 15.5v0A2.5 2.5 0 0119.5 13H20a2 2 0 002-2V9a2 2 0 00-2-2h-.5A2.5 2.5 0 0117 4.5v0A2.5 2.5 0 0114.5 2H9.5z"/>
  </svg>
);
const IconBarChart = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>
  </svg>
);
const IconBell = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
  </svg>
);
const IconArrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);
const IconMessageSquare = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
  </svg>
);
const IconBot = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/>
  </svg>
);
const IconFileText = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
  </svg>
);
const IconSettings = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
  </svg>
);

const IconRocket = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:'7px',flexShrink:0}}>
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
  </svg>
);
const IconBook = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:'7px',flexShrink:0}}>
    <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
  </svg>
);

const features = [
  {
    Icon: IconPackage,
    title: 'Track Every Service',
    description: 'Manage home deliveries, visit-based workers, utilities, subscriptions, and EMI payments all in one place.',
  },
  {
    Icon: IconCalendar,
    title: 'Calendar View',
    description: 'Visual day-by-day attendance grid. Mark deliveries, visits, and payments with a single click.',
  },
  {
    Icon: IconReceipt,
    title: 'Auto Bill Generation',
    description: 'Bills are calculated and generated automatically each month with itemised cost breakdowns.',
  },
  {
    Icon: IconMessageSquare,
    title: 'Ask AI Chat',
    description: 'Chat with a persistent AI assistant about your bills, spending patterns, and services in plain English.',
  },
  {
    Icon: IconBot,
    title: 'Agent Autopilot',
    description: 'An Intercom-style AI agent floating on every dashboard page, ready to take actions on your behalf.',
  },
  {
    Icon: IconBrain,
    title: 'AI Bill Summaries',
    description: 'AI-generated bill summaries with spending analysis, anomaly detection, and service recommendations.',
  },
  {
    Icon: IconBarChart,
    title: 'Analytics Dashboard',
    description: 'Visualise your monthly spend by service type, track AI usage costs, and spot trends over time.',
  },
  {
    Icon: IconFileText,
    title: 'PDF Invoice Export',
    description: 'Download fully formatted PDF invoices for any month — perfect for records or sharing with providers.',
  },
  {
    Icon: IconBell,
    title: 'Smart Notifications',
    description: 'Get notified when bills are generated, services expire, or important actions need your attention.',
  },
  {
    Icon: IconSettings,
    title: 'AI Configuration',
    description: 'Bring your own API key from OpenAI, Anthropic, or Google Gemini. Your keys never leave your browser.',
  },
];

const quickLinks = [
  { label: 'Create Account', to: '/getting-started/creating-account' },
  { label: 'Add a Service', to: '/services/overview' },
  { label: 'Use Ask AI', to: '/ai-features/ask-ai' },
  { label: 'Understand Bills', to: '/bills/understanding-bills' },
  { label: 'Configure AI', to: '/ai-features/ai-configuration' },
  { label: 'View Analytics', to: '/ai-features/overview' },
];

function FeatureCard({ Icon, title, description, comingSoon }) {
  return (
    <div className={styles.featureCard}>
      <div className={styles.featureCardHeader}>
        <div className={styles.featureIcon}><Icon /></div>
        {comingSoon && <span className={styles.comingSoonBadge}>Coming Soon</span>}
      </div>
      <h3 className={styles.featureTitle}>{title}</h3>
      <p className={styles.featureDesc}>{description}</p>
    </div>
  );
}

export default function Home() {
  const logoUrl = useBaseUrl('/img/yesbill_logo_black.png');
  return (
    <Layout
      title="YesBill Documentation"
      description="Smart billing tracking for Indian households — documentation and user guide"
    >
      {/* Hero */}
      <header className={styles.hero}>
        <div className={styles.heroOrb1} aria-hidden="true" />
        <div className={styles.heroOrb2} aria-hidden="true" />
        <div className={styles.heroOrb3} aria-hidden="true" />
        <div className={styles.heroOrb4} aria-hidden="true" />
        <div className={styles.heroInner}>
          <img
            src={logoUrl}
            alt="YesBill"
            className={styles.heroLogo}
            style={{ display: 'block', width: '240px', minWidth: '240px', height: 'auto', margin: '0 auto 28px', filter: 'brightness(0) invert(1)', objectFit: 'contain' }}
          />
          <div className={styles.heroBadge}>v1.0.0 — Now Available</div>
          <h1 className={styles.heroTitle}>YesBill Documentation</h1>
          <p className={styles.heroSubtitle}>
            Everything you need to track your household services, generate monthly bills,
            and use AI to manage your expenses effortlessly.
          </p>
          <div className={styles.heroFeaturePills}>
            {['🏠 Services', '📅 Calendar', '💵 Auto Bills', '🤖 Ask AI', '📊 Analytics'].map((pill) => (
              <span key={pill} className={styles.heroPill}>{pill}</span>
            ))}
          </div>
          <div className={styles.heroCta}>
            <Link className={styles.ctaPrimary} to="/getting-started/creating-account">
              <IconRocket />Get Started
            </Link>
            <Link className={styles.ctaSecondary} to="/intro">
              <IconBook />Read Introduction
            </Link>
          </div>
        </div>
      </header>

      {/* Features Grid */}
      <main className={styles.main}>
        <section className={styles.featuresSection}>
          <h2 className={styles.sectionTitle}>Everything You Need</h2>
          <p className={styles.sectionSubtitle}>
            YesBill covers the full lifecycle of household service management — from tracking daily
            deliveries to generating monthly bills and analysing spend.
          </p>
          <div className={styles.featuresGrid}>
            {features.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </section>

        {/* Quick Links */}
        <section className={styles.quickLinks}>
          <h2 className={styles.sectionTitle}>Jump Right In</h2>
          <div className={styles.quickLinksGrid}>
            {quickLinks.map(({ label, to }) => (
              <Link key={label} to={to} className={styles.quickLink}>
                <span>{label}</span>
                <IconArrow />
              </Link>
            ))}
          </div>
        </section>
      </main>
    </Layout>
  );
}

