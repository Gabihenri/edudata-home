export function AgendaInteligente() {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-4">
          Agenda <span className="text-[#5C1A8C]">Inteligente</span> EDI
        </h2>
        
        <p className="text-2xl md:text-3xl font-semibold text-[#0A3A5E] my-6">
          Planeje. Registre. Evidencie. Analise.
        </p>
        
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          A Agenda gera dados para indicadores, Analytics e futura integração com SGPA.
        </p>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
          <div className="p-4 bg-[#F5F6F8] rounded-lg">📅 Planeje</div>
          <div className="p-4 bg-[#F5F6F8] rounded-lg">✍️ Registre</div>
          <div className="p-4 bg-[#F5F6F8] rounded-lg">📊 Evidencie</div>
          <div className="p-4 bg-[#F5F6F8] rounded-lg">🔍 Analise</div>
        </div>
      </div>
    </section>
  )
}