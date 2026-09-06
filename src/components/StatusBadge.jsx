const STYLES = {
  // Course status
  DRAFT: "bg-ink-100 text-ink-500",
  PUBLISHED: "bg-emerald-50 text-emerald-700",
  ARCHIVED: "bg-amber-50 text-amber-700",
  // Enrollment status
  ACTIVE: "bg-emerald-50 text-emerald-700",
  COMPLETED: "bg-brand-50 text-brand-700",
  CANCELLED: "bg-red-50 text-red-700",
  // Account status
  YES: "bg-emerald-50 text-emerald-700",
  NO: "bg-ink-100 text-ink-500",
};

const LABELS = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export default function StatusBadge({ status, label }) {
  const style = STYLES[status] || "bg-ink-100 text-ink-500";
  return <span className={`badge ${style}`}>{label || LABELS[status] || status}</span>;
}
