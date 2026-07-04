type ProfileCardProps = {
  eiosData?: any
}

export default function ProfileCard({ eiosData }: ProfileCardProps) {
  const profile =
    eiosData?.data?.profile?.teacher_profile ||
    eiosData?.profile?.teacher_profile

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
          <p className="text-xl font-semibold">
            {profile?.level || 'Inicial'}
          </p>
        </div>

        <div>
          <p className="text-sm text-slate-500">Score EDI</p>
          <p className="text-xl font-semibold">
            {profile?.edi_score ?? 0}%
          </p>
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