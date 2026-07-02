import Link from 'next/link'

import { Course } from '@/types/course'
import { getRelatedAcademyCourses } from '@/lib/data/academyCourses'

interface CourseRelatedProps {
  course: Course
}

export default function CourseRelated({
  course,
}: CourseRelatedProps) {
  const relatedCourses = getRelatedAcademyCourses(course.slug)

  return (
    <section className="rounded-3xl bg-white p-10 shadow-sm">
      <h2 className="text-3xl font-bold text-[#0A3A5E]">
        Cursos relacionados
      </h2>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {relatedCourses.map((related) => (
          <Link
            key={related.id}
            href={`/academy/${related.slug}`}
            className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-6 transition hover:-translate-y-1 hover:shadow-lg"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0A3A5E]">
              {related.category}
            </p>

            <h3 className="mt-3 text-xl font-bold text-slate-900">
              {related.title}
            </h3>

            <p className="mt-3 text-slate-600">
              {related.workload} horas
            </p>

            <span className="mt-6 inline-block font-semibold text-[#0A3A5E]">
              Ver curso →
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}