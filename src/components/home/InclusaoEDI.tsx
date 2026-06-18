export default function InclusaoEDI() {
  const recursos = [
    'Descrição auditiva',
    'Navegação por teclado',
    'Alto contraste',
    'Fonte ampliada',
    'Leitura guiada',
    'Preparação para VLibras',
  ]

  return (
    <section id="inclusao" className="bg-white px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#1B6B3A]">
          Inclusão por Design
        </p>

        <h2 className="max-w-4xl text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
          Acessibilidade não é recurso adicional. É parte da arquitetura da EduData IA.
        </h2>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-700">
          A plataforma nasce preparada para ampliar o acesso, apoiar diferentes formas de
          aprendizagem e tornar a experiência educacional mais inclusiva.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {recursos.map((item) => (
            <div key={item} className="rounded-3xl border border-slate-200 bg-[#F5F6F8] p-6">
              <h3 className="text-xl font-semibold text-slate-900">{item}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
