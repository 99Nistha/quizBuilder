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
    default:
      return (
        <svg {...common}>
          <circle cx="60" cy="40" r="22" fill="#fff" />
        </svg>
      );
  }
}
