import Link from 'next/link'

type FooterLink = {
  label: string
  href: string
}

const ecosystemLinks: FooterLink[] = [
  { label: 'Framework EDI', href: '/arquitetura' },
  { label: 'Professor Digital', href: '/professor-digital' },
  { label: 'Agenda Inteligente EDI', href: '/agenda' },
  { label: 'EduData Academy', href: '/academy' },
]

const governanceLinks: FooterLink[] = [
  { label: 'Central de Governança', href: '/governanca' },
  { label: 'Privacidade e proteção de dados', href: '/governanca#privacidade' },
  { label: 'Termos de uso', href: '/governanca#termos' },
  { label: 'Acessibilidade', href: '/governanca#acessibilidade' },
]

const upcomingProducts = ['EduData Analytics', 'SGPA', 'Observatório da Educação']

const linkedinUrl = 'https://www.linkedin.com/company/edudata-ia/'

const linkClassName =
  'flex w-fit items-start gap-2 text-slate-300 transition hover:translate-x-1 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#081C2E]'

function LinkArrow() {
  return (
    <span aria-hidden="true" className="mt-0.5 shrink-0 text-cyan-400">
      →
    </span>
  )
}

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#081C2E] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_50%_0%,rgba(0,207,232,0.08),transparent_62%)]"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <div className="border-b border-white/10 pb-9">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-5">
              <Link
                href="/"
                aria-label="Ir para a página inicial da EduData IA"
                className="block w-[190px] shrink-0 transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#081C2E]"
              >
                <img
                  src="/logo-edudata-ia-footer.png"
                  alt="EduData IA"
                  className="h-auto w-full object-contain"
                />
              </Link>

              <div className="hidden h-12 w-px bg-white/10 sm:block" aria-hidden="true" />

              <div>
                <p className="max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                  Plataforma Operacional de Inteligência Educacional.
                </p>
                <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500 sm:text-sm">
                  Tecnologia, dados e inteligência para transformar a educação.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 lg:justify-end">
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Abrir LinkedIn oficial da EduData IA em nova aba"
                className="inline-flex min-h-10 items-center rounded-full border border-cyan-300/40 bg-cyan-300/10 px-4 py-2 text-sm font-bold text-cyan-100 transition hover:border-cyan-300 hover:bg-cyan-300/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                LinkedIn oficial →
              </a>
              <Link
                href="/contato"
                className="inline-flex min-h-10 items-center rounded-full border border-white/15 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/30 hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                Fale com a EduData IA
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-10 py-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-14 lg:py-12">
          <div>
            <h2 className="text-lg font-bold text-white">Ecossistema</h2>
            <ul className="mt-5 space-y-4">
              {ecosystemLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClassName}>
                    <LinkArrow />
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-7 border-t border-white/10 pt-6">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Em desenvolvimento</p>
              <ul className="mt-4 space-y-3">
                {upcomingProducts.map((product) => (
                  <li key={product} className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
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
            <h2 className="text-lg font-bold text-white">Governança</h2>
            <ul className="mt-5 space-y-4">
              {governanceLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClassName}>
                    <LinkArrow />
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-7 border-l-2 border-cyan-300/40 pl-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-300">Compromisso institucional</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Privacidade, segurança, acessibilidade e proteção dos dados educacionais fazem parte da evolução da plataforma.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">Conecte-se</h2>
            <div className="mt-5 space-y-4">
              <Link href="/contato" className={linkClassName}>
                <LinkArrow />
                <span>Contato</span>
              </Link>
              <Link href="/academy" className={linkClassName}>
                <LinkArrow />
                <span>Cursos e formações</span>
              </Link>
              <Link href="/contato?context=parceria" className={linkClassName}>
                <LinkArrow />
                <span>Parcerias institucionais</span>
              </Link>
              <Link href="/contato?context=comunidade" className={linkClassName}>
                <LinkArrow />
                <span>Comunidade EduData IA</span>
              </Link>
            </div>

            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Abrir LinkedIn oficial da EduData IA em nova aba"
              className="mt-7 inline-flex min-h-10 items-center rounded-lg border border-cyan-300/30 bg-cyan-300/[0.06] px-4 py-2 font-semibold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-300/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              Acompanhe a EduData IA no LinkedIn →
            </a>
          </div>
        </div>

        <div className="border-t border-white/10 pt-7">
          <nav aria-label="Links institucionais do rodapé" className="flex flex-wrap justify-center gap-x-5 gap-y-3 text-sm text-slate-400">
            <Link href="/" className="transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">Página inicial</Link>
            <Link href="/professor-digital" className="transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">Professor Digital</Link>
            <Link href="/agenda" className="transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">Agenda Inteligente EDI</Link>
            <Link href="/academy" className="transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">EduData Academy</Link>
            <Link href="/governanca" className="transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">Governança</Link>
          </nav>

          <div className="mt-7 flex flex-col items-center gap-4 text-center">
            <div className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-slate-500">
              <span className="font-semibold text-cyan-300">Framework EDI</span>
              <span aria-hidden="true">•</span>
              <span>Evidências</span>
              <span aria-hidden="true">•</span>
              <span>Inclusão</span>
              <span aria-hidden="true">•</span>
              <span>Inteligência</span>
            </div>

            <div>
              <p className="text-xs text-slate-500">© 2026 EduData IA — Todos os direitos reservados.</p>
              <p className="mt-1 text-[11px] text-slate-600">Plataforma Operacional de Inteligência Educacional.</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
