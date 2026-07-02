import { Course } from '@/types/course'

type CourseFAQProps = {
  course: Course
}

export default function CourseFAQ({ course }: CourseFAQProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-gray-900">
        Perguntas frequentes
      </h2>

      <div className="mt-6 space-y-4">
        <div>
          <h3 className="font-semibold text-gray-900">
            O curso oferece certificado?
          </h3>
          <p className="mt-1 text-gray-600">
            {course.certificate
              ? 'Sim. Este curso oferece certificado de participação pela EduData IA.'
              : 'No momento, este curso não possui certificado disponível.'}
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900">
            Qual é a modalidade?
          </h3>
          <p className="mt-1 text-gray-600">
            {course.mode || 'Online'}
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900">
            Qual é o nível do curso?
          </h3>
          <p className="mt-1 text-gray-600">
            {course.level || 'Básico'}
          </p>
        </div>
      </div>
    </section>
  )
}