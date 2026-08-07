import Link from 'next/link'

import {
  products,
} from '@/lib/data/products'

type ProductStage = {
  label: string
  description: string
  badgeClassName: string
}

const productStages:
  Record<string, ProductStage> = {
    'professor-digital': {
      label: 'Prioridade comercial',
      description:
        'Principal porta de entrada formativa e comercial da EduData IA.',
      badgeClassName:
        'border-cyan-200 bg-cyan-50 text-[#075F78]',
    },
    'agenda-edi': {
      label: 'Piloto',
      description:
        'Produto operacional prioritário em validação com usuários.',
      badgeClassName:
        'border-amber-200 bg-amber-50 text-amber-800',
    },
    academy: {
      label: 'Em implantação',
      description:
        'Ambiente de cursos, trilhas e inscrições em evolução.',
      badgeClassName:
        'border-emerald-200 bg-emerald-50 text-emerald-800',
    },
    analytics: {
      label: 'Operacional',
      description:
        'Produto ativo de inteligência analítica, histórico longitudinal, comparação, tendências e exportação institucional.',
      badgeClassName:
        'border-cyan-200 bg-cyan-50 text-[#075F78]',
    },
    sgpa: {
      label: 'Roadmap',
      description:
        'Camada institucional de governança, acompanhamento e conformidade.',
      badgeClassName:
        'border-slate-200 bg-slate-100 text-slate-700',
    },
    observatorio: {
      label: 'Roadmap',
      description:
        'Ambiente previsto para estudos, indicadores e conhecimento educacional.',
      badgeClassName:
        'border-slate-200 bg-slate-100 text-slate-700',
    },
    comunidade: {
      label: 'Roadmap',
      description:
        'Rede colaborativa prevista para experiências e práticas educacionais.',
      badgeClassName:
        'border-slate-200 bg-slate-100 text-slate-700',
    },
  }

const primaryProductIds = [
  'professor-digital',
  'agenda-edi',
]

function getProductStage(
  productId: string,
): ProductStage {
  return (
    productStages[productId] ?? {
      label: 'Em evolução',
      description:
        'Produto integrado ao planejamento estratégico da plataforma.',
      badgeClassName:
        'border-slate-200 bg-slate-100 text-slate-700',
    }
  )
}

function getProductAction(
  productId: string,
): string {
  if (
    productId ===
    'professor-digital'
  ) {
    return 'Conhecer o programa'
  }

  if (
    productId ===
    'agenda-edi'
  ) {
    return 'Conhecer a Agenda'
  }

  if (
    productId ===
    'academy'
  ) {
    return 'Acessar a Academy'
  }

  if (
    productId ===
    'analytics'
  ) {
    return 'Acessar o Analytics'
  }

  return 'Conhecer o produto'
}

export default function EcosystemProducts() {
  const primaryProducts =
    products
      .filter(
        (product) =>
          primaryProductIds.includes(
            product.id,
          ),
      )
      .sort(
        (
          firstProduct,
          secondProduct,
        ) =>
          firstProduct.order -
          secondProduct.order,
      )

  const remainingProducts =
    products
      .filter(
        (product) =>
          !primaryProductIds.includes(
            product.id,
          ),
      )
      .sort(
        (
          firstProduct,
          secondProduct,
        ) =>
          firstProduct.order -
          secondProduct.order,
      )

  return (
    <section
      id="ecossistema"
      className="scroll-mt-24 bg-[#EEF3F7] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.58fr)] lg:items-end">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#075F78]">
                Ecossistema integrado
              </span>

              <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Produtos especializados
              </span>
            </div>

            <p className="mt-7 text-xs font-bold uppercase tracking-[0.22em] text-[#0B7491]">
              Ecossistema EduData IA
            </p>

            <h2 className="mt-4 text-4xl font-bold leading-[1.08] tracking-tight text-[#071827] sm:text-5xl">
              Diferentes produtos, uma única base de inteligência educacional.
            </h2>

            <p className="mt-6 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Cada produto atende uma necessidade específica, mas todos
              compartilham identidade, acesso, dados, segurança, governança
              e os princípios do Framework EDI.
            </p>
          </div>

          <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-200 px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                Prioridade atual
              </p>
            </header>

            <div className="divide-y divide-slate-200">
              <div className="grid grid-cols-[38px_minmax(0,1fr)] gap-4 px-5 py-4">
                <span className="font-mono text-xs font-bold text-[#0B7491]">
                  01
                </span>

                <p className="text-sm font-semibold text-[#071827]">
                  Professor Digital
                </p>
              </div>

              <div className="grid grid-cols-[38px_minmax(0,1fr)] gap-4 bg-cyan-50 px-5 py-4">
                <span className="font-mono text-xs font-bold text-[#0B7491]">
                  02
                </span>

                <p className="text-sm font-bold text-cyan-950">
                  Agenda Inteligente EDI
                </p>
              </div>
            </div>
          </aside>
        </div>

        <section className="mt-12">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
              Produtos prioritários
            </p>

            <h3 className="mt-3 text-3xl font-bold tracking-tight text-[#071827] sm:text-4xl">
              Onde a experiência começa.
            </h3>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {primaryProducts.map(
              (
                product,
                index,
              ) => {
                const stage =
                  getProductStage(
                    product.id,
                  )

                return (
                  <Link
                    key={product.id}
                    href={product.href}
                    className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition hover:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-[#0B7491]"
                  >
                    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-7">
                      <span className="font-mono text-xs font-bold text-[#0B7491]">
                        {String(
                          index + 1,
                        ).padStart(
                          2,
                          '0',
                        )}
                      </span>

                      <span
                        className={`rounded-lg border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] ${stage.badgeClassName}`}
                      >
                        {stage.label}
                      </span>
                    </header>

                    <div className="p-5 sm:p-7">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                        {product.category}
                      </p>

                      <h4 className="mt-3 text-2xl font-bold text-[#071827] sm:text-3xl">
                        {product.name}
                      </h4>

                      <p className="mt-4 text-base leading-7 text-slate-600">
                        {product.description}
                      </p>

                      <div className="mt-6 rounded-xl border border-slate-200 bg-[#EEF3F7] p-4">
                        <p className="text-sm leading-6 text-slate-600">
                          {stage.description}
                        </p>
                      </div>
                    </div>

                    <footer className="flex items-center justify-between gap-4 border-t border-slate-200 px-5 py-4 sm:px-7">
                      <span className="text-sm font-bold text-[#071827]">
                        {getProductAction(
                          product.id,
                        )}
                      </span>

                      <span
                        aria-hidden="true"
                        className="text-lg font-bold text-[#0B7491] transition group-hover:translate-x-1"
                      >
                        →
                      </span>
                    </footer>
                  </Link>
                )
              },
            )}
          </div>
        </section>

        <section className="mt-14 sm:mt-16">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
              Evolução do ecossistema
            </p>

            <h3 className="mt-3 text-3xl font-bold tracking-tight text-[#071827] sm:text-4xl">
              Produtos conectados ao mesmo núcleo.
            </h3>

            <p className="mt-4 text-base leading-7 text-slate-600">
              Os produtos abaixo representam as próximas camadas de formação,
              análise, governança, pesquisa e colaboração da plataforma.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {remainingProducts.map(
              (
                product,
                index,
              ) => {
                const stage =
                  getProductStage(
                    product.id,
                  )

                return (
                  <Link
                    key={product.id}
                    href={product.href}
                    className="group flex min-h-80 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-[#0B7491]"
                  >
                    <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4">
                      <span className="font-mono text-xs font-bold text-[#0B7491]">
                        {String(
                          index + 3,
                        ).padStart(
                          2,
                          '0',
                        )}
                      </span>

                      <span
                        className={`rounded-lg border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] ${stage.badgeClassName}`}
                      >
                        {stage.label}
                      </span>
                    </header>

                    <div className="flex flex-1 flex-col p-5">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                        {product.category}
                      </p>

                      <h4 className="mt-3 text-xl font-bold text-[#071827]">
                        {product.name}
                      </h4>

                      <p className="mt-4 flex-1 text-sm leading-6 text-slate-600">
                        {product.description}
                      </p>

                      <p className="mt-5 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500">
                        {stage.description}
                      </p>
                    </div>

                    <footer className="flex items-center justify-between gap-4 border-t border-slate-200 px-5 py-4">
                      <span className="text-sm font-bold text-[#071827]">
                        {getProductAction(
                          product.id,
                        )}
                      </span>

                      <span
                        aria-hidden="true"
                        className="font-bold text-[#0B7491] transition group-hover:translate-x-1"
                      >
                        →
                      </span>
                    </footer>
                  </Link>
                )
              },
            )}
          </div>
        </section>

        <footer className="mt-12 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-[#071827] text-white">
          <div className="grid divide-y divide-white/10 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
            <div className="px-5 py-5 sm:px-6">
              <p className="font-mono text-xs font-bold text-cyan-300">
                01
              </p>

              <p className="mt-2 text-sm font-semibold">
                Framework EDI
              </p>
            </div>

            <div className="px-5 py-5 sm:px-6">
              <p className="font-mono text-xs font-bold text-cyan-300">
                02
              </p>

              <p className="mt-2 text-sm font-semibold">
                EIOS
              </p>
            </div>

            <div className="px-5 py-5 sm:px-6">
              <p className="font-mono text-xs font-bold text-cyan-300">
                03
              </p>

              <p className="mt-2 text-sm font-semibold">
                Core compartilhado
              </p>
            </div>

            <div className="bg-cyan-300/10 px-5 py-5 sm:px-6">
              <p className="font-mono text-xs font-bold text-cyan-300">
                04
              </p>

              <p className="mt-2 text-sm font-bold text-cyan-100">
                Produtos especializados
              </p>
            </div>
          </div>
        </footer>
      </div>
    </section>
  )
}
