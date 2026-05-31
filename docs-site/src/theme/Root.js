import React from 'react';
import WebMobileToggle from '@site/src/components/WebMobileToggle';

/**
 * Docusaurus Root swizzle — injects a mobile-only floating toggle bar that
 * lets users switch between Web and Mobile docs without opening the hamburger
 * menu. Hidden on desktop (≥997px) where the toggle is already in the navbar.
 */
export default function Root({ children }) {
  return (
    <>
      {children}
      <div id="yb-mobile-doc-toggle" aria-label="Switch between Web and Mobile documentation">
        <WebMobileToggle />
      </div>
    </>
  );
}
