import React from 'react';
import { useLocation } from '@docusaurus/router';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

export default function WebMobileToggle() {
  const location = useLocation();
  const isMobile = location.pathname.startsWith('/mobile');

  // Derive the equivalent path in the other section
  const toMobile = isMobile
    ? null
    : '/mobile' + (location.pathname === '/' ? '/intro' : location.pathname);
  const toWeb = isMobile
    ? location.pathname.replace(/^\/mobile/, '') || '/intro'
    : null;

  return (
    <div className={styles.toggle}>
      <Link
        to={isMobile ? toWeb : '/intro'}
        className={`${styles.option} ${!isMobile ? styles.active : ''}`}
      >
        💻 Web
      </Link>
      <Link
        to={isMobile ? '/mobile/intro' : toMobile}
        className={`${styles.option} ${isMobile ? styles.active : ''}`}
      >
        📱 Mobile
      </Link>
    </div>
  );
}
