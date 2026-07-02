import { Course } from '@/types/course'

interface CourseSidebarProps {
  course: Course
}

export default function CourseSidebar({
  course,
}: CourseSidebarProps) {
  return (
    <aside className="rounded-3xl bg-[#081C2E] p-8 text-white shadow-xl">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-300">
        Resumo do Curso
      </p>

      <div className="mt-8 space-y-5">

        <div className="flex justify-between">
          <span className="text-slate-300">Categoria</span>
          <strong>{course.category}</strong>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-300">Carga Horária</span>
          <strong>{course.workload}h</strong>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-300">Modalidade</span>
          <strong>{course.mode}</strong>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-300">Nível</span>
          <strong>{course.level}</strong>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-300">Instrutor</span>
          <strong>{course.instructor}</strong>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-300">Certificado</span>
          <strong>
            {course.certificate ? 'Sim' : 'Não'}
          </strong>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-300">Vagas</span>
          <strong>{course.vacancies}</strong>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-300">Status</span>
          <strong>{course.status}</strong>
        </div>

      </div>

      <a
        href="#inscricao"
        className="mt-10 inline-flex w-full justify-center rounded-full bg-white px-6 py-4 font-semibold text-[#081C2E] transition hover:opacity-90"
      >
        Inscrever-se
      </a>
    </aside>
  )
}