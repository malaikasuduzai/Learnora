// Topic-relevant "cover art" for each course, drawn as inline SVG instead of
// hot-linked stock photography. This keeps the landing page fast (no extra
// network requests, nothing that can 404), consistent with the rest of the
// design system's color tokens, and crisp at any screen size.

function Frame({ children, className }) {
  return (
    <svg
      viewBox="0 0 400 180"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

// Full Stack Web Development — a little browser window with a wireframed page
export function WebDevCover({ className }) {
  return (
    <Frame className={className}>
      <rect x="48" y="24" width="304" height="132" rx="10" fill="white" fillOpacity="0.14" />
      <rect x="48" y="24" width="304" height="26" rx="10" fill="white" fillOpacity="0.18" />
      <circle cx="64" cy="37" r="4" fill="white" fillOpacity="0.55" />
      <circle cx="78" cy="37" r="4" fill="white" fillOpacity="0.4" />
      <circle cx="92" cy="37" r="4" fill="white" fillOpacity="0.4" />
      <rect x="120" y="32" width="150" height="10" rx="5" fill="white" fillOpacity="0.25" />
      <rect x="64" y="66" width="90" height="70" rx="6" fill="white" fillOpacity="0.22" />
      <rect x="164" y="66" width="172" height="14" rx="4" fill="white" fillOpacity="0.5" />
      <rect x="164" y="86" width="172" height="8" rx="4" fill="white" fillOpacity="0.28" />
      <rect x="164" y="100" width="140" height="8" rx="4" fill="white" fillOpacity="0.28" />
      <rect x="164" y="118" width="72" height="18" rx="6" fill="white" fillOpacity="0.5" />
      <path d="M76 90 90 104 76 118M104 118l16-28" stroke="white" strokeOpacity="0.65" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Frame>
  );
}

// Python Programming — a code editor with syntax-highlighted lines
export function PythonCover({ className }) {
  const lines = [
    { w: 70, o: 0.55 },
    { w: 130, o: 0.3 },
    { w: 100, o: 0.3 },
    { w: 150, o: 0.3 },
    { w: 60, o: 0.55 },
    { w: 90, o: 0.3 },
  ];
  return (
    <Frame className={className}>
      <rect x="40" y="20" width="320" height="140" rx="10" fill="black" fillOpacity="0.18" />
      <rect x="40" y="20" width="320" height="24" rx="10" fill="white" fillOpacity="0.12" />
      <circle cx="56" cy="32" r="4" fill="white" fillOpacity="0.5" />
      <circle cx="70" cy="32" r="4" fill="white" fillOpacity="0.35" />
      <circle cx="84" cy="32" r="4" fill="white" fillOpacity="0.35" />
      <rect x="58" y="58" width="14" height="86" rx="3" fill="white" fillOpacity="0.12" />
      {lines.map((l, i) => (
        <rect
          key={i}
          x="86"
          y={58 + i * 15}
          width={l.w}
          height="8"
          rx="4"
          fill="white"
          fillOpacity={l.o}
        />
      ))}
      <rect x={86 + 60} y={58 + 0 * 15} width="1.6" height="10" fill="white" fillOpacity="0.9">
        <animate attributeName="opacity" values="1;0;1" dur="1.1s" repeatCount="indefinite" />
      </rect>
    </Frame>
  );
}

// UI/UX Design — an artboard with a wireframed card and a cursor
export function UiUxCover({ className }) {
  return (
    <Frame className={className}>
      <rect x="56" y="26" width="288" height="128" rx="12" fill="white" fillOpacity="0.14" />
      <rect x="80" y="46" width="140" height="88" rx="8" fill="white" fillOpacity="0.22" />
      <rect x="96" y="60" width="108" height="10" rx="5" fill="white" fillOpacity="0.5" />
      <rect x="96" y="78" width="80" height="7" rx="3.5" fill="white" fillOpacity="0.3" />
      <rect x="96" y="92" width="90" height="7" rx="3.5" fill="white" fillOpacity="0.3" />
      <rect x="96" y="110" width="60" height="14" rx="7" fill="white" fillOpacity="0.55" />
      <circle cx="266" cy="70" r="16" fill="white" fillOpacity="0.5" />
      <rect x="240" y="102" width="80" height="8" rx="4" fill="white" fillOpacity="0.25" />
      <rect x="240" y="116" width="52" height="8" rx="4" fill="white" fillOpacity="0.25" />
      {[240, 258, 276].map((cx) => (
        <circle key={cx} cx={cx} cy={140} r="5" fill="white" fillOpacity="0.4" />
      ))}
      <path d="M300 92 314 130 305 122 298 132Z" fill="white" fillOpacity="0.85" />
    </Frame>
  );
}

// Database Systems — stacked cylinders with connections
export function DatabaseCover({ className }) {
  const cyl = (x, y, w, h, o) => (
    <g key={`${x}-${y}`}>
      <ellipse cx={x} cy={y} rx={w} ry={h * 0.28} fill="white" fillOpacity={o + 0.15} />
      <rect x={x - w} y={y} width={w * 2} height={h} fill="white" fillOpacity={o} />
      <ellipse cx={x} cy={y + h} rx={w} ry={h * 0.28} fill="white" fillOpacity={o + 0.1} />
    </g>
  );
  return (
    <Frame className={className}>
      {cyl(140, 34, 52, 26, 0.16)}
      {cyl(140, 78, 52, 26, 0.22)}
      {cyl(140, 122, 52, 26, 0.3)}
      <path d="M212 46h48M212 90h48M212 132h48" stroke="white" strokeOpacity="0.4" strokeWidth="3" strokeDasharray="2 6" strokeLinecap="round" />
      <circle cx="278" cy="46" r="14" fill="white" fillOpacity="0.35" />
      <circle cx="278" cy="90" r="14" fill="white" fillOpacity="0.35" />
      <circle cx="278" cy="132" r="14" fill="white" fillOpacity="0.35" />
      <path d="M270 40h16M270 46h16M270 52h16" stroke="white" strokeOpacity="0.7" strokeWidth="2" strokeLinecap="round" />
    </Frame>
  );
}

// Data Structures & Algorithms — a binary tree of nodes
export function DsaCover({ className }) {
  const nodes = [
    [200, 34],
    [140, 82],
    [260, 82],
    [104, 132],
    [176, 132],
    [224, 132],
    [296, 132],
  ];
  const edges = [
    [0, 1],
    [0, 2],
    [1, 3],
    [1, 4],
    [2, 5],
    [2, 6],
  ];
  return (
    <Frame className={className}>
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a][0]}
          y1={nodes[a][1]}
          x2={nodes[b][0]}
          y2={nodes[b][1]}
          stroke="white"
          strokeOpacity="0.4"
          strokeWidth="2.5"
        />
      ))}
      {nodes.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={i === 0 ? 14 : i < 3 ? 11 : 9}
          fill="white"
          fillOpacity={i === 0 ? 0.65 : i < 3 ? 0.45 : 0.32}
        />
      ))}
    </Frame>
  );
}

// Mobile App Development — a phone with an app screen
export function MobileCover({ className }) {
  return (
    <Frame className={className}>
      <rect x="150" y="14" width="100" height="152" rx="16" fill="white" fillOpacity="0.16" />
      <rect x="158" y="30" width="84" height="118" rx="4" fill="white" fillOpacity="0.15" />
      <rect x="188" y="20" width="24" height="5" rx="2.5" fill="white" fillOpacity="0.5" />
      <rect x="166" y="40" width="68" height="30" rx="6" fill="white" fillOpacity="0.4" />
      <rect x="166" y="76" width="68" height="10" rx="5" fill="white" fillOpacity="0.28" />
      <rect x="166" y="90" width="46" height="8" rx="4" fill="white" fillOpacity="0.22" />
      <rect x="166" y="112" width="68" height="22" rx="6" fill="white" fillOpacity="0.55" />
      <circle cx="178" cy="141" r="5" fill="white" fillOpacity="0.45" />
      <circle cx="200" cy="141" r="5" fill="white" fillOpacity="0.45" />
      <circle cx="222" cy="141" r="5" fill="white" fillOpacity="0.45" />
      <path d="M90 60c14-10 14-30 30-34M310 120c-14 10-14 30-30 34" stroke="white" strokeOpacity="0.3" strokeWidth="3" strokeLinecap="round" fill="none" />
    </Frame>
  );
}

// Generic fallback — an open book with a bookmark, used for any course
// whose title/category doesn't match one of the topic-specific covers above.
export function GenericCover({ className }) {
  return (
    <Frame className={className}>
      <path
        d="M60 46c30-10 70-10 100 4v96c-30-14-70-14-100-4Z"
        fill="white"
        fillOpacity="0.22"
      />
      <path
        d="M340 46c-30-10-70-10-100 4v96c30-14 70-14 100-4Z"
        fill="white"
        fillOpacity="0.16"
      />
      <line x1="200" y1="50" x2="200" y2="146" stroke="white" strokeOpacity="0.35" strokeWidth="3" />
      <rect x="76" y="66" width="64" height="7" rx="3.5" fill="white" fillOpacity="0.4" />
      <rect x="76" y="82" width="80" height="7" rx="3.5" fill="white" fillOpacity="0.28" />
      <rect x="76" y="98" width="56" height="7" rx="3.5" fill="white" fillOpacity="0.28" />
      <rect x="224" y="66" width="64" height="7" rx="3.5" fill="white" fillOpacity="0.3" />
      <rect x="224" y="82" width="80" height="7" rx="3.5" fill="white" fillOpacity="0.22" />
      <rect x="224" y="98" width="56" height="7" rx="3.5" fill="white" fillOpacity="0.22" />
      <path d="M182 30v34l10-8 10 8V30Z" fill="white" fillOpacity="0.6" />
    </Frame>
  );
}

const COVERS = {
  web: WebDevCover,
  python: PythonCover,
  uiux: UiUxCover,
  database: DatabaseCover,
  dsa: DsaCover,
  mobile: MobileCover,
  generic: GenericCover,
};

export default function CourseCover({ variant, className = "h-full w-full" }) {
  const Cover = COVERS[variant] || GenericCover;
  return <Cover className={className} />;
}
