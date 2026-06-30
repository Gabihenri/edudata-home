export default function Footer() {
  return (
    <footer className="bg-[#081C2E] text-white">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <img
              src="/logo-edudata-ia-dark.png"
              alt="EduData IA"
              className="h-40 w-auto"
            />

            <p className="mt-8 max-w-xl text-xl leading-8 text-slate-300">
              Ecossistema de Inteligência Educacional baseado em Evidências,
              Inclusão e Inteligência.
            </p>

            <div className="mt-8">
              <h3 className="text-lg font-semibold">
                Faça parte da Comunidade EduData IA
              </h3>

              <p className="mt-3 max-w-lg leading-7 text-slate-400">
                Acompanhe a evolução do Framework EDI, participe das formações
                e conheça os bastidores da construção do ecossistema EduData IA.
              </p>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <h3 className="mb-4 text-xl font-semibold">
                Ecossistema
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
              <h3 className="mb-4 text-xl font-semibold">
                Conecte-se
              </h3>

              <div className="space-y-4">
                <a
                  href="https://www.linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-slate-300 transition hover:text-white"
                >
                  LinkedIn
                </a>

                <a
                  href="mailto:sabinohc@gmail.com"
                  className="block text-slate-300 transition hover:text-white"
                >
                  Contato
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-white/10 pt-8 text-center">
          <p className="text-slate-400">
            Framework EDI • Professor Digital • Agenda Inteligente • EduData Analytics
          </p>

          <p className="mt-4 text-sm text-slate-500">
            © 2026 EduData IA — Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}