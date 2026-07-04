export default function DevelopmentPlan() {
  const actions = [
    'Concluir a trilha de Inteligência Artificial aplicada à Educação.',
    'Registrar evidências das próximas aulas na Agenda Inteligente EDI.',
    'Atualizar o Plano de Desenvolvimento Profissional.',
    'Participar das formações recomendadas pelo EIOS.',
  ]

  return (
    <div className="rounded-3xl bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-bold text-[#081C2E]">
        Plano de Desenvolvimento
      </h2>

      <div className="mt-8 space-y-4">
        {actions.map((action) => (
          <div
            key={action}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
          >
            {action}
          </div>
        ))}
      </div>
    </div>
  )
}