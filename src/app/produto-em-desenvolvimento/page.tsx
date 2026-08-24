import Link from 'next/link'

type ProductStatus = {
  name: string
  description: string
}

const PRODUCTS: Record<string, ProductStatus> = {
  'professor-digital': {
    name: 'Professor Digital',
    description:
      'O Professor Digital está em fase de consolidação e validação antes da liberação pública.',
  },
  analytics: {
    name: 'EduData Analytics',
    description:
      'O EduData Analytics está em fase de consolidação e validação antes da liberação pública.',
  },
  sgpa: {
    name: 'SGPA',
    description:
      'O SGPA está em fase de consolidação e validação antes da liberação pública.',
  },
  observatorio: {
    name: 'Observatório da Educação',
    description:
      'O Observatório da Educação está em fase de consolidação e validação antes da liberação pública.',
  },
  academy: {
    name: 'EduData Academy',
    description:
      'A EduData Academy está em fase de consolidação e validação antes da liberação pública.',
  },
}

function normalizeProduct(
  value: string | string[] | undefined,
): ProductStatus {
  const code =
    typeof value === 'string'
      ? value.trim().toLowerCase()
      : ''

  return (
    PRODUCTS[code] ?? {
      name: 'Produto EduData IA',
      description:
        'Este produto está em fase de consolidação e validação antes da liberação pública.',
    }
  )
}

export default function ProductDevelopmentPage({
  searchParams,
}: {
  searchParams?: {
    produto?: string | string[]
  }
}) {
  const product = normalizeProduct(searchParams?.produto)
  const isProfessorDigital = product.name === 'Professor Digital'

  return (
    <main className="min-h-screen bg-[#EEF3F7] px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <section className="mx-auto max-w-3xl overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm sm:rounded-[1.75rem]">
        <header className="border-b border-slate-200 bg-[#071827] px-6 py-7 text-white sm:px-8 sm:py-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
            EduData IA
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {product.name}
          </h1>

          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300 sm:text-sm">
            Produto em desenvolvimento
          </p>
        </header>

        <div className="px-6 py-7 sm:px-8 sm:py-9">
          <p className="text-lg leading-8 text-slate-700 sm:text-xl">
            {product.description}
          </p>

          {isProfessorDigital && (
            <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B7491]">
                Função do produto
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Um copiloto pedagógico para interpretar contextos, apoiar
                decisões e contribuir para o desenvolvimento profissional.
              </p>
            </section>
          )}

          <div className="mt-6 rounded-2xl border border-cyan-200 bg-cyan-50 px-5 py-5">
            <p className="font-bold text-[#071827]">
              Por que o acesso está temporariamente indisponível?
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-700">
              A liberação acontece somente depois da validação dos fluxos
              essenciais, da segurança, da governança e da experiência de uso.
              Assim, a plataforma não apresenta como concluído um recurso que
              ainda está em evolução.
            </p>
          </div>

          <div className="mt-7 border-t border-slate-200 pt-6">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0B7491]">
              Produto disponível no MVP atual
            </p>

            <h2 className="mt-2 text-2xl font-bold text-[#071827]">
              Agenda Inteligente EDI
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              A Agenda Inteligente EDI organiza a rotina e os registros do
              trabalho pedagógico. O Professor Digital terá outra função:
              interpretar contextos e apoiar reflexão, decisão e desenvolvimento.
            </p>

            <div className="mt-5 grid gap-3 sm:flex sm:flex-wrap">
              <Link
                href="/agenda"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0B7491] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#09657E] focus:outline-none focus:ring-2 focus:ring-cyan-300"
              >
                Conhecer a Agenda EDI
              </Link>

              <Link
                href="/"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-300"
              >
                Voltar para a Home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
