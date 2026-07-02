import { framework, frameworkPillars } from '@/lib/data/framework'

export function FrameworkEDI() {
  const colors = ['#0A3A5E', '#1B6B3A', '#5C1A8C']
  const shapes = [
    'clip-polygon-triangle',
    'clip-polygon-diamond',
    'clip-polygon-hexagon',
  ]

  return (
    <section id="framework" className="bg-white px-6 py-32">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-4xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
            {framework.title}
          </p>

          <h2 className="text-5xl font-bold tracking-tight text-slate-950 md:text-6xl">
            {framework.subtitle}
          </h2>

          <p className="mt-8 text-xl leading-9 text-slate-600">
            O Framework EDI integra{' '}
            <strong>Evidências</strong>,{' '}
            <strong>Inclusão</strong> e{' '}
            <strong>Inteligência</strong> como princípios que sustentam toda a
            Plataforma EduData IA.
          </p>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-500">
            {framework.principle}
          </p>

          <div className="mt-10">
            <a
              href="#professor-digital"
              className="inline-flex rounded-full bg-[#0A3A5E] px-7 py-4 font-semibold text-white transition hover:opacity-90"
            >
              Conheça o Framework
            </a>
          </div>
        </div>

        <div className="mt-24 grid gap-12 md:grid-cols-3">
          {frameworkPillars.map((pillar, index) => (
            <div
              key={pillar.id}
              className="border-t pt-8"
              style={{
                borderColor: colors[index],
              }}
            >
              <div
                className={`mb-8 h-16 w-16 ${shapes[index]}`}
                style={{
                  backgroundColor: colors[index],
                }}
              />

              <h3
                className="mb-4 text-3xl font-bold"
                style={{
                  color: colors[index],
                }}
              >
                {pillar.title}
              </h3>

              <p className="leading-8 text-slate-600">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}