type StatisticsProps = {
  eiosData?: any
}

export default function Statistics({ eiosData }: StatisticsProps) {
  const profile =
    eiosData?.data?.profile?.teacher_profile ||
    eiosData?.profile?.teacher_profile

  const analytics =
    eiosData?.data?.analytics?.summary ||
    eiosData?.analytics?.summary

  const cards = [
    {
      title: 'Agenda',
      value: `${profile?.agenda_score ?? 0}%`,
    },
    {
      title: 'Evidências',
      value: `${profile?.evidence_score ?? 0}%`,
    },
    {
      title: 'Formações',
      value: `${profile?.training_score ?? 0}%`,
    },
    {
      title: 'Eventos',
      value: analytics?.total_agenda_events ?? 0,
    },
  ]

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {cards.map((card) => (
        <div
          key={card.title}
          className="rounded-3xl bg-white p-8 shadow-sm"
        >
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
            {card.title}
          </p>

          <h3 className="mt-4 text-5xl font-bold text-cyan-700">
            {card.value}
          </h3>
        </div>
      ))}
    </div>
  )
}