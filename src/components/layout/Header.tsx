export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <strong className="text-lg tracking-tight text-[#0A3A5E]">
          EduData IA
        </strong>

        <nav className="hidden gap-6 text-sm font-medium text-slate-700 md:flex">
          <a href="#framework">Framework EDI</a>
          <a href="#professor">Professor Digital</a>
          <a href="#agenda">Agenda Inteligente</a>
          <a href="#inclusao">Inclusão</a>
          <a href="#ecossistema">Ecossistema</a>
        </nav>

        <a
          href="#participacao"
          className="rounded-full bg-[#0A3A5E] px-4 py-2 text-sm font-semibold text-white"
        >
          Participar
        </a>
      </div>
    </header>
  );
}
