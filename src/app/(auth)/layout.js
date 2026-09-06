import Link from "next/link";
import {
  BarChartIcon,
  BookOpenIcon,
  CalendarCheckIcon,
  PlayCircleIcon,
} from "@/components/icons";

const HIGHLIGHTS = [
  {
    icon: PlayCircleIcon,
    title: "Learn at your own pace",
    body: "Stream lectures, download resources and pick up right where you left off.",
  },
  {
    icon: CalendarCheckIcon,
    title: "Stay on top of deadlines",
    body: "Attendance, assignments and due dates are always one glance away.",
  },
  {
    icon: BarChartIcon,
    title: "Watch your progress grow",
    body: "Real-time tracking across every course you're enrolled in.",
  },
];

export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-paper">
      {/* Brand panel */}
      <div className="relative hidden w-[44%] flex-col justify-between overflow-hidden bg-ink-950 px-12 py-12 text-white lg:flex xl:w-[38%]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brass-500/20 blur-3xl"
          aria-hidden="true"
        />

        <Link href="/" className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brass-500 font-display text-lg font-semibold text-ink-950">
            L
          </div>
          <div>
            <p className="font-display text-lg font-semibold leading-none">Learnora</p>
            <p className="mt-1 text-[11px] uppercase tracking-wide text-ink-400">
              Learning Management
            </p>
          </div>
        </Link>

        <div className="relative">
          <p className="eyebrow text-brass-300">Online learning, reimagined</p>
          <h2 className="mt-3 max-w-sm font-display text-3xl font-semibold leading-tight">
            Everything you need to learn, in one place.
          </h2>
          <ul className="mt-10 space-y-6">
            {HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="h-[18px] w-[18px] text-brass-300" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-ink-300">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center gap-3 border-t border-white/10 pt-6">
          <div className="flex -space-x-2.5">
            {["from-brand-400 to-brand-600", "from-brass-400 to-brass-600", "from-emerald-400 to-emerald-600"].map(
              (ring, i) => (
                <span
                  key={ring}
                  className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${ring} font-display text-[11px] font-semibold text-white ring-2 ring-ink-950`}
                >
                  {["AR", "HT", "SK"][i]}
                </span>
              )
            )}
          </div>
          <p className="text-xs text-ink-400">
            A focused learning space for students and teachers.
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 flex-col">
        <div className="flex items-center gap-3 px-6 py-6 lg:hidden">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-950 font-display text-base font-semibold text-brass-400">
              L
            </div>
            <span className="font-display text-base font-semibold text-ink-900">Learnora</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-4 pb-12 pt-2 sm:px-6 lg:pt-12">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  );
}
