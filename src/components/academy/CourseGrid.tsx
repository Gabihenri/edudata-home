import CourseCard from './CourseCard'
import { Course } from '@/types/course'

interface CourseGridProps {
  courses: Course[]
}

export default function CourseGrid({ courses }: CourseGridProps) {
  if (courses.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <h3 className="text-2xl font-bold text-[#0A3A5E]">
          Nenhum curso encontrado
        </h3>

        <p className="mt-4 text-lg text-slate-600">
          Tente selecionar outra categoria.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
        />
      ))}
    </div>
  )
}