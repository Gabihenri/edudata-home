import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-[#081C2E] px-6 py-16 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <Image
              src="/logo-edudata-ia-footer.png"
              alt="EduData IA"
              width={260}
              height={90}
              className="h-auto w-auto max-h-24"
            />

            <p className="mt-6 max-w-2xl text-slate-300">
              Transformando dados educacionais em decisões inteligentes.
            </p>
          </div>

          <div className="text-sm uppercase tracking-[0.25em] text-slate-400">
            Evidências • Inclusão • Inteligência
          </div>
        </div>
      </div>
    </footer>
  )
}
