// The little Playbee bee. Kept as plain SVG so it's crisp at any size.
export default function BeeMark({ className = 'logo-bee-mark' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      {/* wings */}
      <ellipse cx="24" cy="17" rx="10" ry="13" transform="rotate(-25 24 17)" fill="#bfe3ff" stroke="#1c2b4b" strokeWidth="3" />
      <ellipse cx="40" cy="16" rx="9" ry="12" transform="rotate(20 40 16)" fill="#dff1ff" stroke="#1c2b4b" strokeWidth="3" />
      {/* body */}
      <ellipse cx="34" cy="40" rx="20" ry="15" fill="#ffb703" stroke="#1c2b4b" strokeWidth="3" />
      <path d="M30 26c-3 9-3 19 0 28M40 27c-3 8-3 18 0 26" fill="none" stroke="#1c2b4b" strokeWidth="6" strokeLinecap="round" />
      <path d="M53 41l7 2-7 3" fill="#1c2b4b" stroke="#1c2b4b" strokeWidth="2" strokeLinejoin="round" />
      {/* head */}
      <circle cx="15" cy="40" r="10" fill="#1c2b4b" />
      <circle cx="12" cy="38" r="2.4" fill="#fff" />
      <path d="M9 44c2 2 5 2 7 0" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      {/* antennae */}
      <path d="M13 31c-2-5-5-7-8-7M18 31c0-5 2-8 5-9" fill="none" stroke="#1c2b4b" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
