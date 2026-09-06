import Link from "next/link";
import { CheckCircleIcon } from "@/components/icons";
import CourseThumbnail from "@/components/CourseThumbnail";
import { levelLabel } from "@/lib/courseDisplay";

export default function StudentCourseCard({ course }) {
  return (
    <Link
      href={`/student/courses/${course.id}`}
      className="card block overflow-hidden transition hover:-translate-y-0.5 hover:border-brass-200 hover:shadow-gold"
    >
      <CourseThumbnail course={course} className="h-32 w-full" />
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="badge bg-ink-100 text-ink-600">{levelLabel(course.level)}</span>
          {course.progress === 100 && (
            <span className="badge bg-emerald-50 text-emerald-700">
              <CheckCircleIcon className="h-3 w-3" />
              Completed
            </span>
          )}
        </div>
        <h3 className="mt-2.5 font-display text-base font-semibold text-ink-900">{course.title}</h3>
        <p className="mt-0.5 text-xs text-ink-400">
          {course.teacher ? `Teacher: ${course.teacher.name}` : "No teacher assigned"}
          {course.duration ? ` \u00b7 ${course.duration}` : ""}
        </p>

        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-ink-500">
            <span>Progress</span>
            <span className="font-semibold text-ink-700">{course.progress}%</span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-ink-100">
            <div className="h-full rounded-full bg-brass-500" style={{ width: `${course.progress}%` }} />
          </div>
        </div>

        <div className="mt-3 text-xs text-ink-500">
          {course.completedLectures}/{course.totalLectures} lecture
          {course.totalLectures === 1 ? "" : "s"} watched
        </div>
      </div>
    </Link>
  );
}
