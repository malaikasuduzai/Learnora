# 🎓 Learnora — Learning Management Platform

A modern, full-stack **Learning Management System (LMS)** designed to manage the complete learning experience in one platform.

**Learnora** provides role-based dashboards for **Super Admin, Admin, Teacher, and Student**. The platform supports course management, learning content, assignments, evaluations, attendance, notifications, announcements, messaging, progress tracking, and student self-enrollment.

## ✨ Features

### 🔐 Authentication & Security

* Student and Teacher registration
* Secure login and logout
* Role-based redirects after login
* Protected routes for all user roles
* JWT authentication using httpOnly cookies
* Password hashing with bcryptjs
* Forgot password functionality
* Email verification code for password reset
* Secure password reset
* Profile management
* Change password functionality
* Server-side role authorization
* API-level access protection
* Input validation using Zod

## 👥 User Roles

### 👑 Super Admin

* Platform overview
* Account-level administration
* Platform reports and statistics
* Account settings

### 🛠️ Admin

* Manage Teacher accounts
* Activate or deactivate Teachers
* Manage course categories
* Create, edit, and delete courses
* Assign Teachers to courses
* Manually enroll Students
* Remove Student enrollments
* Configure attendance settings
* View platform-wide tasks
* Manage account settings

### 👨‍🏫 Teacher

* View assigned courses
* Create and manage course modules
* Create and manage lectures
* Reorder modules and lectures
* Add video URLs, notes, duration, and resources
* Monitor Student progress
* Create and manage tasks
* Assign tasks to enrolled Students
* Review submissions
* Evaluate Student work
* Assign marks and feedback
* Manage attendance
* Publish announcements
* Communicate with Students
* View Students across assigned courses

### 👨‍🎓 Student

* Browse available courses
* View complete course details
* Enroll in published courses
* View enrolled courses
* Track course progress
* Watch lectures
* Access notes and learning resources
* Complete lectures sequentially
* Submit assignments and tasks
* View marks and Teacher feedback
* Mark attendance
* View attendance history
* View attendance percentage
* Read announcements
* Message course Teachers
* Receive notifications
* View upcoming activities
* Track overall academic progress

## 📚 Course Management

Admins can create and manage courses with:

* Course title and description
* Category
* Level
* Status
* Start and end dates
* Learning objectives
* Requirements
* Course thumbnail
* Assigned Teacher

Teachers automatically receive access to courses assigned to them.

Students can be enrolled through two methods:

1. Manual enrollment by an Admin
2. Self-enrollment by the Student

Both methods use the same enrollment system to prevent duplicate enrollments.

## 🎥 Course Content & Learning

Teachers can organize learning content into ordered:

* Modules
* Lectures
* Video content
* Lecture notes
* Learning resources

Supported learning resources include:

* PDF links
* File links
* External links

Students follow a sequential learning system where later lectures unlock after earlier lectures are completed.

Course progress is calculated automatically:

```text
Course Progress = Completed Lectures / Total Lectures × 100
```

## 📝 Task & Assignment System

Teachers can:

* Create tasks
* Edit tasks
* Delete tasks
* Set deadlines
* Set maximum marks
* Assign tasks to specific enrolled Students

Students can submit:

* Text answers
* File links
* External links
* Additional notes

Task statuses include:

* Pending
* Submitted
* Under Review
* Completed
* Rejected
* Overdue

## 📊 Evaluation System

Teachers can evaluate Student submissions directly from the task management system.

Teachers can:

* Move submissions to Under Review
* Mark submissions as Completed
* Reject submissions
* Assign marks
* Add feedback
* Update evaluations when required

Students can view:

* Submission status
* Marks
* Teacher feedback
* Average performance across graded tasks

## 📅 Attendance System

Admins can configure attendance settings for each course, including:

* Attendance start time
* Attendance end time
* Late attendance availability

Students can mark themselves **Present** within the configured attendance window.

Teachers can record:

* Present
* Absent
* Late

Students can view:

* Attendance history
* Course attendance percentage
* Course-specific attendance records

Teachers can access attendance summaries to monitor Student participation.

## 🔔 Notifications

Learnora includes a notification system across all dashboards.

Notifications are generated for important activities such as:

* Course enrollment
* New tasks
* Task submissions
* Submission evaluations
* New lectures
* Course announcements
* New messages

Users can:

* View notifications
* See unread notification counts
* Mark individual notifications as read
* Mark all notifications as read

## 📢 Announcements & Messaging

Teachers can publish announcements for their assigned courses.

Students can view announcements from courses in which they are enrolled.

The platform also supports course-based communication between Teachers and Students.

Messaging is restricted to:

* The Teacher assigned to a course
* Students enrolled in that course

## 📈 Student Progress Tracking

Students can track their learning progress through:

* Average course progress
* Completed lectures
* Completed tasks
* Task performance
* Attendance percentage
* Course-specific progress

All progress values are calculated from actual Student activity.

## 🔎 Student Self-Service Enrollment

Students can independently discover and enroll in published courses.

### Enrollment Flow

```text
Browse Courses
      ↓
View Course Details
      ↓
Enroll
      ↓
Enrollment Confirmation
      ↓
Course Appears in My Courses
```

Students can search available courses and view:

* Course description
* Category
* Assigned Teacher
* Learning objectives
* Requirements
* Course dates
* Lecture count

Only published courses are available for Student self-enrollment.

## 🛡️ Role-Based Access Control

Learnora uses multiple layers of access protection:

* Middleware-based route protection
* Role-based dashboard access
* Server-side authorization checks
* API role guards
* Course ownership verification
* Student enrollment verification
* Input validation

The platform ensures that users cannot access pages, courses, or API functionality belonging to another role.

## 🧰 Technology Stack

| Technology   | Purpose                          |
| ------------ | -------------------------------- |
| Next.js 14   | Full-stack application framework |
| JavaScript   | Application development          |
| Tailwind CSS | UI styling                       |
| MySQL        | Database                         |
| Prisma       | Database ORM                     |
| JWT          | Authentication                   |
| jose         | JWT handling                     |
| bcryptjs     | Password hashing                 |
| Zod          | Input validation                 |

## 📁 Project Structure

```text
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   ├── verify-code/
│   │   └── reset-password/
│   │
│   ├── super-admin/
│   │   ├── reports/
│   │   └── settings/
│   │
│   ├── admin/
│   │   ├── courses/
│   │   ├── teachers/
│   │   ├── attendance/
│   │   ├── tasks/
│   │   └── settings/
│   │
│   ├── teacher/
│   │   ├── courses/
│   │   ├── tasks/
│   │   ├── attendance/
│   │   ├── announcements/
│   │   ├── messages/
│   │   ├── students/
│   │   └── settings/
│   │
│   ├── student/
│   │   ├── courses/
│   │   ├── tasks/
│   │   ├── attendance/
│   │   ├── announcements/
│   │   ├── messages/
│   │   ├── progress/
│   │   └── settings/
│   │
│   └── api/
│       ├── auth/
│       ├── admin/
│       ├── teacher/
│       ├── student/
│       └── notifications/
│
├── components/
│   ├── admin/
│   ├── teacher/
│   ├── student/
│   └── dashboard/
│
├── lib/
│   ├── auth.js
│   ├── prisma.js
│   ├── validations.js
│   ├── courseContent.js
│   ├── taskDisplay.js
│   ├── attendanceDisplay.js
│   ├── notify.js
│   └── dashboardConfig.js
│
└── middleware.js

prisma/
├── schema.prisma
└── seed.js
```

## ⚙️ Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/malaikasuduzai/Learnora.git
```

### 2. Open the Project

```bash
cd Learnora
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Add your MySQL database connection and JWT secret.

```env
DATABASE_URL="your_mysql_database_connection_string"
JWT_SECRET="your_long_random_secret"
GMAIL_USER=""
GMAIL_APP_PASSWORD=""
```

### 5. Create Database Tables

```bash
npx prisma migrate dev
```

### 6. Seed the Database

```bash
npm run prisma:seed
```

### 7. Start the Development Server

```bash
npm run dev
```

Open the application in your browser:

```text
http://localhost:3000
```

## 🧪 Testing Workflows

### Admin Workflow

```text
Login
  ↓
Manage Teachers
  ↓
Create Categories
  ↓
Create Course
  ↓
Assign Teacher
  ↓
Enroll Students
```

### Teacher Workflow

```text
Login
  ↓
Open Assigned Course
  ↓
Create Modules
  ↓
Add Lectures
  ↓
Create Tasks
  ↓
Review Submissions
  ↓
Evaluate Students
  ↓
Manage Attendance
```

### Student Workflow

```text
Register / Login
      ↓
Browse Courses
      ↓
Enroll
      ↓
Access Course
      ↓
Complete Lectures
      ↓
Submit Tasks
      ↓
View Results
      ↓
Track Progress
```

## 🚀 Key Highlights

* Four role-based dashboards
* Secure JWT authentication
* Complete course management
* Teacher management
* Student enrollment management
* Sequential learning system
* Automatic course progress tracking
* Task and assignment management
* Submission evaluation and grading
* Attendance management
* Notifications
* Course announcements
* Teacher-Student messaging
* Student self-service enrollment
* Academic progress tracking
* Role-based API protection
* Responsive user interface

## 🔮 Future Improvements

Possible future improvements include:

* Online quizzes and examinations
* Digital certificates
* Video conferencing
* Cloud file uploads
* Plagiarism checking
* Advanced analytics
* Real-time messaging
* Calendar and class scheduling
* Multi-language support

## 👩‍💻 Developer

Developed by **Malaika Shabir** as a full-stack Learning Management Platform using modern web technologies.

**Project:** Learnora
**Type:** Full-Stack Learning Management System
**Framework:** Next.js
**Database:** MySQL + Prisma
#
