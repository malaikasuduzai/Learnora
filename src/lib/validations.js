import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[0-9]/, "Password must include a number");

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name is too long"),
    email: z.string().trim().toLowerCase().email("Enter a valid email address"),
    password: passwordSchema,
    confirmPassword: z.string(),
    // Per the PRD permission matrix, Admin accounts are created only by a
    // Super Admin and Teacher/Student accounts only by Super Admin/Admin
    // *within* the dashboard — but this module still needs a public,
    // self-service signup to be usable stand-alone, so it's limited to the
    // two roles that make sense as self-signup in an ed-tech product.
    role: z.enum(["TEACHER", "STUDENT"], {
      errorMap: () => ({ message: "Select a valid role" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

// ---- Forgot password / reset password ------------------------------------

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
});

export const resendCodeSchema = forgotPasswordSchema;

export const verifyCodeSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export const resetPasswordSchema = z
  .object({
    resetToken: z.string().min(1, "Reset session expired. Please start again."),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ---- Account settings -----------------------------------------------------

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  phone: z
    .string()
    .trim()
    .max(20, "Phone number is too long")
    .optional()
    .or(z.literal("")),
  bio: z
    .string()
    .trim()
    .max(300, "Keep the bio under 300 characters")
    .optional()
    .or(z.literal("")),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

// ---- Course management (categories, course creation) ----------------------

export const courseCategorySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80, "Name is too long"),
  description: z
    .string()
    .trim()
    .max(300, "Keep the description under 300 characters")
    .optional()
    .or(z.literal("")),
});

const optionalUrl = z
  .string()
  .trim()
  .max(500, "URL is too long")
  .optional()
  .or(z.literal(""));

const optionalDateString = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine((val) => !val || !Number.isNaN(Date.parse(val)), "Enter a valid date");

export const courseSchema = z
  .object({
    title: z.string().trim().min(3, "Course name must be at least 3 characters").max(150, "Course name is too long"),
    description: z.string().trim().min(10, "Add a short description (at least 10 characters)").max(4000, "Description is too long"),
    thumbnail: optionalUrl,
    categoryId: z.string().trim().min(1, "Choose a course category"),
    duration: z.string().trim().min(1, "Duration is required").max(50, "Duration is too long"),
    level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"], {
      errorMap: () => ({ message: "Select a valid level" }),
    }),
    objectives: z.string().trim().max(2000, "Keep objectives under 2000 characters").optional().or(z.literal("")),
    requirements: z.string().trim().max(2000, "Keep requirements under 2000 characters").optional().or(z.literal("")),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"], {
      errorMap: () => ({ message: "Select a valid status" }),
    }),
    teacherId: z.string().trim().optional().or(z.literal("")),
    startDate: optionalDateString,
    endDate: optionalDateString,
  })
  .refine(
    (data) => !data.startDate || !data.endDate || Date.parse(data.startDate) <= Date.parse(data.endDate),
    { message: "End date must be after the start date", path: ["endDate"] }
  );

// ---- Teacher management (Add / Edit / Activate-Deactivate Teacher) --------

export const createTeacherSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: passwordSchema,
  phone: z
    .string()
    .trim()
    .max(20, "Phone number is too long")
    .optional()
    .or(z.literal("")),
});

export const updateTeacherSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name is too long").optional(),
  phone: z.string().trim().max(20, "Phone number is too long").optional().or(z.literal("")),
  bio: z.string().trim().max(300, "Keep the bio under 300 characters").optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

// ---- Student enrollment ----------------------------------------------------

export const enrollStudentSchema = z.object({
  studentId: z.string().trim().min(1, "Choose a student"),
});

// ---- Student management (Add / Edit / Activate-Deactivate / Delete Student)

export const createStudentSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: passwordSchema,
  phone: z
    .string()
    .trim()
    .max(20, "Phone number is too long")
    .optional()
    .or(z.literal("")),
});

export const updateStudentSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name is too long").optional(),
  phone: z.string().trim().max(20, "Phone number is too long").optional().or(z.literal("")),
  bio: z.string().trim().max(300, "Keep the bio under 300 characters").optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

// ---- Admin management (Super Admin: Create / Edit / Activate-Deactivate Admin)

export const createAdminSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: passwordSchema,
  phone: z
    .string()
    .trim()
    .max(20, "Phone number is too long")
    .optional()
    .or(z.literal("")),
});

export const updateAdminSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name is too long").optional(),
  phone: z.string().trim().max(20, "Phone number is too long").optional().or(z.literal("")),
  bio: z.string().trim().max(300, "Keep the bio under 300 characters").optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

// ---- Course content: modules, lectures, resources (Day 4) -----------------

export const moduleSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(150, "Title is too long"),
  description: z
    .string()
    .trim()
    .max(1000, "Keep the description under 1000 characters")
    .optional()
    .or(z.literal("")),
});

const optionalUrlRequired = (message) => z.string().trim().min(1, message).max(500, "URL is too long");

export const lectureSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(150, "Title is too long"),
  description: z
    .string()
    .trim()
    .max(2000, "Keep the description under 2000 characters")
    .optional()
    .or(z.literal("")),
  videoUrl: z
    .string()
    .trim()
    .max(500, "URL is too long")
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .trim()
    .max(5000, "Keep lecture notes under 5000 characters")
    .optional()
    .or(z.literal("")),
  duration: z.string().trim().max(30, "Keep this short, e.g. \"12 min\"").optional().or(z.literal("")),
});

export const resourceSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(150, "Title is too long"),
  url: optionalUrlRequired("A resource needs a link"),
  type: z.enum(["PDF", "LINK", "FILE"], {
    errorMap: () => ({ message: "Select a valid resource type" }),
  }),
});

export const moveSchema = z.object({
  direction: z.enum(["up", "down"], { errorMap: () => ({ message: "Invalid direction" }) }),
});

// ---- Tasks & submissions (Day 5) -------------------------------------------

const requiredDateTimeString = z
  .string()
  .trim()
  .min(1, "Deadline is required")
  .refine((val) => !Number.isNaN(Date.parse(val)), "Enter a valid date and time");

const optionalDateTimeString = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine((val) => !val || !Number.isNaN(Date.parse(val)), "Enter a valid date and time");

export const taskSchema = z
  .object({
    courseId: z.string().trim().min(1, "Choose a course"),
    title: z.string().trim().min(3, "Title must be at least 3 characters").max(150, "Title is too long"),
    description: z
      .string()
      .trim()
      .min(10, "Add a short description (at least 10 characters)")
      .max(4000, "Description is too long"),
    instructions: z
      .string()
      .trim()
      .max(4000, "Keep instructions under 4000 characters")
      .optional()
      .or(z.literal("")),
    startDate: optionalDateTimeString,
    deadline: requiredDateTimeString,
    maxMarks: z.coerce
      .number({ invalid_type_error: "Maximum marks must be a number" })
      .int("Maximum marks must be a whole number")
      .min(1, "Maximum marks must be at least 1")
      .max(1000, "Keep maximum marks under 1000"),
    attachmentUrl: optionalUrl,
    status: z.enum(["DRAFT", "PUBLISHED"], {
      errorMap: () => ({ message: "Select a valid status" }),
    }),
    assignedStudentIds: z
      .array(z.string().trim().min(1))
      .min(1, "Assign this task to at least one student"),
  })
  .refine(
    (data) => !data.startDate || Date.parse(data.startDate) <= Date.parse(data.deadline),
    { message: "Deadline must be after the start date", path: ["deadline"] }
  );

// A student must give at least one of file / text answer / link — comments
// alone aren't a submission (PRD section 16: "File Upload, Text Answer,
// Link, Comments/Notes").
export const taskSubmissionSchema = z
  .object({
    fileUrl: optionalUrl,
    textAnswer: z
      .string()
      .trim()
      .max(5000, "Keep your answer under 5000 characters")
      .optional()
      .or(z.literal("")),
    link: optionalUrl,
    notes: z.string().trim().max(1000, "Keep notes under 1000 characters").optional().or(z.literal("")),
  })
  .refine((data) => Boolean(data.fileUrl || data.textAnswer || data.link), {
    message: "Add a file link, a text answer, or a link before submitting",
    path: ["textAnswer"],
  });

// ---- Submission evaluation (Day 6) -----------------------------------------
// A teacher moving a submission through the review pipeline (PRD section 17:
// "Change Submission Status", "Add Feedback", "Assign Marks",
// "Approve/Reject Submission"). Marks are required to mark a submission
// Completed — an approval without a score doesn't mean anything — but stay
// optional for Under Review / Rejected, since a teacher may reject work
// before it's worth scoring at all.
export const evaluateSubmissionSchema = z
  .object({
    status: z.enum(["UNDER_REVIEW", "COMPLETED", "REJECTED"], {
      errorMap: () => ({ message: "Select a valid review outcome" }),
    }),
    marks: z.coerce
      .number({ invalid_type_error: "Marks must be a number" })
      .int("Marks must be a whole number")
      .min(0, "Marks can't be negative")
      .optional()
      .nullable(),
    feedback: z
      .string()
      .trim()
      .max(4000, "Keep feedback under 4000 characters")
      .optional()
      .or(z.literal("")),
  })
  .refine((data) => data.status !== "COMPLETED" || data.marks != null, {
    message: "Give marks before marking this submission complete",
    path: ["marks"],
  });

// ---- Attendance (Day 7) -----------------------------------------------
// "HH:mm" in 24-hour time, matching the <input type="time"> value format
// used by the settings/roster forms.
const timeOfDay = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour time, e.g. 09:00");

export const attendanceSettingsSchema = z
  .object({
    attendanceWindowStart: timeOfDay,
    attendanceWindowEnd: timeOfDay,
    lateAllowed: z.boolean().optional().default(true),
  })
  .refine((data) => data.attendanceWindowStart < data.attendanceWindowEnd, {
    message: "End time must be after the start time",
    path: ["attendanceWindowEnd"],
  });

const attendanceRecordSchema = z.object({
  studentId: z.string().trim().min(1, "Missing student"),
  status: z.enum(["PRESENT", "ABSENT", "LATE"], {
    errorMap: () => ({ message: "Select a valid attendance status" }),
  }),
});

export const markAttendanceSchema = z.object({
  date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date")
    .refine((val) => !Number.isNaN(Date.parse(val)), "Enter a valid date"),
  records: z.array(attendanceRecordSchema).min(1, "Mark at least one student"),
});

// ---- Announcements & messaging (Day 8) -------------------------------------

export const announcementSchema = z.object({
  courseId: z.string().trim().min(1, "Choose a course"),
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(150, "Title is too long"),
  body: z
    .string()
    .trim()
    .min(5, "Add a short message (at least 5 characters)")
    .max(4000, "Keep the announcement under 4000 characters"),
});

export const messageSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Write a message before sending")
    .max(2000, "Keep messages under 2000 characters"),
});

// Public landing-page contact form (PRD-adjacent: no account required to
// submit, so this stays separate from messageSchema above which is for
// authenticated in-course Teacher <-> Student messages).
export const contactMessageSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  subject: z.string().trim().min(3, "Subject must be at least 3 characters").max(150, "Subject is too long"),
  body: z
    .string()
    .trim()
    .min(5, "Add a short message (at least 5 characters)")
    .max(4000, "Keep the message under 4000 characters"),
});

// A student self-marking present must supply the teacher's live session
// code (see src/lib/attendanceCode.js). Loose length bounds since the
// exact format is an implementation detail the client shouldn't need to
// hardcode; the real check is the DB lookup in the route handler.
export const studentMarkAttendanceSchema = z.object({
  code: z
    .string()
    .trim()
    .min(4, "Enter the attendance code your teacher shared")
    .max(20, "Enter the attendance code your teacher shared"),
});

// Flattens a ZodError into { fieldName: "first message" } for form display.
export function flattenZodError(error) {
  const fieldErrors = error.flatten().fieldErrors;
  const result = {};
  for (const key of Object.keys(fieldErrors)) {
    if (fieldErrors[key]?.[0]) result[key] = fieldErrors[key][0];
  }
  return result;
}
