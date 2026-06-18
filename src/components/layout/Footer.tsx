export default function Footer() {
  return (
    <footer id="participar" className="bg-[#081C2E] text-white">
      <div className="mx-auto max-w-7xl px-6 py-20">

        <div className="grid gap-12 md:grid-cols-2 md:items-center">

          <div>
            <img
              src="/logo-edudata-ia-dark.png"
              alt="EduData IA"
              className="h-24 w-auto"
            />

            <p className="mt-8 max-w-xl text-lg leading-8 text-slate-300">
              Tecnologia, Dados e Inteligência para Transformar a Educação.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">

            <div>
              <h3 className="mb-4 text-lg font-semibold">
                Ecossistema EDI
              </h3>

              <ul className="space-y-3 text-slate-300">
                <li>Framework EDI</li>
                <li>Professor Digital</li>
                <li>Agenda Inteligente EDI</li>
                <li>EduData Analytics</li>
                <li>SGPA</li>
                <li>EduData Academy</li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-lg font-semibold">
                Contato
              </h3>

              <ul className="space-y-3 text-slate-300">
                <li>LinkedIn</li>
                <li>Contato Comercial</li>
                <li>Solicitar Demonstração</li>
              </ul>
            </div>

          </div>

        </div>

        <div className="mt-16 border-t border-white/10 pt-8 text-center text-sm text-slate-400">
          © 2026 EduData IA · Evidências · Inclusão · Inteligência
        </div>

      </div>
    </footer>
  )
}