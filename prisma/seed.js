// Creates a starter Super Admin and Admin account (neither role is reachable
// through the public /register form, by design — see the permission matrix
// in the PRD), plus a sample Teacher, Students, a course category, a
// published course with the teacher assigned and students enrolled, sample
// tasks/submissions/evaluations, an attendance window with history, and a
// sample announcement/message/notification set — so every day's flow
// (Days 3–8) can be explored immediately after seeding.
//
// Run with: npm run prisma:seed
// (or directly: node prisma/seed.js)

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

function slugify(text) {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function upsertUser({ name, email, password, role }) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { name, email, password: hashedPassword, role },
  });
  console.log(`${role} ready -> email: ${user.email} / password: ${password}`);
  return user;
}

async function upsertCategory(name, description) {
  const slug = slugify(name);
  return prisma.courseCategory.upsert({
    where: { name },
    update: {},
    create: { name, slug, description },
  });
}

async function main() {
  await upsertUser({
    name: "Super Admin",
    email: "superadmin@lms.test",
    password: "SuperAdmin123",
    role: "SUPER_ADMIN",
  });

  await upsertUser({
    name: "Platform Admin",
    email: "admin@lms.test",
    password: "AdminPass123",
    role: "ADMIN",
  });

  const teacher = await upsertUser({
    name: "Muhammad Ali",
    email: "teacher@lms.test",
    password: "TeacherPass123",
    role: "TEACHER",
  });

  const students = await Promise.all([
    upsertUser({ name: "Ayesha Khan", email: "student1@lms.test", password: "StudentPass123", role: "STUDENT" }),
    upsertUser({ name: "Bilal Ahmed", email: "student2@lms.test", password: "StudentPass123", role: "STUDENT" }),
    upsertUser({ name: "Sara Malik", email: "student3@lms.test", password: "StudentPass123", role: "STUDENT" }),
  ]);

  const category = await upsertCategory(
    "Web Development",
    "Front-end, back-end and full-stack web development courses."
  );

  const course = await prisma.course.upsert({
    where: { id: "seed-course-fullstack" },
    update: {},
    create: {
      id: "seed-course-fullstack",
      title: "Full Stack Web Development",
      description:
        "Learn to build complete web applications from the ground up — HTML, CSS, JavaScript, a backend framework and a database, tied together into real, deployable projects.",
      categoryId: category.id,
      duration: "10 Weeks",
      level: "INTERMEDIATE",
      objectives: "Build responsive web apps\nWork with REST APIs\nDeploy a full-stack project",
      requirements: "Basic HTML & CSS\nA laptop with 8GB+ RAM",
      status: "PUBLISHED",
      teacherId: teacher.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 70 * 24 * 60 * 60 * 1000),
    },
  });
  console.log(`Course ready -> ${course.title} (teacher: ${teacher.name})`);

  for (const student of students) {
    await prisma.enrollment.upsert({
      where: { studentId_courseId: { studentId: student.id, courseId: course.id } },
      update: {},
      create: { studentId: student.id, courseId: course.id },
    });
  }
  console.log(`Enrolled ${students.length} students into "${course.title}"`);

  // ---- Day 4: modules, lectures & resources for the seeded course --------
  const moduleOne = await prisma.module.upsert({
    where: { id: "seed-module-1" },
    update: {},
    create: {
      id: "seed-module-1",
      courseId: course.id,
      title: "Module 01 — Foundations",
      description: "The basics every full-stack developer needs before touching a framework.",
      order: 0,
    },
  });

  const moduleTwo = await prisma.module.upsert({
    where: { id: "seed-module-2" },
    update: {},
    create: {
      id: "seed-module-2",
      courseId: course.id,
      title: "Module 02 — Building with React",
      description: "Component-based UIs, state and working with a real backend.",
      order: 1,
    },
  });

  const lectureData = [
    {
      id: "seed-lecture-1",
      moduleId: moduleOne.id,
      title: "Introduction to the course",
      description: "What we'll build over the next 10 weeks, and how to get the most out of it.",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      notes: "No prior setup needed for this lecture — just watch and take notes.",
      duration: "8 min",
      order: 0,
    },
    {
      id: "seed-lecture-2",
      moduleId: moduleOne.id,
      title: "HTML & CSS refresher",
      description: "A fast-paced refresher on semantic HTML and modern CSS layout.",
      videoUrl: "https://www.youtube.com/watch?v=UB1O30fR-EE",
      notes: "Follow along in your own editor — build the sample page as we go.",
      duration: "22 min",
      order: 1,
    },
    {
      id: "seed-lecture-3",
      moduleId: moduleTwo.id,
      title: "React components & props",
      description: "How components compose, and how data flows down through props.",
      videoUrl: "https://www.youtube.com/watch?v=Tn6-PIqc4UM",
      notes: null,
      duration: "18 min",
      order: 0,
    },
    {
      id: "seed-lecture-4",
      moduleId: moduleTwo.id,
      title: "Connecting to a REST API",
      description: "Fetching and displaying real data from a backend endpoint.",
      videoUrl: null,
      notes: "Video coming soon — read through the linked article in the meantime.",
      duration: "15 min",
      order: 1,
    },
  ];

  for (const data of lectureData) {
    await prisma.lecture.upsert({ where: { id: data.id }, update: {}, create: data });
  }

  await prisma.lectureResource.upsert({
    where: { id: "seed-resource-1" },
    update: {},
    create: {
      id: "seed-resource-1",
      lectureId: "seed-lecture-2",
      title: "CSS Flexbox cheat sheet",
      url: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_flexible_box_layout/Basic_concepts_of_flexbox",
      type: "LINK",
    },
  });
  await prisma.lectureResource.upsert({
    where: { id: "seed-resource-2" },
    update: {},
    create: {
      id: "seed-resource-2",
      lectureId: "seed-lecture-4",
      title: "REST API design basics (article)",
      url: "https://restfulapi.net/",
      type: "LINK",
    },
  });

  // Give the first seeded student a bit of progress so the Day 4 flow has
  // something to look at immediately after seeding.
  await prisma.lectureProgress.upsert({
    where: { studentId_lectureId: { studentId: students[0].id, lectureId: "seed-lecture-1" } },
    update: {},
    create: { studentId: students[0].id, lectureId: "seed-lecture-1" },
  });
  console.log(`Added 2 modules, 4 lectures and sample progress to "${course.title}"`);

  // ---- Day 5/6: tasks, assignments, submissions & evaluation ---------------
  // Two tasks assigned to all three seeded students, with a mix of
  // submission and evaluation states so every column of the Student Task
  // Dashboard (PRD section 15), the teacher's Tasks & submissions screen,
  // and the Day 6 evaluation flow (PRD section 17) has something to show
  // right after seeding: an upcoming task with one submission already
  // rejected (with feedback) and two untouched, and a past-deadline task
  // with one student submitted-and-graded (Completed, with marks and
  // feedback), one under review, and one who never submitted (Overdue).
  const taskUpcoming = await prisma.task.upsert({
    where: { id: "seed-task-portfolio" },
    update: {},
    create: {
      id: "seed-task-portfolio",
      courseId: course.id,
      title: "Portfolio Assignment",
      description: "Build a small personal portfolio page using the HTML & CSS you learned in Module 01.",
      instructions:
        "Include at least: a hero section, an about section, and a projects section. Keep it to a single page.",
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      maxMarks: 100,
      status: "PUBLISHED",
    },
  });

  const taskOverdue = await prisma.task.upsert({
    where: { id: "seed-task-api" },
    update: {},
    create: {
      id: "seed-task-api",
      courseId: course.id,
      title: "API Integration Task",
      description: "Connect the sample front end to a public REST API and render the results.",
      instructions: "Any public API is fine (weather, jokes, etc.) — just handle the loading and error states.",
      deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      maxMarks: 100,
      status: "PUBLISHED",
    },
  });

  for (const task of [taskUpcoming, taskOverdue]) {
    for (const student of students) {
      await prisma.taskAssignment.upsert({
        where: { taskId_studentId: { taskId: task.id, studentId: student.id } },
        update: {},
        create: { taskId: task.id, studentId: student.id },
      });
    }
  }

  await prisma.taskSubmission.upsert({
    where: { taskId_studentId: { taskId: taskOverdue.id, studentId: students[0].id } },
    update: {},
    create: {
      taskId: taskOverdue.id,
      studentId: students[0].id,
      link: "https://github.com/ayesha-khan/api-integration-task",
      notes: "Used the Star Wars API for this one.",
      status: "COMPLETED",
      marks: 85,
      feedback: "Good implementation. Improve the UI responsiveness and error handling.",
    },
  });

  await prisma.taskSubmission.upsert({
    where: { taskId_studentId: { taskId: taskOverdue.id, studentId: students[1].id } },
    update: {},
    create: {
      taskId: taskOverdue.id,
      studentId: students[1].id,
      textAnswer: "Submitted a bit late, but the weather API integration is fully working.",
      status: "UNDER_REVIEW",
    },
  });
  // students[2] is intentionally left without a submission for taskOverdue,
  // so their status computes to "Overdue" on both dashboards.

  await prisma.taskSubmission.upsert({
    where: { taskId_studentId: { taskId: taskUpcoming.id, studentId: students[2].id } },
    update: {},
    create: {
      taskId: taskUpcoming.id,
      studentId: students[2].id,
      link: "https://github.com/sara-malik/portfolio-page",
      status: "REJECTED",
      feedback: "This links to an empty repository — please push your code and resubmit if you can.",
    },
  });

  console.log(`Created 2 tasks on "${course.title}" with sample assignments, submissions and evaluations`);

  // ---- Day 7: attendance window + sample history --------------------------
  // A wide, always-open window (00:00–23:59) so "mark attendance" is
  // demonstrable at any time of day right after seeding, with Late enabled
  // so the teacher roster's Late column and the summary's Late count both
  // have something to show. A second, unconfigured course is seeded below
  // so the admin/student "not configured yet" state is also reproducible
  // side-by-side with the configured one, instead of only ever seeing one
  // of the two states.
  const courseWithAttendance = await prisma.course.update({
    where: { id: course.id },
    data: { attendanceWindowStart: "00:00", attendanceWindowEnd: "23:59", lateAllowed: true },
  });
  console.log(
    `Attendance window configured on "${courseWithAttendance.title}" -> 00:00\u201323:59, Late allowed`
  );

  const unconfiguredCourse = await prisma.course.upsert({
    where: { id: "seed-course-nodejs" },
    update: {},
    create: {
      id: "seed-course-nodejs",
      title: "Node.js for Backend Developers",
      description: "Server-side JavaScript with Node.js, Express and REST API design.",
      categoryId: category.id,
      duration: "6 Weeks",
      level: "BEGINNER",
      objectives: "Build REST APIs\nWork with middleware\nHandle authentication",
      requirements: "Basic JavaScript",
      status: "PUBLISHED",
      teacherId: teacher.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000),
    },
  });
  await prisma.enrollment.upsert({
    where: { studentId_courseId: { studentId: students[0].id, courseId: unconfiguredCourse.id } },
    update: {},
    create: { studentId: students[0].id, courseId: unconfiguredCourse.id },
  });
  console.log(
    `Course ready -> ${unconfiguredCourse.title} (attendance window left unconfigured on purpose)`
  );

  // Three days of history on the configured course: a mix of Present, Late
  // and Absent across students so the teacher's Present/Late/Absent/%
  // summary and each student's history + running percentage aren't empty
  // the first time either screen is opened.
  const dayMs = 24 * 60 * 60 * 1000;
  const attendanceHistory = [
    { daysAgo: 2, statuses: ["PRESENT", "PRESENT", "ABSENT"] },
    { daysAgo: 1, statuses: ["PRESENT", "LATE", "PRESENT"] },
  ];
  for (const { daysAgo, statuses } of attendanceHistory) {
    const date = new Date(Date.now() - daysAgo * dayMs);
    date.setHours(0, 0, 0, 0);
    for (let i = 0; i < students.length; i += 1) {
      await prisma.attendance.upsert({
        where: {
          courseId_studentId_date: { courseId: course.id, studentId: students[i].id, date },
        },
        update: {},
        create: {
          courseId: course.id,
          studentId: students[i].id,
          date,
          status: statuses[i],
          markedBy: "TEACHER",
        },
      });
    }
  }
  console.log(`Seeded 2 days of attendance history on "${course.title}"`);

  // ---- Day 8: announcement, message thread & notifications ----------------
  const announcement = await prisma.announcement.upsert({
    where: { id: "seed-announcement-1" },
    update: {},
    create: {
      id: "seed-announcement-1",
      courseId: course.id,
      teacherId: teacher.id,
      title: "Live lecture moved to 7:00 PM tomorrow",
      body: "Tomorrow's live lecture will start at 7:00 PM instead of the usual time — same link, see you there!",
    },
  });
  console.log(`Announcement seeded on "${course.title}"`);

  const messageSeeds = [
    { id: "seed-message-1", senderId: students[0].id, receiverId: teacher.id, body: "Hi! Quick question about the deadline for the portfolio task — is it still this Friday?" },
    { id: "seed-message-2", senderId: teacher.id, receiverId: students[0].id, body: "Yes, still due Friday at 11:59 PM. Let me know if you get stuck on anything." },
  ];
  for (const m of messageSeeds) {
    await prisma.message.upsert({ where: { id: m.id }, update: {}, create: { ...m, courseId: course.id } });
  }
  console.log(`Seeded a sample message thread on "${course.title}"`);

  const notificationSeeds = [
    {
      id: "seed-notification-1",
      userId: students[0].id,
      type: "ANNOUNCEMENT",
      title: `New announcement in ${course.title}`,
      body: announcement.title,
      link: "/student/announcements",
    },
    {
      id: "seed-notification-2",
      userId: students[0].id,
      type: "MESSAGE",
      title: `New message from ${teacher.name}`,
      body: messageSeeds[1].body,
      link: "/student/messages",
    },
    {
      id: "seed-notification-3",
      userId: teacher.id,
      type: "MESSAGE",
      title: `New message from ${students[0].name}`,
      body: messageSeeds[0].body,
      link: "/teacher/messages",
    },
  ];
  for (const n of notificationSeeds) {
    await prisma.notification.upsert({ where: { id: n.id }, update: {}, create: n });
  }
  console.log("Seeded sample notifications for the Teacher and first Student");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
