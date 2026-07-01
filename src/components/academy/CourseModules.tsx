export default function CourseModules() {
  const modules = [
    'Fundamentos do curso',
    'Aplicações práticas na educação',
    'Metodologia EDI',
    'Ferramentas e recursos digitais',
    'Projeto final orientado',
    'Certificação',
  ]

  return (
    <section className="rounded-3xl bg-white p-10 shadow-sm">
      <h2 className="text-3xl font-bold text-[#0A3A5E]">
        Conteúdo programático
      </h2>

      <div className="mt-8 space-y-4">
        {modules.map((module, index) => (
          <div
            key={module}
            className="rounded-2xl border border-slate-200 bg-[#F5F6F8] p-5"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Módulo {String(index + 1).padStart(2, '0')}
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