export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#050816] text-white">
      <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-6 lg:px-8">
        <a
          href="/"
          className="flex items-center"
          aria-label="EduData IA"
        >
          <img
            src="/logo-edudata-ia-header.png"
            alt="EduData IA"
            className="h-20 w-auto object-contain"
          />
        </a>

        <nav className="hidden items-center gap-10 text-sm font-semibold text-slate-200 lg:flex">
          <a href="#framework" className="transition hover:text-white">
            Framework
          </a>

          <a href="#ecossistema" className="transition hover:text-white">
            Ecossistema
          </a>

          <a href="#professor-digital" className="transition hover:text-white">
            Professor Digital
          </a>

          <a href="#agenda" className="transition hover:text-white">
            Agenda EDI
          </a>
        </nav>

        <a
          href="#comunidade"
          className="rounded-full bg-white px-8 py-4 text-base font-semibold text-[#050816] transition hover:bg-slate-100"
        >
          Comunidade
        </a>
      </div>
    </header>
  )
}