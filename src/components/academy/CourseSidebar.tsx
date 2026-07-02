import { Course } from '@/types/course'

type CourseSidebarProps = {
  course: Course
}

export default function CourseSidebar({ course }: CourseSidebarProps) {
  return (
    <aside className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-900">
        Informações do curso
      </h2>

      <div className="mt-6 space-y-4 text-sm text-gray-700">
        <div>
          <span className="font-semibold text-gray-900">Carga horária: </span>
          {course.workload}h
        </div>

        <div>
          <span className="font-semibold text-gray-900">Nível: </span>
          {course.level}
        </div>

        <div>
          <span className="font-semibold text-gray-900">Modalidade: </span>
          {course.mode}
        </div>

        <div>
          <span className="font-semibold text-gray-900">Vagas: </span>
          {course.vacancies}
        </div>

        <div>
          <span className="font-semibold text-gray-900">Investimento: </span>
          {course.price}
        </div>

        <div>
          <span className="font-semibold text-gray-900">Status: </span>
          {course.status}
        </div>
      </div>

      <a
        href="#inscricao"
        className="mt-6 block rounded-xl bg-blue-700 px-5 py-3 text-center font-semibold text-white transition hover:bg-blue-800"
      >
        Quero me inscrever
      </a>
    </aside>
  )
}