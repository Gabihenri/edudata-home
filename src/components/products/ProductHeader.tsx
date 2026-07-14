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
      <div className="mx-auto flex min-h-28 max-w-7xl flex-col gap-5 px-6 py-4 xl:flex-row xl:items-center xl:justify-between">
        <Link
          href="/"
          aria-label="Voltar para a página inicial da EduData IA"
          className="block shrink-0"
        >
          <div className="relative h-20 w-[300px] md:h-24 md:w-[380px]">
            <Image
              src={logoSrc}
              alt={logoAlt}
              fill
              priority
              sizes="(max-width: 768px) 300px, 380px"
              className="object-contain object-left"
            />
          </div>
        </Link>

        <div className="flex flex-wrap items-center gap-3 xl:justify-end">
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
                      ? 'rounded-full bg-white/15 px-4 py-2.5 text-sm font-semibold text-white'
                      : 'rounded-full px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white'
                  }
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          <Link
            href="/"
            className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Voltar para a Home
          </Link>

          <Link
            href={accessHref}
            className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            {accessLabel}
          </Link>
        </div>
      </div>
    </header>
  )
}