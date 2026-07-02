import { Course } from '@/types/course'

type CourseModulesProps = {
  course: Course
}

export default function CourseModules({ course }: CourseModulesProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-gray-900">
        Módulos do curso
      </h2>

      <div className="mt-6 space-y-3">
        <div className="rounded-xl bg-gray-50 p-4">
          <p className="font-semibold text-gray-900">
            Módulo 1 — Introdução
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Fundamentos e objetivos do curso {course.title}.
          </p>
        </div>

        <div className="rounded-xl bg-gray-50 p-4">
          <p className="font-semibold text-gray-900">
            Módulo 2 — Aplicações práticas
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Estratégias, ferramentas e exemplos aplicados à educação.
          </p>
        </div>

        <div className="rounded-xl bg-gray-50 p-4">
          <p className="font-semibold text-gray-900">
            Módulo 3 — Projeto final
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Produção de uma atividade ou solução aplicada à prática docente.
          </p>
        </div>
      </div>
    </section>
  )
}