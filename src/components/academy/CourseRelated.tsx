import { Course } from '@/types/course'

type CourseRelatedProps = {
  course: Course
}

export default function CourseRelated({ course }: CourseRelatedProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-gray-900">
        Cursos relacionados
      </h2>

      <p className="mt-4 text-gray-600">
        Em breve, a EduData Academy recomendará cursos relacionados à trilha de{' '}
        <strong>{course.category}</strong>.
      </p>
    </section>
  )
}