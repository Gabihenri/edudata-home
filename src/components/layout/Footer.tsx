import Link from 'next/link'

const activeEcosystemLinks = [
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

const upcomingProducts = [
  'EduData Analytics',
  'SGPA',
]

export default function Footer() {
  return (
    <footer className="bg-[#081C2E] text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 md:items-start">
          <div>
            <Link
              href="/"
              aria-label="Ir para a página inicial da EduData IA"
              className="flex w-full justify-center"
            >
              <img
                src="/logo-edudata-ia-dark.png"
                alt="EduData IA"
                className="h-auto w-full max-w-[290px] object-contain sm:max-w-[340px]"
              />
            </Link>

            <p className="mt-8 max-w-xl text-lg leading-8 text-slate-300 sm:text-xl">
              Ecossistema de Inteligência Educacional baseado em Evidências,
              Inclusão e Inteligência.
            </p>

            <div className="mt-8">
              <h3 className="text-lg font-semibold">
                Faça parte da Comunidade EduData IA
              </h3>

              <p className="mt-3 max-w-lg leading-7 text-slate-400">
                Acompanhe a evolução do Framework EDI, participe das formações
                e conheça os bastidores da construção do ecossistema EduData IA.
              </p>
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-2">
            <div>
              <h3 className="mb-5 text-xl font-semibold">
                Ecossistema
              </h3>

              <ul className="space-y-4">
                {activeEcosystemLinks.slice(0, 3).map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-flex items-center gap-2 text-slate-300 transition hover:translate-x-1 hover:text-white"
                    >
                      <span
                        aria-hidden="true"
                        className="text-cyan-400"
                      >
                        →
                      </span>

                      {link.label}
                    </Link>
                  </li>
                ))}

                {upcomingProducts.map((product) => (
                  <li
                    key={product}
                    className="flex flex-wrap items-center gap-2 text-slate-500"
                  >
                    <span>
                      {product}
                    </span>

                    <span className="rounded-lg border border-white/10 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Em desenvolvimento
                    </span>
                  </li>
                ))}

                {activeEcosystemLinks.slice(3).map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-flex items-center gap-2 text-slate-300 transition hover:translate-x-1 hover:text-white"
                    >
                      <span
                        aria-hidden="true"
                        className="text-cyan-400"
                      >
                        →
                      </span>

                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-5 text-xl font-semibold">
                Conecte-se
              </h3>

              <div className="space-y-4">
                <a
                  href="https://www.linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-slate-300 transition hover:translate-x-1 hover:text-white"
                >
                  <span
                    aria-hidden="true"
                    className="text-cyan-400"
                  >
                    →
                  </span>

                  LinkedIn
                </a>

                <a
                  href="mailto:sabinohc@gmail.com"
                  className="flex w-fit items-center gap-2 text-slate-300 transition hover:translate-x-1 hover:text-white"
                >
                  <span
                    aria-hidden="true"
                    className="text-cyan-400"
                  >
                    →
                  </span>

                  Contato
                </a>

                <Link
                  href="/academy"
                  className="flex w-fit items-center gap-2 text-slate-300 transition hover:translate-x-1 hover:text-white"
                >
                  <span
                    aria-hidden="true"
                    className="text-cyan-400"
                  >
                    →
                  </span>

                  Cursos e formações
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-white/10 pt-8 text-center">
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-2 text-slate-400">
            <Link
              href="/#framework"
              className="transition hover:text-white"
            >
              Framework EDI
            </Link>

            <span aria-hidden="true">
              •
            </span>

            <Link
              href="/professor-digital"
              className="transition hover:text-white"
            >
              Professor Digital
            </Link>

            <span aria-hidden="true">
              •
            </span>

            <Link
              href="/agenda"
              className="transition hover:text-white"
            >
              Agenda Inteligente EDI
            </Link>

            <span aria-hidden="true">
              •
            </span>

            <Link
              href="/academy"
              className="transition hover:text-white"
            >
              EduData Academy
            </Link>
          </div>

          <p className="mt-4 text-sm text-slate-500">
            © 2026 EduData IA — Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}