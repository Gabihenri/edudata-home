const indicadores = [
  {
    titulo: 'Planejamentos',
    valor: '12',
    descricao: 'ações pedagógicas organizadas',
  },
  {
    titulo: 'Evidências',
    valor: '28',
    descricao: 'registros documentados',
  },
  {
    titulo: 'Pendências',
    valor: '04',
    descricao: 'itens aguardando acompanhamento',
  },
  {
    titulo: 'Formações',
    valor: '03',
    descricao: 'trilhas em andamento',
  },
]

const proximasAcoes = [
  'Revisar planejamento semanal',
  'Registrar evidências da aula prática',
  'Acompanhar devolutiva da gestão',
  'Atualizar metas de desenvolvimento',
]

export function AgendaDashboard() {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#5C1A8C]">
            Agenda Inteligente EDI
          </p>

          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">
            Dashboard pedagógico
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
            Visão inicial da rotina pedagógica, com planejamentos, evidências,
            pendências, formações e indicadores integrados ao ecossistema
            EduData IA.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          {indicadores.map((item) => (
            <div
              key={item.titulo}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                {item.titulo}
              </p>

              <p className="mt-5 text-5xl font-bold text-[#081C2E]">
                {item.valor}
              </p>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                {item.descricao}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-2xl font-bold text-slate-950">
              Próximas ações
            </h2>

            <div className="mt-6 space-y-4">
              {proximasAcoes.map((acao) => (
                <div
                  key={acao}
                  className="rounded-2xl border border-slate-200 bg-[#F5F6F8] p-5 font-semibold text-slate-800"
                >
                  {acao}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-[#081C2E] p-8 text-white shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">
              EIOS
            </p>

            <h2 className="mt-4 text-3xl font-bold">
              Preparado para inteligência educacional
            </h2>

            <p className="mt-5 leading-7 text-slate-200">
              Este dashboard será conectado ao núcleo EIOS para gerar alertas,
              recomendações, relatórios automáticos e priorização inteligente da
              rotina pedagógica.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}