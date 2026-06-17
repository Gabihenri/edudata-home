export default function Home() {
  return (
    <main className="min-h-screen flex items-center px-6 md:px-20 bg-[#F5F6F8]">
      <div className="max-w-4xl mx-auto">
        {/* Elemento geométrico decorativo */}
        <div className="w-24 h-24 bg-[#0A3A5E] clip-polygon-triangle mb-8 opacity-20" />

        <h1 className="text-4xl md:text-7xl font-bold leading-tight">
          <span className="text-[#0A3A5E]">Evidências.</span>
          <br />
          <span className="text-[#1B6B3A]">Inclusão.</span>
          <br />
          <span className="text-[#5C1A8C]">Inteligência.</span>
        </h1>

        <p className="text-xl md:text-2xl mt-6 text-gray-700 max-w-2xl">
          Transformando dados educacionais em decisões inteligentes.
        </p>

        <p className="mt-4 text-lg text-gray-600 max-w-2xl">
          A EduData IA é um ecossistema de desenvolvimento profissional docente.
        </p>

        <div className="flex flex-wrap gap-4 mt-8">
          <button className="px-8 py-4 bg-[#0A3A5E] text-white rounded-lg font-semibold hover:opacity-90 transition">
            Conheça o Framework EDI
          </button>
          <button className="px-8 py-4 border-2 border-[#5C1A8C] text-[#5C1A8C] rounded-lg font-semibold hover:bg-[#5C1A8C] hover:text-white transition">
            Conheça a Agenda Inteligente EDI
          </button>
        </div>
      </div>
    </main>
  )
}
