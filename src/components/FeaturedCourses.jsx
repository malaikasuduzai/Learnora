"use client";

import { useState } from "react";
import Link from "next/link";
import Modal from "@/components/Modal";
import CourseCover from "@/components/CourseIllustrations";
import { CheckCircleIcon, ClockIcon } from "@/components/icons";

export default function FeaturedCourses({ courses }) {
  const [active, setActive] = useState(null);

  return (
    <>
      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <button
            type="button"
            key={course.name}
            onClick={() => setActive(course)}
            className="group card overflow-hidden text-left transition duration-300 ease-out hover:-translate-y-1.5 hover:border-brass-200 hover:shadow-gold focus-visible:-translate-y-1.5"
          >
            <div
              className={`relative flex h-36 w-full items-center justify-center overflow-hidden bg-gradient-to-br ${course.gradient}`}
            >
              {/* Subtle dot texture behind the illustration */}
              <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.12]" aria-hidden="true">
                <pattern
                  id={`grid-${course.name.replace(/\s+/g, "-")}`}
                  width="18"
                  height="18"
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx="2" cy="2" r="1.4" fill="white" />
                </pattern>
                <rect width="100%" height="100%" fill={`url(#grid-${course.name.replace(/\s+/g, "-")})`} />
              </svg>
              {course.image ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={course.image}
                    alt={`${course.name} course`}
                    className="relative h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.06]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950/35 via-transparent to-transparent" />
                </>
              ) : (
                <CourseCover
                  variant={course.variant}
                  className="relative h-full w-full transition duration-500 ease-out group-hover:scale-[1.06]"
                />
              )}
              <div className="absolute inset-0 bg-ink-950/0 transition duration-300 group-hover:bg-ink-950/10" />
            </div>
            <div className="p-5">
              <p className="font-display text-base font-semibold text-ink-900">{course.name}</p>
              <div className="mt-2 flex items-center gap-3 text-xs text-ink-400">
                <span className="badge bg-ink-50 text-ink-500">{course.level}</span>
                <span className="inline-flex items-center gap-1">
                  <ClockIcon className="h-3.5 w-3.5" />
                  {course.duration}
                </span>
              </div>
              <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink-500">
                {course.description}
              </p>
              <div className="mt-4 flex justify-center">
                <span className="inline-flex items-center rounded-lg border border-brass-200 bg-brass-50 px-3 py-2 text-sm font-semibold text-brass-700 transition group-hover:border-brass-300 group-hover:bg-brass-100">
                  View Course
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {active && (
        <Modal
          title={active.name}
          description={`${active.level} · ${active.duration}`}
          onClose={() => setActive(null)}
          wide
        >
          <div
            className={`h-40 w-full overflow-hidden rounded-xl bg-gradient-to-br ${active.gradient}`}
          >
            {active.image ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={active.image} alt={`${active.name} course`} className="h-full w-full object-cover" />
            ) : (
              <CourseCover variant={active.variant} className="h-full w-full" />
            )}
          </div>

          <p className="mt-5 text-sm leading-relaxed text-ink-600">{active.description}</p>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
              What you&apos;ll learn
            </p>
            <ul className="mt-3 space-y-2.5">
              {active.topics.map((topic) => (
                <li key={topic} className="flex items-start gap-2.5 text-sm text-ink-600">
                  <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  {topic}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 flex flex-col items-center gap-2.5 border-t border-ink-100 pt-5 sm:flex-row sm:justify-center">
            <Link href="/register" className="btn-brass w-full sm:w-auto">
              Enroll Now
            </Link>
            <button
              type="button"
              onClick={() => setActive(null)}
              className="btn-secondary w-full sm:w-auto"
            >
              Maybe Later
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
