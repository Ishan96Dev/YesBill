import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

/**
 * PhoneFrame — renders a screenshot inside a Google Pixel 9 Pro-style mockup.
 *
 * Automatically resolves image paths via useBaseUrl (works on GitHub Pages
 * and any custom baseUrl deployment).
 *
 * Usage in any MDX/Markdown doc:
 *   <PhoneFrame src="/img/screenshots/mobile/screen.jpeg" alt="Screen description" />
 *   <PhoneFrame src="..." alt="..." caption="Optional caption" />
 */
export default function PhoneFrame({ src, alt, caption }) {
  const resolvedSrc = useBaseUrl(src);
  return (
    <div className={styles.phoneOuter}>
      <div className={styles.phoneDevice}>
        {/* Phone body shell */}
        <div className={styles.phoneBody}>
          {/* Side hardware buttons (right side) */}
          <div className={styles.phoneSideButtons}>
            <div className={styles.phoneVolumeUp} />
            <div className={styles.phoneVolumeDown} />
            <div className={styles.phonePowerButton} />
          </div>

          {/* Screen with punch-hole camera overlay */}
          <div className={styles.phoneScreen}>
            {/* Punch-hole selfie camera */}
            <div className={styles.phonePunchHole} />
            <img src={resolvedSrc} alt={alt || ''} />
          </div>

          {/* Bottom: USB-C port */}
          <div className={styles.phoneBottomBar}>
            <div className={styles.phoneSpeakerLeft} />
            <div className={styles.phoneUSBC} />
            <div className={styles.phoneSpeakerRight} />
          </div>
        </div>
      </div>

      {caption && (
        <p className={styles.phoneCaption}>{caption}</p>
      )}
    </div>
  );
}
