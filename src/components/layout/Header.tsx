import Link from 'next/link'

const desktopNavigation = [
  {
    label: 'Framework',
    href: '/#framework',
  },
  {
    label: 'Ecossistema',
    href: '/#ecossistema',
  },
  {
    label: 'Professor Digital',
    href: '/professor-digital',
  },
  {
    label: 'Agenda EDI',
    href: '/agenda',
  },
]

const mobileProductNavigation = [
  {
    label: 'Professor Digital',
    href: '/professor-digital',
  },
  {
    label: 'Agenda Inteligente EDI',
    href: '/agenda',
  },
]

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#050816] text-white">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <Link
            href="/"
            aria-label="Ir para a página inicial da EduData IA"
            className="flex min-w-0 items-center"
          >
            <img
              src="/logo-edudata-ia-header.png"
              alt="EduData IA"
              className="h-14 w-auto max-w-[155px] object-contain sm:h-16 sm:max-w-[220px] lg:h-20 lg:max-w-none"
            />
          </Link>

          <nav
            aria-label="Navegação principal"
            className="hidden items-center gap-7 text-sm font-semibold text-slate-200 lg:flex"
          >
            {desktopNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="inline-flex rounded-full border border-white/25 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10 sm:px-5 sm:py-3 sm:text-sm"
            >
              Entrar
            </Link>

            <Link
              href="/academy#courses"
              className="inline-flex rounded-full bg-white px-3 py-2 text-xs font-semibold text-[#050816] transition hover:bg-slate-100 sm:px-5 sm:py-3 sm:text-sm"
            >
              Inscrever-se
            </Link>
          </div>
        </div>

        <nav
          aria-label="Produtos EduData IA"
          className="mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-4 lg:hidden"
        >
          {mobileProductNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-xs font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white sm:text-sm"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}