import Image from 'next/image'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">

        <a href="/" className="flex items-center">
          <Image
            src="/logo-edudata-ia-header.png"
            alt="EduData IA"
            width={220}
            height={70}
            priority
            className="h-auto w-auto max-h-14"
          />
        </a>

        <nav className="hidden md:flex items-center gap-8 text-slate-700 font-medium">
          <a href="#framework" className="hover:text-[#0A3A5E] transition">
            Framework
          </a>

          <a href="#professor" className="hover:text-[#0A3A5E] transition">
            Professor Digital
          </a>

          <a href="#agenda" className="hover:text-[#0A3A5E] transition">
            Agenda EDI
          </a>

          <a href="#ecossistema" className="hover:text-[#0A3A5E] transition">
            Ecossistema
          </a>
        </nav>

        <a
          href="#participar"
          className="rounded-full bg-[#0A3A5E] px-6 py-3 text-white font-semibold hover:opacity-90 transition"
        >
          Participar
        </a>

      </div>
    </header>
  )
}