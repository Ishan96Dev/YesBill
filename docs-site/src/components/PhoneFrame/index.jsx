import React from 'react';
import styles from './styles.module.css';

/**
 * PhoneFrame — renders a screenshot inside a mobile phone mockup.
 *
 * Usage in any MDX/Markdown doc:
 *   <PhoneFrame src="/img/screenshots/mobile/screen.jpeg" alt="Screen description" />
 *   <PhoneFrame src="..." alt="..." caption="Optional caption" />
 */
export default function PhoneFrame({ src, alt, caption }) {
  return (
    <div className={styles.phoneOuter}>
      <div className={styles.phoneDevice}>
        {/* Speaker / Dynamic Island pill */}
        <div className={styles.phoneSpeaker}>
          <div className={styles.phoneSpeakerDot} />
          <div className={styles.phoneSpeakerBar} />
          <div className={styles.phoneSpeakerDot} />
        </div>

        {/* Screen */}
        <div className={styles.phoneScreen}>
          <img src={src} alt={alt || ''} />
        </div>

        {/* Home indicator */}
        <div className={styles.phoneHome} />
      </div>

      {caption && (
        <p className={styles.phoneCaption}>{caption}</p>
      )}
    </div>
  );
}
