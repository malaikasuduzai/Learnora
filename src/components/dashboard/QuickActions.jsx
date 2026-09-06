import Link from "next/link";

export default function QuickActions({ actions }) {
  return (
    <div className="card p-5 sm:p-6">
      <h2 className="font-display text-lg font-semibold text-ink-900">Quick actions</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {actions.map(({ label, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="group flex flex-col items-start gap-2.5 rounded-xl border-2 border-ink-300 p-3.5 transition duration-200 hover:-translate-y-0.5 hover:border-brass-400 hover:bg-brass-50/60 hover:shadow-gold"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brass-50 text-brass-600 transition group-hover:bg-brass-500 group-hover:text-white">
              <Icon className="h-4 w-4" />
            </span>
            <span className="text-sm font-medium text-ink-700">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
