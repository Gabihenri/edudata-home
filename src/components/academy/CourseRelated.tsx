export default function CourseRelated() {
  const courses = [
    'Google Workspace para Educação',
    'Framework EDI',
    'Power BI para Escolas',
  ]

  return (
    <section className="rounded-3xl bg-white p-10 shadow-sm">
      <h2 className="text-3xl font-bold text-[#0A3A5E]">
        Cursos relacionados
      </h2>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {courses.map((course) => (
          <div
            key={course}
            className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-6 transition hover:-translate-y-1 hover:shadow-lg"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0A3A5E]">
              EduData Academy
            </p>

            <h3 className="mt-3 text-xl font-bold text-slate-900">
              {course}
            </h3>

            <a
              href="/academy"
              className="mt-6 inline-block font-semibold text-[#0A3A5E]"
            >
              Ver curso →
            </a>
          </div>
        ))}
      </div>
    </section>
  )
}