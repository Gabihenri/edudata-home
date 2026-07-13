import Image from 'next/image'
import Link from 'next/link'

type ProductHeaderProps = {
  logoSrc: string
  logoAlt: string
  productName: string
  accessHref: string
  accessLabel?: string
}

export function ProductHeader({
  logoSrc,
  logoAlt,
  productName,
  accessHref,
  accessLabel = 'Acessar plataforma',
}: ProductHeaderProps) {
  return (
    <header className="border-b border-white/10 bg-[#081C2E] text-white">
      <div className="mx-auto flex min-h-24 max-w-7xl flex-wrap items-center justify-between gap-6 px-6 py-4">
        <Link
          href="/"
          aria-label="Voltar para a página inicial da EduData IA"
          className="flex items-center"
        >
          <Image
            src={logoSrc}
            alt={logoAlt}
            width={420}
            height={120}
            priority
            className="h-16 w-auto object-contain md:h-20"
          />
        </Link>

        <div className="flex flex-wrap items-center gap-4">
          <p className="hidden text-sm font-semibold text-slate-300 md:block">
            {productName}
          </p>

          <Link
            href="/"
            className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Voltar para a Home
          </Link>

          <Link
            href={accessHref}
            className="rounded-full bg-[#5C1A8C] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            {accessLabel}
          </Link>
        </div>
      </div>
    </header>
  )
}