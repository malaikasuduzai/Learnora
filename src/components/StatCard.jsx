
const ROLE_COLOR = {
  "text-role-superadmin": "#6d3fa8",
  "text-role-admin": "#1d4ed8",
  "text-role-teacher": "#a9691c",
  "text-role-student": "#0f7a5d",
};

const PALETTE = ["#2568f5", "#0f7a5d", "#b8842e", "#a9691c", "#6d3fa8", "#c0392b"];

function colorForLabel(label = "") {
  let hash = 0;
  for (let i = 0; i < label.length; i += 1) {
    hash = (hash * 31 + label.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

export default function StatCard({ label, value, icon: Icon, accent, color }) {
  const accentColor = color || ROLE_COLOR[accent] || colorForLabel(label);

  return (
    <div className="stat-card group min-w-0" style={{ "--tile-accent": accentColor }}>
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0 break-words text-xs font-medium uppercase leading-snug tracking-wide text-ink-400">
          {label}
        </span>
        {Icon && (
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white transition duration-300 group-hover:scale-105"
            style={{ backgroundColor: accentColor }}
          >
            <Icon className="h-4.5 w-4.5" />
          </span>
        )}
      </div>
      <p className="truncate font-display text-3xl font-semibold tabular-nums text-ink-900">{value}</p>
    </div>
  );
}
