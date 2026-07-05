export default function AdminHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex h-20 items-center justify-between px-6 lg:px-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-700">
            BackOffice EIOS
          </p>

          <h1 className="text-xl font-bold text-[#081C2E]">
            EduData IA Platform
          </h1>
        </div>

        <div className="rounded-full bg-[#081C2E] px-5 py-2 text-sm font-semibold text-white">
          Admin
        </div>
      </div>
    </header>
  )
}
