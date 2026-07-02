import { Course } from '@/types/course'

type CourseHeroProps = {
  course: Course
}

export default function CourseHero({ course }: CourseHeroProps) {
  return (
    <section className="w-full py-16">
      <div className="container mx-auto px-4">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-600">
          {course.category}
        </p>

        <h1 className="text-4xl font-bold text-gray-900">
          {course.title}
        </h1>

        {course.subtitle && (
          <p className="mt-4 text-xl text-gray-700">
            {course.subtitle}
          </p>
        )}

        {course.description && (
          <p className="mt-6 max-w-3xl text-lg text-gray-600">
            {course.description}
          </p>
        )}
      </div>
    </section>
  )
}