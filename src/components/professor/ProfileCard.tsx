export default function ProfileCard() {
  return (
    <div className="rounded-3xl bg-white p-8 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">
        Perfil Docente
      </p>

      <h2 className="mt-3 text-3xl font-bold text-[#081C2E]">
        Professor Digital
      </h2>

      <div className="mt-8 space-y-4">

        <div>
          <p className="text-sm text-slate-500">Nível EDI</p>
          <p className="text-xl font-semibold">Intermediário</p>
        </div>

        <div>
          <p className="text-sm text-slate-500">Maturidade Digital</p>
          <p className="text-xl font-semibold">74%</p>
        </div>

        <div>
          <p className="text-sm text-slate-500">Plano Atual</p>
          <p className="text-xl font-semibold">
            Desenvolvimento Profissional
          </p>
        </div>

      </div>
    </div>
  )
}