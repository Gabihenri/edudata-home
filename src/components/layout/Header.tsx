export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

        <img
          src="/logo-edudata-ia-principal.png"
          alt="EduData IA"
          className="h-16 w-auto"
        />

        <a
          href="#participar"
          className="rounded-full bg-[#0A3A5E] px-8 py-4 font-semibold text-white hover:opacity-90 transition"
        >
          Participar
        </a>

      </div>
    </header>
  )
}