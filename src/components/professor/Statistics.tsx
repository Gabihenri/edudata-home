export default function Statistics() {
  const cards = [
    { title: 'Evidências', value: '148' },
    { title: 'Ações', value: '32' },
    { title: 'Cursos', value: '12' },
    { title: 'Recomendações', value: '18' },
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