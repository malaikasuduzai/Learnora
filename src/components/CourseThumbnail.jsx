
const COURSE_IMAGES = [
  { keys: ["python", "programming", "data science", "machine learning"], url: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1000&q=80" },
  { keys: ["ui", "ux", "design", "figma"], url: "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1000&q=80" },
  { keys: ["web", "react", "javascript", "html", "css", "full stack"], url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1000&q=80" },
  { keys: ["database", "sql", "mysql", "mongodb"], url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80" },
  { keys: ["mobile", "android", "ios", "flutter", "app"], url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=80" },
];

function realCourseImage(course) {
  const text = `${course?.title ?? ""} ${course?.category?.name ?? ""}`.toLowerCase();
  return COURSE_IMAGES.find((item) => item.keys.some((key) => text.includes(key)))?.url ?? COURSE_IMAGES[2].url;
}

// Every course card gets a real topic-related learning photo. An uploaded
// thumbnail still takes priority; otherwise the fallback is selected from
// the course title/category so the image matches the subject.
export default function CourseThumbnail({ course, className = "h-32 w-full" }) {
  if (course?.thumbnail) {
    return (
      <div className={`${className} overflow-hidden bg-ink-100`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={course.thumbnail} alt="" className="h-full w-full object-cover" />
      </div>
    );
  }

  const image = realCourseImage(course);
  return (
    <div className={`${className} relative overflow-hidden bg-ink-100`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt={`${course?.title ?? "Course"} course`} className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950/35 via-transparent to-transparent" />
    </div>
  );
}
