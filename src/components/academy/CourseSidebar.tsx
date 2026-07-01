export default function CourseSidebar() {
  return (
    <aside className="rounded-3xl bg-[#081C2E] p-8 text-white shadow-xl">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-300">
        Informações do Curso
      </p>

      <div className="mt-8 space-y-5">
        <div>
          <p className="text-sm text-slate-400">Carga Horária</p>
          <p className="text-xl font-bold">20 horas</p>
        </div>

        <div>
          <p className="text-sm text-slate-400">Modalidade</p>
          <p className="text-xl font-bold">Online</p>
        </div>

        <div>
          <p className="text-sm text-slate-400">Nível</p>
          <p className="text-xl font-bold">Básico</p>
        </div>

        <div>
          <p className="text-sm text-slate-400">Certificado</p>
          <p className="text-xl font-bold">Incluso</p>
        </div>

        <div>
          <p className="text-sm text-slate-400">Vagas</p>
          <p className="text-xl font-bold">50</p>
        </div>
      </div>

      <a
        href="#inscricao"
        className="mt-10 inline-flex w-full justify-center rounded-full bg-white px-6 py-4 font-semibold text-[#081C2E] transition hover:opacity-90"
      >
        Fazer inscrição
      </a>
    </aside>
  )
}