import { Course } from '@/types/course'

type CourseContentProps = {
  course: Course
}

export default function CourseContent({ course }: CourseContentProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-gray-900">
        Sobre o curso
      </h2>

      <p className="mt-4 text-gray-600">
        {course.description}
      </p>

      {course.tags && course.tags.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {course.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </section>
  )
}