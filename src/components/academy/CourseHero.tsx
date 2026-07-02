import { Course } from '@/types/course'

interface CourseHeroProps {
  course: Course
}

export default function CourseHero({ course }: CourseHeroProps) {
  return (
    <section className="rounded-[2rem] bg-gradient-to-r from-[#081C2E] via-[#0A3A5E] to-[#114E7A] p-10 text-white shadow-xl md:p-16">
      <div className="max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-300">
          EduData Academy
        </p>

        <h1 className="mt-5 text-4xl font-bold leading-tight md:text-6xl">
          {course.title}
        </h1>

        <p className="mt-5 text-2xl font-medium text-slate-200">
          {course.subtitle}
        </p>

        <p className="mt-8 max-w-3xl text-lg leading-8 text-slate-300">
          {course.description}
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <span className="rounded-full bg-white/15 px-5 py-2 text-sm font-semibold">
            {course.category}
          </span>

          <span className="rounded-full bg-white/15 px-5 py-2 text-sm font-semibold">
            {course.workload} horas
          </span>

          <span className="rounded-full bg-white/15 px-5 py-2 text-sm font-semibold">
            {course.level}
          </span>

          <span className="rounded-full bg-white/15 px-5 py-2 text-sm font-semibold">
            {course.mode}
          </span>

          <span className="rounded-full bg-[#1B6B3A] px-5 py-2 text-sm font-semibold">
            {course.status}
          </span>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          {course.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/20 px-4 py-2 text-sm text-slate-200"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}