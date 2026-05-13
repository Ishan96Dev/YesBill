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
/**
 * @param {'cover'|'contain'} [fit='cover']
 *   'cover'   — fills the screen area, cropping if the screenshot is not a
 *               perfect portrait (default, works for all full-phone screenshots).
 *   'contain' — scales the image to fit entirely inside the screen, showing
 *               the full image with the background filling any gaps. Use this
 *               for cropped / dialog / non-portrait screenshots.
 * @param {string} [bg]
 *   Background colour shown behind the image when fit='contain'.
 *   Defaults to '#0f0f23' (app dark background) for contain mode.
 */
export default function PhoneFrame({ src, alt, caption, fit = 'cover', bg }) {
  const resolvedSrc = useBaseUrl(src);
  const isContain = fit === 'contain';
  const screenBg = isContain ? (bg || '#0f0f23') : undefined;
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
          <div
            className={`${styles.phoneScreen} ${isContain ? styles.phoneScreenContain : ''}`}
            style={screenBg ? { background: screenBg } : undefined}
          >
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
