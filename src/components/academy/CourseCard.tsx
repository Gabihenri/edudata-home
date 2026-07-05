import Link from 'next/link'
import { Course } from '@/types/course'

interface CourseCardProps {
  course: Course
}

function getCourseVisual(course: Course) {
  const title = course.title.toLowerCase()

  if (title.includes('ia')) {
    return {
      initials: 'IA',
      gradient: 'from-cyan-500 via-blue-600 to-[#081C2E]',
    }
  }

  if (title.includes('google')) {
    return {
      initials: 'GW',
      gradient: 'from-emerald-500 via-cyan-600 to-[#081C2E]',
    }
  }

  if (title.includes('canva')) {
    return {
      initials: 'CV',
      gradient: 'from-purple-500 via-fuchsia-600 to-[#081C2E]',
    }
  }

  if (title.includes('dashboard')) {
    return {
      initials: 'BI',
      gradient: 'from-amber-500 via-orange-600 to-[#081C2E]',
    }
  }

  if (title.includes('framework')) {
    return {
      initials: 'EDI',
      gradient: 'from-[#1B6B3A] via-cyan-700 to-[#081C2E]',
    }
  }

  return {
    initials: 'ED',
    gradient: 'from-cyan-600 via-blue-700 to-[#081C2E]',
  }
}

export default function CourseCard({ course }: CourseCardProps) {
  const visual = getCourseVisual(course)

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl">
      <div
        className={`relative flex h-56 items-center justify-center bg-gradient-to-br ${visual.gradient}`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.25),transparent_35%)]" />

        <div className="relative flex h-28 w-28 items-center justify-center rounded-3xl border border-white/20 bg-white/10 text-4xl font-black tracking-tight text-white shadow-2xl backdrop-blur">
          {visual.initials}
        </div>

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

        <div className="mt-8 grid gap-3">
          <Link
            href={`/academy/${course.slug}`}
            className="flex justify-center rounded-full border border-[#0A3A5E] px-6 py-4 text-center font-semibold text-[#0A3A5E] transition hover:bg-[#0A3A5E] hover:text-white"
          >
            Ver detalhes
          </Link>

          <button className="rounded-full bg-[#1B6B3A] px-6 py-4 font-semibold text-white transition hover:opacity-90">
            Quero me inscrever
          </button>
        </div>
      </div>
    </article>
  )
}