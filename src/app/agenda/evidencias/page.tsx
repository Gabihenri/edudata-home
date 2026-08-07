import Link from 'next/link'

import { AgendaPageShell } from '@/components/agenda/AgendaPageShell'

export const metadata = {
  title: 'Evidências | Agenda Inteligente EDI',
  description: 'Consulta, registro e inteligência de evidências pedagógicas em fluxos separados.',
}

export default function AgendaEvidenciasPage() {
  return (
    <AgendaPageShell
      eyebrow="Evidências pedagógicas"
      title="Evidências"
      description="Consulte, registre e analise evidências em experiências separadas. O registro permanece protegido pelas regras de privacidade, autorização e rastreabilidade do EIOS."
    >
      <div className="space-y-6">
        <section className="grid gap-4 lg:grid-cols-3">
          <Link
            href="/agenda/evidencias/registro"
            className="group rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50/40"
          >
            <p className="font-mono text-xs font-bold text-[#0B7491]">01</p>
            <h2 className="mt-5 text-xl font-bold text-[#071827]">Registrar evidência</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Abra o formulário somente quando houver uma nova evidência a registrar e mantenha o contexto pedagógico vinculado.
            </p>
            <span className="mt-5 block text-sm font-bold text-[#075F78] transition group-hover:translate-x-1">Abrir registro</span>
          </Link>

          <Link
            href="/agenda/evidencias/inteligencia"
            className="group rounded-[1.5rem] border border-cyan-200 bg-[#071827] p-6 text-white shadow-sm transition hover:bg-[#0B2638]"
          >
            <p className="font-mono text-xs font-bold text-cyan-300">02</p>
            <h2 className="mt-5 text-xl font-bold">Evidências Inteligentes</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Consulte qualidade, confiabilidade, classificações EDI, revisões humanas e histórico de processamento.
            </p>
            <span className="mt-5 block text-sm font-bold text-cyan-300 transition group-hover:translate-x-1">Abrir análise</span>
          </Link>

          <Link
            href="/agenda/historico"
            className="group rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50/40"
          >
            <p className="font-mono text-xs font-bold text-[#0B7491]">03</p>
            <h2 className="mt-5 text-xl font-bold text-[#071827]">Histórico e rastreabilidade</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Consulte versões, registros preservados e trilhas de auditoria sem misturar essa leitura com o cadastro.
            </p>
            <span className="mt-5 block text-sm font-bold text-[#075F78] transition group-hover:translate-x-1">Consultar histórico</span>
          </Link>
        </section>

        <aside className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5 text-sm leading-6 text-slate-700">
          Regra de UX da Agenda: consulta, registro e análise possuem responsabilidades distintas. Dados que já existem no contexto não devem ser digitados novamente.
        </aside>
      </div>
    </AgendaPageShell>
  )
}
