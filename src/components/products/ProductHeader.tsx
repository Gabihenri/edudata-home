import Image from 'next/image'
import Link from 'next/link'

type ProductHeaderProps = {
  logoSrc: string
  logoAlt: string
  productName: string
  accessHref: string
  accessLabel?: string
}

const productLinks = [
  {
    label: 'Professor Digital',
    href: '/professor-digital',
  },
  {
    label: 'Agenda Inteligente EDI',
    href: '/agenda',
  },
]

export function ProductHeader({
  logoSrc,
  logoAlt,
  productName,
  accessHref,
  accessLabel = 'Acessar plataforma',
}: ProductHeaderProps) {
  return (
    <header className="border-b border-white/10 bg-[#081C2E] text-white">
      <div className="mx-auto flex min-h-24 max-w-7xl flex-col gap-5 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
        <Link
          href="/"
          aria-label="Voltar para a página inicial da EduData IA"
          className="flex w-fit items-center"
        >
          <Image
            src={logoSrc}
            alt={logoAlt}
            width={420}
            height={120}
            priority
            className="h-16 w-auto max-w-[260px] object-contain md:h-20 md:max-w-[340px]"
          />
        </Link>

        <div className="flex flex-col gap-4 lg:items-end">
          <nav
            aria-label="Navegação entre produtos"
            className="flex flex-wrap items-center gap-2"
          >
            {productLinks.map((link) => {
              const isCurrentProduct = link.label === productName

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isCurrentProduct ? 'page' : undefined}
                  className={
                    isCurrentProduct
                      ? 'rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white'
                      : 'rounded-full px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white'
                  }
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Voltar para a Home
            </Link>

            <Link
              href={accessHref}
              className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              {accessLabel}
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}