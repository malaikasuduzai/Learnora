const ROLE_CLASSES = {
  teacher: {
    border: "border-role-teacherSoft",
    from: "from-role-teacherSoft",
    badge: "bg-role-teacher",
    glow: "bg-role-teacher/10",
  },
  student: {
    border: "border-role-studentSoft",
    from: "from-role-studentSoft",
    badge: "bg-role-student",
    glow: "bg-role-student/10",
  },
  admin: {
    border: "border-role-adminSoft",
    from: "from-role-adminSoft",
    badge: "bg-role-admin",
    glow: "bg-role-admin/10",
  },
  superadmin: {
    border: "border-role-superadminSoft",
    from: "from-role-superadminSoft",
    badge: "bg-role-superadmin",
    glow: "bg-role-superadmin/10",
  },
};

export default function RolePageHeader({ role = "teacher", icon: IconCmp, title, description, action }) {
  const c = ROLE_CLASSES[role] ?? ROLE_CLASSES.teacher;
  return (
    <div className={`relative overflow-hidden rounded-2xl border ${c.border} bg-gradient-to-br ${c.from} via-white to-white px-6 py-6 shadow-card sm:px-8 sm:py-7`}>
      <div className={`pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full ${c.glow} blur-2xl`} />
      <div className="pointer-events-none absolute -bottom-16 left-1/3 h-32 w-32 rounded-full bg-brass-300/10 blur-2xl" />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {IconCmp && (
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${c.badge} text-white shadow-sm`}>
              <IconCmp className="h-6 w-6" />
            </span>
          )}
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink-900 sm:text-[26px]">{title}</h1>
            {description && (
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-500">{description}</p>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
