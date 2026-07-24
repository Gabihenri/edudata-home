'use client'

import {
  AgendaPageShell,
} from '@/components/agenda/AgendaPageShell'

import {
  PlanningTrashPanel,
} from '@/components/agenda/PlanningTrashPanel'

import {
  usePlanning,
} from '@/lib/agenda/hooks/usePlanning'

export default function PlanningTrashPage() {
  const {
    deletedPlanning,
    deletedLoading,
    deletedError,
    mutating,

    reloadDeleted,
    restorePlanning,
  } = usePlanning()

  return (
    <AgendaPageShell
      eyebrow="Governança dos registros"
      title="Lixeira de planejamentos"
      description="Consulte planejamentos excluídos logicamente e restaure registros mediante justificativa auditável."
    >
      <div className="space-y-6 sm:space-y-8">
        <section className="rounded-[1.5rem] border border-cyan-200 bg-cyan-50 p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#075F78]">
            Preservação e rastreabilidade
          </p>

          <h2 className="mt-2 text-xl font-bold text-[#071827]">
            Nenhum registro é apagado fisicamente
          </h2>

          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-700">
            Os planejamentos excluídos permanecem preservados com data,
            responsável e justificativa. A restauração também exige motivo
            e mantém o histórico de auditoria.
          </p>
        </section>

        <PlanningTrashPanel
          records={
            deletedPlanning
          }
          loading={
            deletedLoading
          }
          error={
            deletedError
          }
          disabled={
            mutating
          }
          onReload={
            reloadDeleted
          }
          onRestore={
            restorePlanning
          }
        />
      </div>
    </AgendaPageShell>
  )
}