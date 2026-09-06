export default function ListPanel({ title, items, renderItem, action, emptyLabel, accentColor }) {
  return (
    <div
      className={`card card-hover p-5 sm:p-6 ${accentColor ? `border-l-4 ${accentColor}` : ""}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-ink-900">{title}</h2>
        {action}
      </div>
      {items.length === 0 && emptyLabel ? (
        <p className="py-3 text-sm text-ink-400">{emptyLabel}</p>
      ) : (
        <ul className="divide-y divide-ink-100">
          {items.map((item, i) => (
            <li key={i} className="-mx-2 rounded-lg px-2 py-2.5 transition hover:bg-ink-50/70 first:pt-2 last:pb-2">
              {renderItem(item, i)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
