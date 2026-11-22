/** The COSME logo: an orange planet with four colored rings and a lightning bolt across it. */
export function Logo({ size = 44, full = false }: { size?: number; full?: boolean }) {
  if (!full) {
    return (
      <svg width={size} height={size * 0.9} viewBox="20 90 580 330" aria-hidden="true">
        <g transform="translate(310 250) rotate(-18)" fill="none" strokeWidth="18">
          <ellipse rx="285" ry="70" stroke="#3B82F6" />
          <ellipse rx="230" ry="52" stroke="#FFD23F" />
        </g>
        <circle cx="310" cy="250" r="140" fill="#FF7A1A" stroke="#0A0A0F" strokeWidth="8" />
        <polygon points="345,110 255,262 305,262 268,392 372,226 318,226 368,110" fill="#FFD23F" stroke="#0A0A0F" strokeWidth="10" strokeLinejoin="round" />
      </svg>
    );
  }
  const rings = (
    <g fill="none" strokeWidth="13">
      <ellipse rx="285" ry="70" stroke="#3B82F6" />
      <ellipse rx="252" ry="60" stroke="#8B5CF6" />
      <ellipse rx="220" ry="50" stroke="#FFD23F" />
      <ellipse rx="190" ry="40" stroke="#FF8A3D" />
    </g>
  );
  return (
    <svg width={size} height={size} viewBox="20 30 580 480" role="img" aria-label="COSME logo">
      <defs>
        <radialGradient id="cosmePlanet" cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#FFC266" />
          <stop offset="0.55" stopColor="#FF7A1A" />
          <stop offset="1" stopColor="#B8410A" />
        </radialGradient>
        <clipPath id="cosmeFront" clipPathUnits="userSpaceOnUse">
          <rect x="-400" y="0" width="800" height="400" />
        </clipPath>
      </defs>
      <g transform="translate(310 250) rotate(-18)">{rings}</g>
      <circle cx="310" cy="250" r="140" fill="url(#cosmePlanet)" stroke="#0A0A0F" strokeWidth="6" />
      <polygon points="345,110 255,262 305,262 268,392 372,226 318,226 368,110" fill="#FFD23F" stroke="#0A0A0F" strokeWidth="8" strokeLinejoin="round" />
      <g transform="translate(310 250) rotate(-18)" clipPath="url(#cosmeFront)">{rings}</g>
    </svg>
  );
}
