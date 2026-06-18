export default function Participacao() {
  const acoes = [
    'Solicitar demonstração',
    'Enviar feedback',
    'Propor parceria',
    'Entrar em contato',
  ]

  return (
    <section id="participacao" className="bg-slate-950 px-6 py-24 text-white">
      <div className="mx-auto max-w-5xl text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-slate-400">
          Comunidade e construção coletiva
        </p>

        <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
          Participe da construção da EduData IA
        </h2>

        <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300">
          A EduData IA evolui com educadores, gestores, pesquisadores e instituições que
          acreditam em evidências, inclusão e inteligência.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          {acoes.map((item) => (
            <a
              key={item}
              href="#"
              className="rounded-full border border-white/20 px-6 py-3 font-semibold hover:bg-white hover:text-slate-950"
            >
              {item}
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
