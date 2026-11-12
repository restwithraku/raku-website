import React, { useId } from 'react';

// The logo itself is the designer's artwork in public/brand (Artboards 9 and 10, trimmed only).
// Round "ISO 9001:2015 certified company" seal, after the one on the product label.
// Both curved words sit in the same band between the rings (radius 42 to 51):
// "CERTIFIED" stands on the top arc (r 42) and reads outward; "COMPANY" hangs from the bottom arc (r 51) and reads inward.
export function IsoBadge({ className }) {
  const id = useId().replace(/:/g, '');
  return <svg className={className} viewBox="0 0 120 120" fill="none" stroke="currentColor" role="img" aria-label="ISO 9001:2015 certified company">
    <defs>
      <path id={`${id}-top`} d="M18 60a42 42 0 0 1 84 0"/>
      <path id={`${id}-bottom`} d="M9 60a51 51 0 0 0 102 0"/>
    </defs>
    <circle cx="60" cy="60" r="56" strokeWidth="3"/>
    <circle cx="60" cy="60" r="33" strokeWidth="1.5"/>
    <g fill="currentColor" stroke="none" fontFamily="'DM Sans', sans-serif" fontWeight="700" textAnchor="middle">
      <text fontSize="12.5" letterSpacing="2.5"><textPath href={`#${id}-top`} startOffset="50%">CERTIFIED</textPath></text>
      <text fontSize="12.5" letterSpacing="2.5"><textPath href={`#${id}-bottom`} startOffset="50%">COMPANY</textPath></text>
      <text x="60" y="61" fontSize="21" letterSpacing=".5">ISO</text>
      <text x="60" y="77" fontSize="11" fontWeight="600">9001:2015</text>
    </g>
  </svg>;
}
