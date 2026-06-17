export function ProfessorDigital() {
  return (
    <section className="py-20 px-6 bg-[#F5F6F8]">
      <div className="max-w-4xl mx-auto text-center">
        <div className="w-16 h-16 bg-[#1B6B3A] clip-polygon-diamond mx-auto mb-6 opacity-30" />
        
        <h2 className="text-3xl md:text-5xl font-bold mb-4">
          Professor <span className="text-[#0A3A5E]">Digital</span>
        </h2>
        
        <p className="text-xl text-gray-700 max-w-3xl mx-auto">
          Porta de entrada da EduData IA. Uma jornada de desenvolvimento profissional docente baseada em evidências.
        </p>

        <div className="mt-8 flex flex-wrap gap-3 justify-center text-sm text-gray-600">
          <span className="px-4 py-2 bg-white rounded-full">📊 Diagnóstico</span>
          <span className="px-4 py-2 bg-white rounded-full">🎯 Trilhas personalizadas</span>
          <span className="px-4 py-2 bg-white rounded-full">📈 Acompanhamento</span>
          <span className="px-4 py-2 bg-white rounded-full">🏅 Certificação</span>
        </div>
      </div>
    </section>
  )
}