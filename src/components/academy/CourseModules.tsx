import { Course } from '@/types/course'

interface CourseModulesProps {
  course: Course
}

export default function CourseModules({
  course,
}: CourseModulesProps) {
  return (
    <section className="rounded-3xl bg-white p-10 shadow-sm">
      <h2 className="text-3xl font-bold text-[#0A3A5E]">
        Conteúdo Programático
      </h2>

      <p className="mt-4 text-slate-600">
        Estrutura prevista para o curso <strong>{course.title}</strong>.
      </p>

      <div className="mt-8 space-y-4">
        {[
          'Fundamentos',
          'Aplicações Práticas',
          'Estudos de Caso',
          'Ferramentas',
          'Projeto Final',
          'Avaliação e Certificação',
        ].map((module, index) => (
          <div
            key={module}
            className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-5"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0A3A5E]">
              Módulo {index + 1}
            </p>

            <h3 className="mt-2 text-xl font-bold text-slate-900">
              {module}
            </h3>
          </div>
        ))}
      </div>
    </section>
  )
}