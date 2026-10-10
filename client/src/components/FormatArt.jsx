// Little doodles for each format. Drawn by hand in SVG, kept deliberately simple.
export default function FormatArt({ type }) {
  const common = { viewBox: '0 0 120 80', className: 'format-art', 'aria-hidden': true };
  switch (type) {
    case 'blind_ranking':
      return (
        <svg {...common}>
          {[0, 1, 2, 3].map((i) => (
            <g key={i} transform={`translate(10 ${8 + i * 17})`}>
              <circle cx="7" cy="6" r="6" fill="#161616" />
              <text x="7" y="9" fontSize="8" fontWeight="800" fill="#fff" textAnchor="middle" fontFamily="Rubik">
                {i + 1}
              </text>
              <rect x="18" y="1" width={i === 1 ? 46 : 0} height="10" rx="5" fill="#fff" />
              <rect x="18" y="1" width="58" height="10" rx="5" fill="none" stroke="#fff" strokeWidth="2" strokeDasharray={i === 1 ? '0' : '4 3'} />
            </g>
          ))}
          <g transform="translate(86 10) rotate(8)">
            <rect width="26" height="34" rx="4" fill="#ffd400" stroke="#161616" strokeWidth="2.5" />
            <text x="13" y="24" fontSize="18" fontWeight="800" textAnchor="middle" fill="#161616" fontFamily="Rubik">
              ?
            </text>
          </g>
        </svg>
      );
    case 'this_or_that':
      return (
        <svg {...common}>
          <rect x="8" y="14" width="42" height="52" rx="8" fill="#fff" stroke="#161616" strokeWidth="2.5" transform="rotate(-6 29 40)" />
          <rect x="70" y="14" width="42" height="52" rx="8" fill="#fff" stroke="#161616" strokeWidth="2.5" transform="rotate(5 91 40)" />
          <circle cx="60" cy="40" r="14" fill="#ffd400" stroke="#161616" strokeWidth="2.5" />
          <text x="60" y="45" fontSize="13" fontWeight="800" textAnchor="middle" fill="#161616" fontFamily="Rubik">
            or
          </text>
          <path d="M84 38l5 6 10-12" fill="none" stroke="#2f7bff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'would_you_rather':
      return (
        <svg {...common}>
          <path d="M14 14h40a8 8 0 0 1 8 8v16a8 8 0 0 1-8 8H30l-10 9v-9h-6a8 8 0 0 1-8-8V22a8 8 0 0 1 8-8z" fill="#fff" stroke="#161616" strokeWidth="2.5" />
          <path d="M66 28h40a8 8 0 0 1 8 8v16a8 8 0 0 1-8 8h-6v9l-10-9H66a8 8 0 0 1-8-8V36a8 8 0 0 1 8-8z" fill="#ffd400" stroke="#161616" strokeWidth="2.5" />
          <rect x="16" y="24" width="30" height="4" rx="2" fill="#161616" opacity=".25" />
          <rect x="16" y="32" width="22" height="4" rx="2" fill="#161616" opacity=".25" />
          <text x="86" y="50" fontSize="20" fontWeight="800" textAnchor="middle" fill="#161616" fontFamily="Rubik">?!</text>
        </svg>
      );
    case 'poll':
      return (
        <svg {...common}>
          {[52, 80, 30].map((w, i) => (
            <g key={i}>
              <rect x="12" y={12 + i * 20} width="96" height="14" rx="7" fill="#fff" opacity=".35" />
              <rect x="12" y={12 + i * 20} width={w} height="14" rx="7" fill={i === 1 ? '#ffd400' : '#fff'} stroke="#161616" strokeWidth="2" />
            </g>
          ))}
          <circle cx="98" cy="39" r="4" fill="#161616" />
        </svg>
      );
    case 'trivia':
      return (
        <svg {...common}>
          <rect x="14" y="10" width="92" height="22" rx="8" fill="#fff" stroke="#161616" strokeWidth="2.5" />
          <text x="60" y="26" fontSize="13" fontWeight="800" textAnchor="middle" fill="#161616" fontFamily="Rubik">7 / 10</text>
          <rect x="14" y="40" width="42" height="14" rx="7" fill="#1db954" stroke="#161616" strokeWidth="2" />
          <rect x="64" y="40" width="42" height="14" rx="7" fill="#fff" stroke="#161616" strokeWidth="2" />
          <rect x="14" y="60" width="42" height="14" rx="7" fill="#fff" stroke="#161616" strokeWidth="2" />
          <rect x="64" y="60" width="42" height="14" rx="7" fill="#ff6b6b" stroke="#161616" strokeWidth="2" />
        </svg>
      );
    case 'personality':
      return (
        <svg {...common}>
          <circle cx="40" cy="40" r="24" fill="#fff" stroke="#161616" strokeWidth="2.5" />
          <circle cx="32" cy="36" r="3" fill="#161616" />
          <circle cx="48" cy="36" r="3" fill="#161616" />
          <path d="M31 47c5 5 13 5 18 0" fill="none" stroke="#161616" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M74 18h34v22H90l-8 8v-8h-8z" fill="#ffd400" stroke="#161616" strokeWidth="2.5" strokeLinejoin="round" />
          <text x="91" y="34" fontSize="14" fontWeight="800" textAnchor="middle" fill="#161616" fontFamily="Rubik">you!</text>
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="60" cy="40" r="22" fill="#fff" />
        </svg>
      );
  }
}
