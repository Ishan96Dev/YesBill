import React from 'react';
import { useLocation } from '@docusaurus/router';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

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
        💻 Web
      </Link>
      <Link
        to="/mobile/intro"
        className={`${styles.option} ${isMobile ? styles.active : ''}`}
      >
        📱 Mobile
      </Link>
    </div>
  );
}
