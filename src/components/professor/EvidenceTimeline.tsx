 export default function EvidenceTimeline() {
  const timeline = [
    {
      date: '02/07/2026',
      title: 'Plano de aula registrado',
    },
    {
      date: '30/06/2026',
      title: 'Evidência validada',
    },
    {
      date: '28/06/2026',
      title: 'Formação concluída',
    },
  ]

  return (
    <div className="rounded-3xl bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-bold text-[#081C2E]">
        Linha do Tempo de Evidências
      </h2>

      <div className="mt-8 space-y-6">
        {timeline.map((item) => (
          <div
            key={`${item.date}-${item.title}`}
            className="border-l-4 border-cyan-600 pl-6"
          >
            <h3 className="font-semibold">
              {item.title}
            </h3>

            <p className="text-slate-500">
              {item.date}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}