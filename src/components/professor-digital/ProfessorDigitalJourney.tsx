'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type JourneyItem = {
  href: string
  label: string
  description: string
  shortLabel: string
}

const journey: JourneyItem[] = [
  {
    href: '/professor-digital/perfil',
    label: 'Meu Contexto',
    shortLabel: 'Contexto',
    description: 'O que importa para você neste momento profissional.',
  },
  {
    href: '/professor-digital/agenda',
    label: 'Minha Atuação',
    shortLabel: 'Atuação',
    description: 'Leituras reflexivas a partir de registros autorizados.',
  },
  {
    href: '/professor-digital/conhecimento',
    label: 'Meu Conhecimento',
    shortLabel: 'Conhecimento',
    description: 'Temas, interesses e perguntas que você deseja aprofundar.',
  },
  {
    href: '/professor-digital/producao',
    label: 'Minha Produção',
    shortLabel: 'Produção',
    description: 'Memória profissional das experiências e projetos construídos.',
  },
  {
    href: '/professor-digital/desenvolvimento',
    label: 'Meu Desenvolvimento',
    shortLabel: 'Desenvolvimento',
    description: 'Possibilidades que você pode considerar com apoio do EIOS.',
  },
]

export function ProfessorDigitalJourney() {
  const pathname = usePathname()

  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
              Professor Digital · Beta
            </p>
            <h2 className="mt-1 text-xl font-semibold text-[#081C2E]">
              Sua jornada profissional, construída por você
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              O EIOS organiza conexões e possibilidades a partir dos dados que você autoriza.
              A interpretação e as escolhas continuam sob seu controle.
            </p>
          </div>

          <Link
            href="/professor-digital"
            className="inline-flex w-fit items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50"
          >
            Visão geral
          </Link>
        </div>

        <nav aria-label="Jornada do Professor Digital" className="mt-5 overflow-x-auto pb-1">
          <ol className="flex min-w-max items-stretch gap-2">
            {journey.map((item, index) => {
              const active = pathname === item.href

              return (
                <li key={item.href} className="flex items-stretch gap-2">
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`group flex min-w-40 flex-col rounded-2xl border px-4 py-3 transition sm:min-w-48 ${
                      active
                        ? 'border-[#081C2E] bg-[#081C2E] text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:bg-cyan-50'
                    }`}
                  >
                    <span className={`text-xs font-semibold uppercase tracking-wide ${active ? 'text-cyan-200' : 'text-cyan-700'}`}>
                      {index + 1}. {item.shortLabel}
                    </span>
                    <span className="mt-1 font-semibold">{item.label}</span>
                    <span className={`mt-1 text-xs leading-5 ${active ? 'text-slate-200' : 'text-slate-500'}`}>
                      {item.description}
                    </span>
                  </Link>
                  {index < journey.length - 1 ? (
                    <span className="hidden self-center text-slate-300 lg:inline" aria-hidden="true">→</span>
                  ) : null}
                </li>
              )
            })}
          </ol>
        </nav>
      </div>
    </section>
  )
}
