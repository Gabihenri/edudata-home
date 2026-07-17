import Image from 'next/image'
import Link from 'next/link'

type ProductHeaderProps = {
  logoSrc: string
  logoAlt: string
  productName: string
  accessHref: string
  accessLabel?: string
}

type ProductLink = {
  label: string
  href: string
}

const productLinks:
  ProductLink[] = [
    {
      label:
        'Professor Digital',

      href:
        '/professor-digital',
    },
    {
      label:
        'Agenda Inteligente EDI',

      href:
        '/agenda',
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
    <header className="border-b border-white/10 bg-[#071827] text-white">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/"
              aria-label="Voltar para a página inicial da EduData IA"
              className="inline-flex min-w-0 items-center"
            >
              <Image
                src={logoSrc}
                alt={logoAlt}
                width={320}
                height={128}
                priority
                className="h-auto w-[160px] object-contain object-left sm:w-[190px] lg:w-[220px]"
              />
            </Link>

            <div className="shrink-0 text-right lg:hidden">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-300">
                Produto EIOS
              </p>

              <p className="mt-1 text-xs text-slate-400">
                EduData IA
              </p>
            </div>
          </div>

          <div className="grid gap-3 lg:flex lg:items-center lg:justify-end">
            <nav
              aria-label="Navegação entre produtos"
              className="grid grid-cols-2 gap-2"
            >
              {productLinks.map(
                (link) => {
                  const isCurrentProduct =
                    link.label ===
                    productName

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      aria-current={
                        isCurrentProduct
                          ? 'page'
                          : undefined
                      }
                      className={`inline-flex min-h-12 items-center justify-center rounded-xl border px-3 py-3 text-center text-sm font-semibold leading-5 transition sm:px-5 ${
                        isCurrentProduct
                          ? 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100'
                          : 'border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {link.label}
                    </Link>
                  )
                },
              )}
            </nav>

            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 bg-white/[0.04] px-3 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10 sm:px-5"
              >
                Voltar à Home
              </Link>

              <Link
                href={accessHref}
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#0B7491] px-3 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#09657E] sm:px-5"
              >
                {accessLabel}
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/10 pt-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-300">
              Produto especializado
            </p>

            <p className="mt-1 text-sm font-semibold text-white">
              {productName}
            </p>
          </div>

          <div className="hidden text-right sm:block">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
              Arquitetura
            </p>

            <p className="mt-1 text-xs text-slate-300">
              Framework EDI → EIOS → Produto
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}