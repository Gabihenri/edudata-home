export function FrameworkEDI() {
  const pilares = [
    {
      titulo: 'Evidências',
      cor: '#0A3A5E',
      descricao: 'Dados e pesquisas que fundamentam cada decisão pedagógica.',
      forma: 'clip-polygon-triangle'
    },
    {
      titulo: 'Inclusão',
      cor: '#1B6B3A',
      descricao: 'Design universal e acessibilidade como base estrutural.',
      forma: 'clip-polygon-diamond'
    },
    {
      titulo: 'Inteligência',
      cor: '#5C1A8C',
      descricao: 'Análise de dados e IA para potencializar o ensino.',
      forma: 'clip-polygon-hexagon'
    }
  ]

  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-bold text-center mb-4">
          Framework <span className="text-[#0A3A5E]">EDI</span>
        </h2>
        <p className="text-center text-gray-600 max-w-2xl mx-auto mb-16">
          Três pilares que transformam a prática docente em ciência aplicada.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {pilares.map((pilar) => (
            <div key={pilar.titulo} className="text-center p-8 rounded-2xl hover:shadow-xl transition">
              <div 
                className={`w-20 h-20 mx-auto mb-6 ${pilar.forma} opacity-80`} 
                style={{ background: pilar.cor }} 
              />
              <h3 className="text-2xl font-bold mb-3" style={{ color: pilar.cor }}>
                {pilar.titulo}
              </h3>
              <p className="text-gray-600">{pilar.descricao}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}