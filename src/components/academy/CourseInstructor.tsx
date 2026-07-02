import { Course } from '@/types/course'

type CourseInstructorProps = {
  course: Course
}

export default function CourseInstructor({ course }: CourseInstructorProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-gray-900">
        Instrutor
      </h2>

      <p className="mt-4 text-gray-700">
        {course.instructor || 'Equipe EduData IA'}
      </p>

      <p className="mt-2 text-gray-600">
        Formação conduzida pela EduData IA, com foco em aplicação prática,
        desenvolvimento profissional docente e Framework EDI.
      </p>
    </section>
  )
}