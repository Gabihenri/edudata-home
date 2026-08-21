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

const upcomingProducts = [
  'EduData Analytics',
  'SGPA',
  'Observatório da Educação',
]

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
        className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_50%_0%,rgba(0,207,232,0.12),transparent_58%)]"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        {/* Institutional brand block */}
        <div className="border-b border-cyan-300/15 pb-12 text-center sm:pb-14">
          <Link
            href="/"
            aria-label="Ir para a página inicial da EduData IA"
            className="mx-auto inline-flex max-w-[340px] rounded-2xl p-2 transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#081C2E]"
          >
            <img
              src="/logo-edudata-ia-footer.png"
              alt="EduData IA — Tecnologia, dados e inteligência para transformar a educação"
              className="h-auto w-full object-contain"
            />
          </Link>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
            Plataforma Operacional de Inteligência Educacional baseada em
            Evidências, Inclusão e Inteligência.
          </p>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            Um único ecossistema, um único motor de inteligência e múltiplos
            produtos especializados.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <a
              href="https://www.linkedin.com/company/edudata-ia/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-10 items-center rounded-full border border-cyan-300/30 bg-white/[0.03] px-5 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-300/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              LinkedIn · Canal oficial
            </a>
            <Link
              href="/contato"
              className="inline-flex min-h-10 items-center rounded-full border border-white/15 bg-white/[0.03] px-5 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/30 hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              Fale com a EduData IA
            </Link>
          </div>
        </div>

        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-14 lg:py-14">
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

            <div className="mt-7 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-300">
                Compromisso institucional
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Privacidade, segurança, acessibilidade e proteção dos dados
                educacionais fazem parte da evolução da plataforma.
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

            <div className="mt-7 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-300">
                Canal oficial
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Acompanhe as novidades, produtos e conteúdos da EduData IA.
              </p>
              <a
                href="https://www.linkedin.com/company/edudata-ia/"
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex font-semibold text-cyan-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                LinkedIn →
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-cyan-300/15 pt-8">
          <nav
            aria-label="Links institucionais do rodapé"
            className="flex flex-wrap justify-center gap-x-5 gap-y-3 text-sm text-slate-400"
          >
            <Link href="/" className="transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
              Página inicial
            </Link>
            <Link href="/professor-digital" className="transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
              Professor Digital
            </Link>
            <Link href="/agenda" className="transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
              Agenda Inteligente EDI
            </Link>
            <Link href="/academy" className="transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
              EduData Academy
            </Link>
            <Link href="/governanca" className="transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
              Governança
            </Link>
          </nav>

          <div className="mt-7 text-center">
            <p className="text-sm text-slate-500">
              © 2026 EduData IA — Todos os direitos reservados.
            </p>
            <p className="mt-2 text-xs text-slate-600">
              Plataforma Operacional de Inteligência Educacional.
            </p>
          </div>

          <div className="mt-7 flex justify-center">
            <div className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-full border border-cyan-300/50 bg-cyan-300/[0.04] px-5 py-3 text-sm text-slate-300">
              <span className="font-bold text-cyan-300">Framework EDI</span>
              <span aria-hidden="true">•</span>
              <span>Evidências</span>
              <span aria-hidden="true">•</span>
              <span>Inclusão</span>
              <span aria-hidden="true">•</span>
              <span>Inteligência</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
