export default function EvidenceTimeline() {
  return (
    <div className="rounded-3xl bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-bold text-[#081C2E]">
        Linha do Tempo de Evidências
      </h2>

      <div className="mt-8 space-y-6">

        <div className="border-l-4 border-cyan-600 pl-6">
          <h3 className="font-semibold">
            Plano de Aula publicado
          </h3>

          <p className="text-slate-500">
            02/07/2026
          </p>
        </div>

        <div className="border-l-4 border-cyan-600 pl-6">
          <h3 className="font-semibold">
            Formação concluída
          </h3>

          <p className="text-slate-500">
            28/06/2026
          </p>
        </div>

      </div>
    </div>
  )
}