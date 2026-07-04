type RecommendationsProps = {
  eiosData?: any
}

export default function Recommendations({ eiosData }: RecommendationsProps) {
  const recommendations =
    eiosData?.data?.recommendations?.recommendations ||
    eiosData?.recommendations?.recommendations ||
    []

  return (
    <div className="rounded-3xl bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-bold text-[#081C2E]">
        Recomendações do EIOS
      </h2>

      <div className="mt-6 space-y-4">
        {recommendations.length > 0 ? (
          recommendations.map((item: any, index: number) => (
            <div
              key={index}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
            >
              <p className="font-semibold text-[#081C2E]">
                {item.title}
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {item.message}
              </p>
            </div>
          ))
        ) : (
          <p className="leading-7 text-slate-600">
            Nenhuma recomendação disponível no momento.
          </p>
        )}
      </div>
    </div>
  )
}