type ProfileCardProps = {
  eiosData?: any
}

export default function ProfileCard({ eiosData }: ProfileCardProps) {
  const profile =
    eiosData?.data?.teacher_profile ||
    eiosData?.teacher_profile ||
    {}

  return (
    <div className="rounded-3xl bg-white p-8 shadow-sm">

      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">
        Perfil Docente
      </p>

      <h2 className="mt-3 text-3xl font-bold text-[#081C2E]">
        Professor Digital
      </h2>

      <div className="mt-8 grid gap-5">

        <div>
          <p className="text-sm text-slate-500">
            Nível EDI
          </p>

          <p className="text-xl font-semibold">
            {profile.level ?? 'Inicial'}
          </p>
        </div>

        <div>
          <p className="text-sm text-slate-500">
            Score Geral
          </p>

          <p className="text-3xl font-bold text-cyan-700">
            {profile.edi_score ?? 0}%
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">

          <div>
            <p className="text-sm text-slate-500">
              Agenda
            </p>

            <p className="font-semibold">
              {profile.agenda_score ?? 0}%
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500">
              Evidências
            </p>

            <p className="font-semibold">
              {profile.evidence_score ?? 0}%
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500">
              Formações
            </p>

            <p className="font-semibold">
              {profile.training_score ?? 0}%
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500">
              Ações
            </p>

            <p className="font-semibold">
              {profile.action_score ?? 0}%
            </p>
          </div>

        </div>

        <div className="rounded-2xl bg-cyan-50 p-5">

          <p className="text-sm font-semibold text-cyan-800">
            Diagnóstico do EIOS
          </p>

          <p className="mt-3 leading-7 text-slate-700">
            {profile.summary ??
              'Aguardando processamento do perfil docente pelo EIOS.'}
          </p>

        </div>

      </div>

    </div>
  )
}