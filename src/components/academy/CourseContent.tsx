import { Course } from '@/types/course'

interface CourseContentProps {
  course: Course
}

export default function CourseContent({
  course,
}: CourseContentProps) {
  return (
    <section className="rounded-3xl bg-white p-10 shadow-sm">
      <h2 className="text-3xl font-bold text-[#0A3A5E]">
        Sobre o curso
      </h2>

      <p className="mt-6 text-lg leading-8 text-slate-600">
        {course.description}
      </p>

      <div className="mt-10 grid gap-8 md:grid-cols-2">

        <div className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-6">
          <h3 className="text-xl font-bold text-slate-900">
            Informações Gerais
          </h3>

          <div className="mt-5 space-y-3">

            <div className="flex justify-between">
              <span className="font-medium text-slate-500">
                Categoria
              </span>

              <span className="font-semibold">
                {course.category}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium text-slate-500">
                Modalidade
              </span>

              <span className="font-semibold">
                {course.mode}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium text-slate-500">
                Nível
              </span>

              <span className="font-semibold">
                {course.level}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium text-slate-500">
                Carga Horária
              </span>

              <span className="font-semibold">
                {course.workload} horas
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium text-slate-500">
                Certificado
              </span>

              <span className="font-semibold">
                {course.certificate ? 'Sim' : 'Não'}
              </span>
            </div>

          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-6">
          <h3 className="text-xl font-bold text-slate-900">
            Instrutor
          </h3>

          <p className="mt-5 text-lg font-semibold">
            {course.instructor}
          </p>

          <p className="mt-4 leading-7 text-slate-600">
            Formação desenvolvida pela equipe da EduData IA com base
            no Framework EDI e nas melhores práticas em Inteligência
            Educacional.
          </p>
        </div>

      </div>
    </section>
  )
}