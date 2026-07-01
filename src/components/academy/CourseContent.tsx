export default function CourseContent() {
  const objetivos = [
    'Compreender os fundamentos do curso e sua aplicação na educação.',
    'Aplicar ferramentas digitais e metodologias inovadoras na prática pedagógica.',
    'Relacionar o conteúdo do curso ao Framework EDI.',
    'Produzir evidências de aprendizagem e desenvolvimento profissional.',
  ]

  const publicoAlvo = [
    'Professores da Educação Básica',
    'Coordenadores pedagógicos',
    'Gestores escolares',
    'Profissionais interessados em tecnologia educacional',
  ]

  return (
    <section className="rounded-3xl bg-white p-10 shadow-sm">
      <h2 className="text-3xl font-bold text-[#0A3A5E]">
        Sobre o curso
      </h2>

      <p className="mt-6 text-lg leading-8 text-slate-600">
        Este curso integra a EduData IA Academy e foi desenvolvido para apoiar
        professores, gestores e profissionais da educação no uso estratégico de
        tecnologia, dados, metodologias ativas e inteligência educacional.
      </p>

      <p className="mt-4 text-lg leading-8 text-slate-600">
        A formação segue os princípios do Framework EDI — Evidências, Inclusão e
        Inteligência — conectando teoria, prática e produção de evidências para
        fortalecer a atuação profissional no contexto escolar.
      </p>

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <div>
          <h3 className="text-2xl font-bold text-slate-950">
            Objetivos
          </h3>

          <ul className="mt-5 space-y-3">
            {objetivos.map((objetivo) => (
              <li
                key={objetivo}
                className="rounded-2xl border border-slate-200 bg-[#F5F6F8] p-4 text-slate-700"
              >
                {objetivo}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-2xl font-bold text-slate-950">
            Público-alvo
          </h3>

          <ul className="mt-5 space-y-3">
            {publicoAlvo.map((item) => (
              <li
                key={item}
                className="rounded-2xl border border-slate-200 bg-[#F5F6F8] p-4 text-slate-700"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}