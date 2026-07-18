import Link from 'next/link'

type FooterLink = {
  label: string
  href: string
}

const ecosystemLinks: FooterLink[] = [
  {
    label: 'Framework EDI',
    href: '/#framework',
  },
  {
    label: 'Professor Digital',
    href: '/professor-digital',
  },
  {
    label: 'Agenda Inteligente EDI',
    href: '/agenda',
  },
  {
    label: 'EduData Academy',
    href: '/academy',
  },
]

const governanceLinks: FooterLink[] = [
  {
    label: 'Central de Governança',
    href: '/governanca',
  },
  {
    label: 'Privacidade e proteção de dados',
    href: '/governanca#privacidade',
  },
  {
    label: 'Termos de uso',
    href: '/governanca#termos',
  },
  {
    label: 'Acessibilidade',
    href: '/governanca#acessibilidade',
  },
]

const upcomingProducts = [
  'EduData Analytics',
  'SGPA',
  'Observatório da Educação',
]

const linkClassName =
  'inline-flex items-start gap-2 text-slate-300 transition hover:translate-x-1 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#081C2E]'

function LinkArrow() {
  return (
    <span
      aria-hidden="true"
      className="mt-0.5 shrink-0 text-cyan-400"
    >
      →
    </span>
  )
}

export default function Footer() {
  return (
    <footer className="bg-[#081C2E] text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1.85fr)] lg:gap-16">
          <div>
            <Link
              href="/"
              aria-label="Ir para a página inicial da EduData IA"
              className="inline-flex rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#081C2E]"
            >
              <img
                src="/logo-edudata-ia-dark.png"
                alt="EduData IA"
                className="h-auto w-full max-w-[290px] object-contain sm:max-w-[340px]"
              />
            </Link>

            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-300">
              Plataforma Operacional de Inteligência Educacional baseada
              em Evidências, Inclusão e Inteligência.
            </p>

            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-400">
              Um único ecossistema, um único motor de inteligência e
              múltiplos produtos especializados.
            </p>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">
                Comunidade EduData IA
              </p>

              <h2 className="mt-3 text-xl font-bold text-white">
                Faça parte da construção do ecossistema.
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-300">
                Acompanhe a evolução do Framework EDI, participe das
                formações e conheça os novos produtos da plataforma.
              </p>

              <a
                href="mailto:sabinohc@gmail.com?subject=Comunidade%20EduData%20IA&body=Ol%C3%A1%2C%20gostaria%20de%20receber%20informa%C3%A7%C3%B5es%20e%20participar%20da%20Comunidade%20EduData%20IA."
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0B7491] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#09657E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#081C2E]"
              >
                Participar da comunidade
              </a>
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-2 xl:grid-cols-3">
            <div>
              <h2 className="text-lg font-bold text-white">
                Ecossistema
              </h2>

              <ul className="mt-5 space-y-4">
                {ecosystemLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={linkClassName}
                    >
                      <LinkArrow />

                      <span>{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-7 border-t border-white/10 pt-6">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  Em desenvolvimento
                </p>

                <ul className="mt-4 space-y-3">
                  {upcomingProducts.map((product) => (
                    <li
                      key={product}
                      className="flex flex-wrap items-center gap-2 text-sm text-slate-400"
                    >
                      <span>{product}</span>

                      <span className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
                        Em breve
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">
                Governança
              </h2>

              <ul className="mt-5 space-y-4">
                {governanceLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={linkClassName}
                    >
                      <LinkArrow />

                      <span>{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-7 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-300">
                  Compromisso institucional
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Privacidade, segurança, acessibilidade e proteção dos
                  dados educacionais fazem parte da evolução da
                  plataforma.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">
                Conecte-se
              </h2>

              <div className="mt-5 space-y-4">
                <a
                  href="mailto:sabinohc@gmail.com?subject=Contato%20-%20EduData%20IA"
                  className={linkClassName}
                >
                  <LinkArrow />

                  <span>Contato</span>
                </a>

                <Link
                  href="/academy"
                  className={linkClassName}
                >
                  <LinkArrow />

                  <span>Cursos e formações</span>
                </Link>

                <a
                  href="mailto:sabinohc@gmail.com?subject=Parceria%20institucional%20-%20EduData%20IA&body=Ol%C3%A1%2C%20gostaria%20de%20conversar%20sobre%20uma%20poss%C3%ADvel%20parceria%20com%20a%20EduData%20IA."
                  className={linkClassName}
                >
                  <LinkArrow />

                  <span>Parcerias institucionais</span>
                </a>

                <a
                  href="mailto:sabinohc@gmail.com?subject=Comunidade%20EduData%20IA"
                  className={linkClassName}
                >
                  <LinkArrow />

                  <span>Comunidade EduData IA</span>
                </a>
              </div>

              <div className="mt-7 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-300">
                    LinkedIn
                  </span>

                  <span className="rounded-md border border-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
                    Canal em atualização
                  </span>
                </div>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  O endereço oficial será disponibilizado após a
                  finalização da página institucional.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 border-t border-white/10 pt-8 lg:mt-16">
          <nav
            aria-label="Links institucionais do rodapé"
            className="flex flex-wrap justify-center gap-x-5 gap-y-3 text-sm text-slate-400"
          >
            <Link
              href="/"
              className="transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              Página inicial
            </Link>

            <Link
              href="/professor-digital"
              className="transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              Professor Digital
            </Link>

            <Link
              href="/agenda"
              className="transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              Agenda Inteligente EDI
            </Link>

            <Link
              href="/academy"
              className="transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              EduData Academy
            </Link>

            <Link
              href="/governanca"
              className="transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              Governança
            </Link>
          </nav>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              © 2026 EduData IA — Todos os direitos reservados.
            </p>

            <p className="mt-2 text-xs text-slate-600">
              Plataforma Operacional de Inteligência Educacional.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}