import Link from 'next/link'
import { Course } from '@/types/course'

interface CourseCardProps {
  course: Course
}

export default function CourseCard({ course }: CourseCardProps) {
  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl">

      <div className="relative">

        <img
          src={course.image}
          alt={course.title}
          className="h-56 w-full object-cover"
        />

        <div className="absolute left-5 top-5 rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-[#0A3A5E] shadow">
          {course.category}
        </div>

        <div className="absolute right-5 top-5 rounded-full bg-[#0A3A5E] px-4 py-2 text-xs font-bold text-white shadow">
          {course.status}
        </div>

      </div>

      <div className="p-7">

        <h3 className="text-2xl font-bold text-[#0A3A5E]">
          {course.title}
        </h3>

        <p className="mt-2 text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">
          {course.subtitle}
        </p>

        <p className="mt-5 leading-7 text-slate-600">
          {course.description}
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4 text-sm">

          <div>
            <span className="font-semibold text-slate-500">
              Carga Horária
            </span>

            <p className="mt-1 font-bold text-slate-900">
              {course.workload}h
            </p>
          </div>

          <div>
            <span className="font-semibold text-slate-500">
              Modalidade
            </span>

            <p className="mt-1 font-bold text-slate-900">
              {course.mode}
            </p>
          </div>

          <div>
            <span className="font-semibold text-slate-500">
              Nível
            </span>

            <p className="mt-1 font-bold text-slate-900">
              {course.level}
            </p>
          </div>

          <div>
            <span className="font-semibold text-slate-500">
              Certificado
            </span>

            <p className="mt-1 font-bold text-slate-900">
              {course.certificate ? 'Sim' : 'Não'}
            </p>
          </div>

          <div>
            <span className="font-semibold text-slate-500">
              Valor
            </span>

            <p className="mt-1 font-bold text-[#1B6B3A]">
              {course.price}
            </p>
          </div>

          <div>
            <span className="font-semibold text-slate-500">
              Vagas
            </span>

            <p className="mt-1 font-bold text-slate-900">
              {course.vacancies}
            </p>
          </div>

        </div>

        <div className="mt-8 border-t border-slate-200 pt-6">

          <p className="text-sm text-slate-500">
            Professor responsável
          </p>

          <p className="mt-1 font-semibold text-slate-900">
            {course.instructor}
          </p>

        </div>

        <Link
          href={`/academy/${course.slug}`}
          className="mt-8 flex justify-center rounded-full bg-[#0A3A5E] px-6 py-4 text-center font-semibold text-white transition hover:opacity-90"
        >
          Inscrever-se
        </Link>

      </div>

    </article>
  )
}