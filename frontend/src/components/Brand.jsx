import React from 'react';
import '../css/Brand.css';

// The PresentSir wordmark, used in the sidebar and on every signed-out page.
//
// The asset is 138x34 dark ink on transparency, with the purple figure standing
// in for the "N" at x 67-94. Two consequences handled in Brand.css:
//   - on the dark theme the ink would be invisible, so the letters are flipped
//     to white and the figure is re-laid over the top in its own colour;
//   - the figure doubles as an icon-only mark for the collapsed sidebar rail,
//     where the full wordmark would be about six pixels tall.
export const BrandLogo = ({ className = '' }) => (
  <span className={`brand-logo ${className}`.trim()} role="img" aria-label="PresentSir">
    <span className="brand-logo-word" />
    <span className="brand-logo-mark" aria-hidden="true" />
  </span>
);

// Just the purple figure, cropped out of the same file.
export const BrandMark = ({ className = '' }) => (
  <span className={`brand-mark ${className}`.trim()} role="img" aria-label="PresentSir" />
);

export default BrandLogo;
