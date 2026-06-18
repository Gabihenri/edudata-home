export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-gradient-to-br from-[#F5F6F8] via-white to-[#E8EEF4] backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <a href="/" className="flex items-center">
          <img
            src="/logo-edudata-ia-principal.png"
            alt="EduData IA"
            className="h-32 w-auto md:h-36"
          />
        </a>

        <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-700 md:flex">
          <a href="#framework" className="hover:text-[#0A3A5E]">
            Framework
          </a>
          <a href="#professor" className="hover:text-[#0A3A5E]">
            Professor Digital
          </a>
          <a href="#agenda" className="hover:text-[#5C1A8C]">
            Agenda EDI
          </a>
          <a href="#ecossistema" className="hover:text-[#1B6B3A]">
            Ecossistema
          </a>
        </nav>

        <a
          href="#participar"
          className="rounded-full bg-[#0A3A5E] px-8 py-4 font-semibold text-white shadow-sm transition hover:opacity-90"
        >
          Participar
        </a>
      </div>
    </header>
  )
}