import Link from "next/link";
import { prisma } from "@/lib/prisma";
import LandingNavbar from "@/components/LandingNavbar";
import FeaturedCourses from "@/components/FeaturedCourses";
import ContactForm from "@/components/ContactForm";
import {
  BarChartIcon,
  BellIcon,
  BookOpenIcon,
  CalendarCheckIcon,
  CheckCircleIcon,
  ClipboardListIcon,
  GraduationCapIcon,
  MailIcon,
  MapPinIcon,
  MessageIcon,
  PhoneIcon,
  PlayCircleIcon,
  QuoteIcon,
  StarIcon,
} from "@/components/icons";

const NAV_LINKS = [
  { label: "Home", href: "#top" },
  { label: "Courses", href: "#courses" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

const STATIC_STATS = [
  { key: "courses", label: "Courses" },
  { key: "students", label: "Students" },
  { key: "teachers", label: "Teachers" },
  { key: "published", label: "Published courses" },
];

const WHY_CARDS = [
  {
    icon: PlayCircleIcon,
    title: "Interactive Learning",
    body: "Watch lectures and access learning resources whenever you need them.",
  },
  {
    icon: GraduationCapIcon,
    title: "Expert Teachers",
    body: "Learn from instructors assigned specifically to your enrolled courses.",
  },
  {
    icon: BarChartIcon,
    title: "Track Progress",
    body: "Monitor course completion, lecture progress and attendance in real time.",
  },
  {
    icon: ClipboardListIcon,
    title: "Complete Assignments",
    body: "Submit tasks on time and receive marks and feedback from your teacher.",
  },
  {
    icon: MessageIcon,
    title: "Direct Messaging",
    body: "Reach your teacher or students directly, right inside the platform — no separate app needed.",
  },
  {
    icon: CalendarCheckIcon,
    title: "Flexible Scheduling",
    body: "Learn at your own pace with attendance, deadlines and reminders that keep you on track.",
  },
];

// Course cards use real topic-related learning photos. The images are loaded
// from Unsplash, a source of freely available photography, and are paired
// with the course topic rather than using random stock imagery.
const FEATURED_COURSES = [
  {
    name: "Full Stack Web Development",
    level: "Beginner",
    duration: "12 Weeks",
    variant: "web",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
    gradient: "from-brand-500 to-brand-700",
    description:
      "Build complete web applications from the ground up — front-end interfaces, back-end APIs and everything that connects them.",
    topics: [
      "HTML, CSS and modern JavaScript fundamentals",
      "Building interfaces with React",
      "REST APIs and server-side logic with Node.js",
      "Deploying a full project end to end",
    ],
  },
  {
    name: "Python Programming",
    level: "Beginner",
    duration: "8 Weeks",
    variant: "python",
    image: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80",
    gradient: "from-emerald-500 to-emerald-700",
    description:
      "Learn programming fundamentals with Python — one of the most versatile languages for automation, data and backend development.",
    topics: [
      "Core syntax, data types and control flow",
      "Functions, modules and error handling",
      "Working with files and real-world data",
      "Intro to libraries used in data and automation",
    ],
  },
  {
    name: "UI/UX Design",
    level: "Intermediate",
    duration: "6 Weeks",
    variant: "uiux",
    image: "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1200&q=80",
    gradient: "from-rose-400 to-rose-600",
    description:
      "Design digital products people enjoy using — from wireframes and user research to polished, accessible interfaces.",
    topics: [
      "User research and information architecture",
      "Wireframing and rapid prototyping",
      "Visual design systems and accessibility",
      "Usability testing and iteration",
    ],
  },
  {
    name: "Database Systems",
    level: "Intermediate",
    duration: "10 Weeks",
    variant: "database",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    gradient: "from-brass-400 to-brass-600",
    description:
      "Understand how applications store and query data reliably, from relational schema design to real-world performance tuning.",
    topics: [
      "Relational modeling and normalization",
      "Writing efficient SQL queries",
      "Indexing, transactions and performance",
      "Working with a database from application code",
    ],
  },
  {
    name: "Data Structures & Algorithms",
    level: "Advanced",
    duration: "10 Weeks",
    variant: "dsa",
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
    gradient: "from-violet-500 to-violet-700",
    description:
      "Sharpen your problem-solving toolkit with the data structures and algorithms behind efficient, interview-ready code.",
    topics: [
      "Arrays, linked lists, stacks and queues",
      "Trees, graphs and hash-based structures",
      "Sorting, searching and recursion",
      "Analyzing time and space complexity",
    ],
  },
  {
    name: "Mobile App Development",
    level: "Intermediate",
    duration: "12 Weeks",
    variant: "mobile",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    gradient: "from-sky-400 to-sky-600",
    description:
      "Design and build mobile apps for iOS and Android from a single codebase, from first screen to app-store release.",
    topics: [
      "Cross-platform UI building blocks",
      "Navigation, state and device APIs",
      "Connecting to backend services",
      "Testing and preparing a release build",
    ],
  },
];

const HOW_STEPS = [
  {
    step: "01",
    icon: GraduationCapIcon,
    title: "Create Your Account",
    body: "Sign up as a student or teacher in under a minute — no paperwork, no waiting on approval.",
  },
  {
    step: "02",
    icon: BookOpenIcon,
    title: "Enroll in a Course",
    body: "Browse what's published, check the syllabus and objectives, then enroll with a single click.",
  },
  {
    step: "03",
    icon: PlayCircleIcon,
    title: "Learn & Complete Tasks",
    body: "Watch lectures at your own pace, mark attendance, and submit assignments before they're due.",
  },
  {
    step: "04",
    icon: BarChartIcon,
    title: "Track Your Progress",
    body: "Watch completion, attendance and grades update in real time as you move through the course.",
  },
];

const PLATFORM_FEATURES = [
  {
    icon: GraduationCapIcon,
    label: "Course Learning",
    body: "Structured modules that build on each other, course by course.",
  },
  {
    icon: PlayCircleIcon,
    label: "Video Lectures",
    body: "Stream every lecture on your own schedule, from any device.",
  },
  {
    icon: ClipboardListIcon,
    label: "Assignments",
    body: "Submit tasks and get graded feedback straight from your teacher.",
  },
  {
    icon: CalendarCheckIcon,
    label: "Attendance Tracking",
    body: "Present, late or absent — logged automatically, every session.",
  },
  {
    icon: BarChartIcon,
    label: "Progress Tracking",
    body: "See lecture completion and grades update in real time.",
  },
  {
    icon: MessageIcon,
    label: "Teacher Communication",
    body: "Message your teacher directly, no separate app required.",
  },
  {
    icon: BellIcon,
    label: "Notifications",
    body: "Announcements and deadlines delivered the moment they're posted.",
  },
  {
    icon: BookOpenIcon,
    label: "Learning Resources",
    body: "Slides, files and links attached right where you need them.",
  },
];

// Each testimonial gets a lettered, gradient-ring avatar instead of a stock
// headshot — consistent with the icon-tile approach used for courses above,
// and just as "real" a picture without depending on an external image host.
const TESTIMONIALS = [
  {
    name: "Ayesha Raza",
    role: "Full Stack Web Development · Cohort 4",
    quote:
      "Attendance, tasks and grades all live in one dashboard now — I stopped losing track of deadlines across five different group chats.",
    initials: "AR",
    ring: "from-brand-400 to-brand-600",
  },
  {
    name: "Hamza Tariq",
    role: "UI/UX Design · Cohort 3",
    quote:
      "My teacher leaves feedback directly on each submission, so I know exactly what to fix before the next lecture instead of guessing.",
    initials: "HT",
    ring: "from-brass-400 to-brass-600",
  },
  {
    name: "Sana Khalid",
    role: "Data Structures & Algorithms · Cohort 5",
    quote:
      "The progress tracker made revising for finals painless — I could see exactly which modules I was behind on at a glance.",
    initials: "SK",
    ring: "from-emerald-400 to-emerald-600",
  },
];

const CONTACT_DETAILS = [
  {
    icon: MailIcon,
    label: "Email",
    value: "contact@learnora.com",
    href: "mailto:contact@learnora.com",
  },
  {
    icon: PhoneIcon,
    label: "Phone",
    value: "+92 300 000 0000",
    href: "tel:+923000000000",
  },
  {
    icon: MapPinIcon,
    label: "Office",
    value: "Blue Area, Islamabad, Pakistan",
    href: "https://maps.google.com/?q=Blue+Area+Islamabad+Pakistan",
  },
];

const FOOTER_COLUMNS = [
  {
    title: "Learning",
    links: [
      { label: "Courses", href: "#courses" },
      { label: "How it works", href: "#top" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#about" },
      { label: "Contact", href: "#contact" },
    ],
  },
  {
    title: "Get started",
    links: [
      { label: "Create an account", href: "/register" },
      { label: "Log in", href: "/login" },
    ],
  },
];

export default async function HomePage() {
  const [courses, publishedCourses, students, teachers] = await Promise.all([
    prisma.course.count(),
    prisma.course.count({ where: { status: "PUBLISHED" } }),
    prisma.user.count({ where: { role: "STUDENT", isActive: true } }),
    prisma.user.count({ where: { role: "TEACHER", isActive: true } }),
  ]);
  const homeStats = { courses, published: publishedCourses, students, teachers };

  return (
    <div id="top" className="bg-paper">
      {/* Navbar */}
      <LandingNavbar navLinks={NAV_LINKS} />

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 py-16 sm:py-20 lg:grid-cols-2">
        <div>
          <p className="eyebrow">Online Learning, Reimagined</p>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.1] text-ink-900 sm:text-5xl">
            Learn. Grow. Achieve.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-ink-500">
            A complete online learning platform where students can learn from expert
            teachers, track their progress, complete assignments, and build their skills.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#courses"
              className="btn-secondary transition duration-200 hover:scale-[1.03]"
            >
              Explore Courses
            </a>
            <Link
              href="/register"
              className="btn-brass w-auto transition duration-200 hover:scale-[1.03]"
            >
              Get Started
            </Link>
          </div>

          {/* Social proof: avatar stack + rating, in place of a stock photo */}
          <div className="mt-9 flex items-center gap-4">
            <div className="flex -space-x-2.5">
              {["from-brand-400 to-brand-600", "from-brass-400 to-brass-600", "from-emerald-400 to-emerald-600", "from-rose-400 to-rose-600"].map(
                (ring, i) => (
                  <span
                    key={ring}
                    className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${ring} font-display text-xs font-semibold text-white ring-2 ring-paper`}
                  >
                    {["AR", "HT", "SK", "+"][i]}
                  </span>
                )
              )}
            </div>
            <div>
              <div className="flex items-center gap-0.5 text-brass-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon key={i} className="h-3.5 w-3.5 fill-current" />
                ))}
              </div>
              <p className="mt-0.5 whitespace-nowrap text-xs text-ink-400">
                Students and teachers learning with Learnora
              </p>
            </div>
          </div>
        </div>

        {/* Professional learning image instead of made-up progress data */}
        <div className="relative">
          <div className="pointer-events-none absolute -right-6 -top-6 h-40 w-40 rounded-full bg-brass-200/50 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-brand-200/40 blur-3xl" aria-hidden="true" />
          <div className="card relative mx-auto max-w-lg overflow-hidden p-2">
            <div className="relative overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=85"
                alt="MacBook showing lines of code on a desk"
                className="h-[360px] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-ink-950/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brass-200">Learnora Learning Hub</p>
                <h2 className="mt-2 font-display text-2xl font-semibold">Learn skills. Practice. Grow.</h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-white/80">Courses, tasks, attendance, progress and teacher communication in one focused learning space.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium backdrop-blur">Courses</span>
                  <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium backdrop-blur">Assignments</span>
                  <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium backdrop-blur">Progress</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-ink-100 bg-ink-950">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.14em] text-brass-400">
            Growing every day
          </p>
          <p className="mx-auto mt-2 max-w-md text-center text-sm text-ink-300">
            Students and teachers learning with Learnora — updated live as the platform grows.
          </p>
          <div className="mt-9 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {STATIC_STATS.map((stat) => (
              <div
                key={stat.label}
                className="group rounded-2xl border border-white/10 bg-white/5 p-5 text-center backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:border-brass-400/60 hover:bg-white/10"
              >
                <p className="font-display text-3xl font-semibold text-white transition duration-300 group-hover:text-brass-400 sm:text-4xl">
                  {homeStats[stat.key]}
                  {homeStats[stat.key] > 0 && <span className="text-brass-400">+</span>}
                </p>
                <p className="mt-1 text-sm text-ink-300">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why choose us / About */}
      <section id="about" className="mx-auto max-w-6xl px-6 py-16">
        <p className="eyebrow">Why choose Learnora</p>
        <h2 className="mt-3 max-w-lg font-display text-2xl font-semibold text-ink-900 sm:text-3xl">
          Everything a real classroom needs, built into the platform.
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {WHY_CARDS.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="card group p-5 transition duration-300 ease-out hover:-translate-y-1 hover:border-brass-200 hover:shadow-gold"
            >
              <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brass-50 text-brass-600 transition duration-300 group-hover:bg-brass-500 group-hover:text-white">
                <Icon className="h-5 w-5" />
              </span>
              <p className="font-display text-base font-semibold text-ink-900">{title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured courses */}
      <section id="courses" className="border-y border-ink-100 bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Featured Courses</p>
              <h2 className="mt-3 font-display text-2xl font-semibold text-ink-900 sm:text-3xl">
                A sample of what students are learning
              </h2>
            </div>
            <a
              href="#courses"
              className="btn-primary w-auto px-5 py-2.5"
            >
              View Courses
            </a>
          </div>

          <FeaturedCourses courses={FEATURED_COURSES} />
        </div>
      </section>

      {/* How learning works */}
      <section className="border-y border-ink-100 bg-paper py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow">How learning works</p>
              <h2 className="mt-3 max-w-lg font-display text-2xl font-semibold text-ink-900 sm:text-3xl">
                From sign-up to finished course, in four steps.
              </h2>
            </div>
            <Link
              href="/register"
              className="hidden shrink-0 items-center text-sm font-semibold text-brass-600 transition hover:text-brass-700 sm:inline-flex"
            >
              Get started
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_STEPS.map(({ step, icon: Icon, title, body }, index) => (
              <div
                key={step}
                className="group card relative p-5 transition duration-300 hover:-translate-y-1 hover:border-brass-300 hover:shadow-gold"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-950 text-brass-400 transition duration-300 group-hover:bg-brass-500">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-display text-2xl font-semibold text-ink-100">{step}</span>
                </div>
                <p className="mt-4 font-display text-base font-semibold text-ink-900">{title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{body}</p>
                <span className="mt-4 inline-flex items-center text-[11px] font-semibold uppercase tracking-wide text-brass-600">
                  Step {String(index + 1).padStart(2, "0")}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-7 flex justify-center sm:hidden">
            <Link href="/register" className="btn-primary w-auto px-5">
              Get started
            </Link>
          </div>
        </div>
      </section>

      {/* Platform features grid */}
      <section className="border-y border-ink-100 bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <p className="eyebrow">Platform features</p>
          <h2 className="mt-3 max-w-lg font-display text-2xl font-semibold text-ink-900 sm:text-3xl">
            Everything a course needs to run itself.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-500">
            One connected system for lectures, assignments, attendance and communication —
            so nothing falls through the cracks between a teacher and a student.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PLATFORM_FEATURES.map(({ icon: Icon, label, body }) => (
              <div
                key={label}
                className="group flex flex-col gap-3 rounded-2xl border border-ink-100 bg-white p-5 shadow-card transition duration-300 ease-out hover:-translate-y-1 hover:border-brass-200 hover:bg-brass-50/60 hover:shadow-gold"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink-950 text-brass-400 transition duration-300 group-hover:bg-brass-500 group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-display text-sm font-semibold text-ink-900">{label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-500">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-ink-950">
        <div className="mx-auto max-w-6xl px-6 py-16 text-center">
          <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
            Start Your Learning Journey Today
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-ink-300">
            Join our learning platform and access courses, lectures, assignments and
            progress tracking from one place.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="btn-brass w-auto transition duration-200 hover:scale-[1.03]"
            >
              Create Account
            </Link>
            <a
              href="#courses"
              className="btn-secondary w-auto bg-transparent text-white transition duration-200 hover:scale-[1.03]"
            >
              Explore Courses
            </a>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="mx-auto max-w-6xl px-6 py-16">
        <p className="eyebrow">Get in touch</p>
        <h2 className="mt-3 max-w-lg font-display text-2xl font-semibold text-ink-900 sm:text-3xl">
          Questions about Learnora? We&apos;d love to hear from you.
        </h2>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-5">
          {/* Info panel */}
          <div className="card relative overflow-hidden p-7 lg:col-span-2">
            <div
              className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brass-100/70 blur-2xl"
              aria-hidden="true"
            />
            <p className="font-display text-lg font-semibold text-ink-900">
              Talk to our team
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">
              Whether you&apos;re a student, a teacher or an institution evaluating
              Learnora, we typically reply within one business day.
            </p>
            <ul className="mt-7 space-y-4">
              {CONTACT_DETAILS.map(({ icon: Icon, label, value, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    className="flex items-start gap-3 rounded-lg -mx-2 px-2 py-1.5 transition hover:bg-ink-50"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brass-50 text-brass-600">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-xs font-medium uppercase tracking-wide text-ink-400">
                        {label}
                      </span>
                      <span className="block text-sm font-medium text-ink-800">{value}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <ContactForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-ink-950 px-6 py-16 text-ink-300">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brass-500 font-display text-base font-semibold text-white">
                  L
                </div>
                <p className="font-display text-base font-semibold text-white">Learnora</p>
              </div>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-400">
                A complete online learning platform for courses, lectures, assignments and
                progress tracking — built for learners, teachers and institutions everywhere.
              </p>
              <ul className="mt-5 space-y-2.5 text-sm">
                <li>
                  <a
                    href="mailto:contact@learnora.com"
                    className="flex items-center gap-2 text-ink-400 transition hover:text-white"
                  >
                    <MailIcon className="h-4 w-4 text-brass-400" />
                    contact@learnora.com
                  </a>
                </li>
                <li>
                  <a
                    href="tel:+923000000000"
                    className="flex items-center gap-2 text-ink-400 transition hover:text-white"
                  >
                    <PhoneIcon className="h-4 w-4 text-brass-400" />
                    +92 300 0000000
                  </a>
                </li>
              </ul>
            </div>

            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                  {col.title}
                </p>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-ink-400 transition hover:text-white"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-ink-500 sm:flex-row">
            <p>© 2026 Learnora. All rights reserved.</p>
            <p>Built for learners, teachers and institutions everywhere.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
