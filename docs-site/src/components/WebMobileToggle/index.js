import React from 'react';
import { useLocation } from '@docusaurus/router';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

const MonitorIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ marginRight: 4, verticalAlign: '-2px' }}
    aria-hidden="true"
  >
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const PhoneIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ marginRight: 4, verticalAlign: '-1px' }}
    aria-hidden="true"
  >
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
);

export default function WebMobileToggle() {
  const location = useLocation();
  // Use regex so it works regardless of whether baseUrl prefix is in the pathname
  const isMobile = /\/mobile(\/|$)/.test(location.pathname);

  return (
    <div className={styles.toggle}>
      <Link
        to="/intro"
        className={`${styles.option} ${!isMobile ? styles.active : ''}`}
      >
        <MonitorIcon /> Web
      </Link>
      <Link
        to="/mobile/intro"
        className={`${styles.option} ${isMobile ? styles.active : ''}`}
      >
        <PhoneIcon /> Mobile
      </Link>
    </div>
  );
}
