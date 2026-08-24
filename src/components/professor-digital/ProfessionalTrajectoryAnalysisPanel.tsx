'use client'

import type {
  ProfessionalTrajectoryAnalysis,
} from '@/lib/professor-digital/services/professorDigitalIntelligence.service'

type ProfessionalTrajectoryAnalysisPanelProps = {
  analysis: ProfessionalTrajectoryAnalysis | null
  loading: boolean
  error: string | null
  onAnalyze: () => void
  disabled?: boolean
}

export function ProfessionalTrajectoryAnalysisPanel({
  analysis,
  loading,
  error,
  onAnalyze,
  disabled = false,
}: ProfessionalTrajectoryAnalysisPanelProps) {
  return (
    <section className="rounded-3xl border border-cyan-100 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
            Leitura pelo EIOS
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#071827] sm:text-3xl">
            O que sua trajetória pode ajudar você a compreender?
          </h2>
          <p className="mt-3 leading-7 text-slate-600">
            O EIOS organiza conexões entre os dados que você autorizou para oferecer uma
            leitura inicial. O resultado não é uma avaliação: você pode reconhecer, corrigir
            ou simplesmente discordar das conexões apresentadas.
          </p>
        </div>

        <button
          type="button"
          onClick={onAnalyze}
          disabled={disabled || loading}
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#0B7491] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#09657E] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'O EIOS está analisando…' : analysis ? 'Atualizar minha leitura' : 'Analisar minha trajetória'}
        </button>
      </div>

      {disabled ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
          Para iniciar uma leitura, aguarde o carregamento dos registros que você autorizou
          ou organize primeiro seu contexto profissional.
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
          {error}
        </div>
      ) : null}

      {analysis ? (
        <div className="mt-8 space-y-6">
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B7491]">
              Síntese inicial
            </p>
            <p className="mt-3 text-base leading-7 text-slate-700">{analysis.summary}</p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Temas que apareceram
              </p>
              {analysis.recurringThemes.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {analysis.recurringThemes.map(theme => (
                    <span
                      key={theme}
                      className="rounded-full bg-[#EEF7FA] px-3 py-1.5 text-sm font-medium text-[#0B7491]"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Ainda não há temas suficientes para indicar conexões recorrentes.
                </p>
              )}
            </article>

            <article className="rounded-2xl border border-slate-200 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Memória disponível
              </p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-[#071827]">
                {analysis.historyCount}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                registros autorizados considerados nesta leitura inicial.
              </p>
            </article>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Perguntas para sua reflexão
              </p>
              <div className="mt-4 space-y-3">
                {analysis.reflectiveQuestions.map(question => (
                  <p key={question} className="rounded-xl bg-[#F8FAFC] p-4 text-sm leading-6 text-slate-700">
                    {question}
                  </p>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-slate-200 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Possibilidades para você escolher
              </p>
              <div className="mt-4 space-y-3">
                {analysis.developmentPossibilities.map(possibility => (
                  <p key={possibility} className="rounded-xl bg-[#F8FAFC] p-4 text-sm leading-6 text-slate-700">
                    {possibility}
                  </p>
                ))}
              </div>
            </article>
          </div>

          <p className="border-t border-slate-100 pt-5 text-xs leading-5 text-slate-500">
            Esta leitura não gera nota, perfil psicológico ou avaliação institucional. As conexões
            são hipóteses de reflexão e a interpretação continua sob seu controle.
          </p>
        </div>
      ) : null}
    </section>
  )
}
