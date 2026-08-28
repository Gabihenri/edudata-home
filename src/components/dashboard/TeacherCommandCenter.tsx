'use client'

import Link from 'next/link'
import { useMemo } from 'react'

import { TeacherPerformanceSnapshotPanel } from '@/components/agenda/TeacherPerformanceSnapshotPanel'
import { TeacherScoreExplanationPanel } from '@/components/agenda/TeacherScoreExplanationPanel'
import {
  useTeacherCommandCenter,
  type TeacherCommandCenterStatus,
  type TeacherCommandCenterOperationalSummary,
} from '@/lib/agenda/hooks/useTeacherCommandCenter'
import type {
  TeacherSnapshotContext,
  TeacherSnapshotRole,
} from '@/lib/agenda/services/teacher-intelligence.service'

export type TeacherCommandCenterProps = {
  userName?: string | null
  role?: TeacherSnapshotRole
  teacherContext?: TeacherSnapshotContext
  autoLoad?: boolean
  className?: string
}

type StatusPresentation = {
  label: string
  description: string
  containerClassName: string
  markerClassName: string
}

type GuidedJourneyStage = {
  code: string
  title: string
  description: string
  href: string
  actionLabel: string
}

type GuidedJourney = {
  currentIndex: number
  completedCount: number
  recommendation: string
  recommendationDetail: string
  stages: GuidedJourneyStage[]
}

const STATUS_PRESENTATION: Record<TeacherCommandCenterStatus, StatusPresentation> = {
  idle: { label: 'Aguardando processamento', description: 'A inteligência docente será gerada a partir dos registros autorizados da Agenda.', containerClassName: 'border-slate-200 bg-slate-50 text-slate-700', markerClassName: 'bg-slate-400' },
  loading_agenda: { label: 'Carregando inteligência da Agenda', description: 'Recuperando os indicadores operacionais já processados pelo EIOS.', containerClassName: 'border-cyan-200 bg-cyan-50 text-[#075F78]', markerClassName: 'bg-cyan-600' },
  loading_snapshot: { label: 'Carregando ciclo operacional', description: 'Reunindo planejamentos, objetivos, aulas e evidências autorizadas.', containerClassName: 'border-cyan-200 bg-cyan-50 text-[#075F78]', markerClassName: 'bg-cyan-600' },
  processing: { label: 'Processando inteligência docente', description: 'Executando as capacidades da Educational Capability Platform.', containerClassName: 'border-blue-200 bg-blue-50 text-blue-800', markerClassName: 'bg-blue-600' },
  success: { label: 'Inteligência atualizada', description: 'O snapshot operacional está disponível para consulta.', containerClassName: 'border-emerald-200 bg-emerald-50 text-emerald-800', markerClassName: 'bg-emerald-600' },
  error: { label: 'Falha no processamento', description: 'Não foi possível concluir a inteligência docente neste momento.', containerClassName: 'border-red-200 bg-red-50 text-red-800', markerClassName: 'bg-red-600' },
  cancelled: { label: 'Processamento cancelado', description: 'A geração foi interrompida antes da conclusão.', containerClassName: 'border-amber-200 bg-amber-50 text-amber-900', markerClassName: 'bg-amber-500' },
}

const JOURNEY_STAGES: GuidedJourneyStage[] = [
  { code: '01', title: 'Planejar', description: 'Organize o que será desenvolvido com suas turmas.', href: '/agenda/planejamento', actionLabel: 'Planejar agora' },
  { code: '02', title: 'Executar e registrar', description: 'Realize a aula e registre o que aconteceu no Diário de Classe.', href: '/agenda/diario-classe', actionLabel: 'Registrar execução' },
  { code: '03', title: 'Evidenciar', description: 'Documente o que foi realizado com contexto e rastreabilidade.', href: '/agenda/evidencias', actionLabel: 'Adicionar evidência' },
  { code: '04', title: 'Analisar', description: 'Entenda os indicadores produzidos a partir dos seus registros.', href: '/agenda/indicadores', actionLabel: 'Analisar indicadores' },
  { code: '05', title: 'Agir', description: 'Use as leituras para acompanhar prioridades e tomar decisões pedagógicas.', href: '/agenda/casos', actionLabel: 'Abrir ações pedagógicas' },
]

function buildGuidedJourney(summary: TeacherCommandCenterOperationalSummary | null): GuidedJourney {
  const totalPlanning = summary?.totalPlanning ?? 0
  const totalLessons = summary?.totalLessons ?? 0
  const totalEvidences = summary?.totalEvidences ?? 0
  if (totalPlanning === 0) return { currentIndex: 0, completedCount: 0, recommendation: 'Comece pelo planejamento.', recommendationDetail: 'O planejamento cria a base para conectar execução, registros, evidências e leituras posteriores.', stages: JOURNEY_STAGES }
  if (totalLessons === 0) return { currentIndex: 1, completedCount: 1, recommendation: 'Seu planejamento já existe. Agora execute e registre a aula.', recommendationDetail: 'A execução transforma o planejamento em acompanhamento real. Use o Diário de Classe para registrar o que aconteceu.', stages: JOURNEY_STAGES }
  if (totalEvidences === 0) return { currentIndex: 2, completedCount: 2, recommendation: 'Você já iniciou o ciclo. Agora registre evidências do trabalho realizado.', recommendationDetail: 'As evidências ajudam a documentar a execução pedagógica e tornam a leitura posterior mais contextualizada.', stages: JOURNEY_STAGES }
  return { currentIndex: 3, completedCount: 3, recommendation: 'Seu ciclo já possui registros. Agora é hora de entender o que os dados mostram.', recommendationDetail: 'Analise seus indicadores, identifique pontos de atenção e transforme as leituras em próximas ações.', stages: JOURNEY_STAGES }
}

function normalizeText(value: string | null | undefined): string {
  return typeof value === 'string' ? value.trim() : ''
}

function formatDateTime(value: string | null): string {
  if (!value) return 'Ainda não atualizado'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Data não disponível'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date)
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'Bom dia'
  if (hour >= 12 && hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function getCurrentDateLabel(): string {
  const formattedDate = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(new Date())
  return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)
}

function ProgressPanel({ status, progress, stepLabel }: { status: TeacherCommandCenterStatus; progress: number; stepLabel: string | null }) {
  const presentation = STATUS_PRESENTATION[status]
  const normalizedProgress = Math.min(100, Math.max(0, Math.round(progress)))
  return <section aria-live="polite" aria-label="Estado da inteligência docente" className={`rounded-2xl border p-4 ${presentation.containerClassName}`}><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><span aria-hidden="true" className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${presentation.markerClassName}`} /><div><p className="text-sm font-bold">{stepLabel || presentation.label}</p><p className="mt-1 text-xs leading-5 opacity-80">{presentation.description}</p></div></div><span className="font-mono text-sm font-bold">{normalizedProgress}%</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-black/10"><div className="h-full rounded-full bg-current transition-[width] duration-300" style={{ width: `${normalizedProgress}%` }} /></div></section>
}

function GuidedJourneyPanel({ journey, summary }: { journey: GuidedJourney; summary: TeacherCommandCenterOperationalSummary | null }) {
  const currentStage = journey.stages[journey.currentIndex]
  const progress = Math.round((journey.completedCount / journey.stages.length) * 100)
  const records = summary?.totalRecords ?? 0
  return <section aria-labelledby="guided-journey-title" className="overflow-hidden rounded-[28px] border border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-slate-50 shadow-sm"><div className="border-b border-cyan-100 bg-white/80 px-5 py-5 sm:px-7"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#075F78]">Experiência Guiada EDI</p><h2 id="guided-journey-title" className="mt-1 text-xl font-bold tracking-tight text-[#071827] sm:text-2xl">Sua jornada está sendo acompanhada.</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">A recomendação abaixo é calculada a partir dos registros operacionais já existentes na sua Agenda.</p></div><div className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3"><p className="text-xs font-semibold text-cyan-800">Progresso do ciclo</p><p className="mt-1 text-2xl font-bold text-[#071827]">{progress}%</p><p className="mt-1 text-xs text-slate-600">{records} registros considerados</p></div></div></div><div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-5 sm:p-7">{journey.stages.map((stage, index) => { const completed = index < journey.currentIndex; const current = index === journey.currentIndex; return <Link key={stage.code} href={stage.href} className={`rounded-2xl border p-4 transition ${current ? 'border-cyan-400 bg-cyan-50 shadow-sm' : completed ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 bg-white hover:border-cyan-300'}`}><div className="flex items-center justify-between"><span className="font-mono text-xs font-bold tracking-[0.14em] text-cyan-700">{stage.code}</span><span className={`text-sm font-bold ${completed ? 'text-emerald-700' : current ? 'text-cyan-800' : 'text-slate-400'}`}>{completed ? 'Concluído' : current ? 'Agora' : 'Depois'}</span></div><h3 className="mt-5 text-lg font-bold text-slate-950">{stage.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{stage.description}</p></Link> })}</div><div className="mx-5 mb-5 rounded-2xl border border-cyan-200 bg-[#071827] p-5 text-white sm:mx-7 sm:mb-7"><p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">Próximo passo recomendado</p><div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><h3 className="text-xl font-bold">{journey.recommendation}</h3><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{journey.recommendationDetail}</p></div><Link href={currentStage.href} className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-[#071827] transition hover:bg-cyan-300">{currentStage.actionLabel}</Link></div></div></section>
}

function OperationalSummary({ totalPlanning, totalObjectives, totalLessons, totalEvidences }: { totalPlanning: number; totalObjectives: number; totalLessons: number; totalEvidences: number }) {
  const metrics = [
    { code: '01', label: 'Planejamentos', value: totalPlanning, href: '/agenda/planejamento' },
    { code: '02', label: 'Objetivos', value: totalObjectives, href: '/agenda/objetivos' },
    { code: '03', label: 'Aulas', value: totalLessons, href: '/agenda/aulas' },
    { code: '04', label: 'Evidências', value: totalEvidences, href: '/agenda/evidencias' },
  ]
  return <section aria-labelledby="teacher-command-center-records" className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm"><header className="border-b border-slate-100 px-5 py-5 sm:px-7"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">Base operacional</p><h2 id="teacher-command-center-records" className="mt-1 text-xl font-bold text-slate-950">Registros analisados</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Dados autorizados utilizados pelo EIOS para produzir o snapshot docente.</p></header><div className="grid gap-px bg-slate-200 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(metric => <Link key={metric.code} href={metric.href} className="group bg-white p-5 transition hover:bg-cyan-50/60 sm:p-6"><div className="flex items-start justify-between gap-4"><span className="font-mono text-xs font-bold tracking-[0.14em] text-cyan-700">{metric.code}</span><span aria-hidden="true" className="h-2.5 w-2.5 rotate-45 border border-cyan-500 transition group-hover:bg-cyan-500" /></div><p className="mt-6 text-3xl font-bold tracking-tight text-slate-950">{new Intl.NumberFormat('pt-BR').format(metric.value)}</p><p className="mt-2 text-sm font-semibold text-slate-700">{metric.label}</p><p className="mt-5 text-sm font-semibold text-cyan-800 transition group-hover:translate-x-1">Consultar módulo</p></Link>)}</div></section>
}

export default function TeacherCommandCenter({ userName = null, role = 'professor', teacherContext, autoLoad = true, className = '' }: TeacherCommandCenterProps) {
  const commandCenter = useTeacherCommandCenter({ autoLoad, role, teacherContext: { ...teacherContext, name: teacherContext?.name ?? userName } })
  const { snapshot, operationalSummary, status, currentStep, loading, refreshing, error, generatedAt, progress, load, reload, cancel } = commandCenter
  const normalizedUserName = normalizeText(snapshot?.teacher.name ?? teacherContext?.name ?? userName)
  const title = normalizedUserName ? `${getGreeting()}, ${normalizedUserName}.` : `${getGreeting()}.`
  const statusPresentation = STATUS_PRESENTATION[status]
  const stepLabel = currentStep?.label ?? null
  const isProcessing = loading || refreshing
  const summaryMetrics = useMemo(() => ({ totalPlanning: operationalSummary?.totalPlanning ?? 0, totalObjectives: operationalSummary?.totalObjectives ?? 0, totalLessons: operationalSummary?.totalLessons ?? 0, totalEvidences: operationalSummary?.totalEvidences ?? 0 }), [operationalSummary])
  const guidedJourney = useMemo(() => buildGuidedJourney(operationalSummary), [operationalSummary])
  const scoreDimensions = useMemo(() => snapshot ? [
    { label: 'Dashboard', score: snapshot.scores.dashboard, description: 'Síntese dos indicadores operacionais da Agenda.' },
    { label: 'Planejamento', score: snapshot.scores.planning, description: 'Cobertura, coerência e continuidade do ciclo.' },
    { label: 'Evidências', score: snapshot.scores.evidences, description: 'Conclusão, cobertura e integridade dos registros.' },
    { label: 'Tarefas', score: snapshot.scores.tasks, description: 'Prazos, prioridades e pendências operacionais.' },
    { label: 'Carga semanal', score: snapshot.scores.calendar, description: 'Distribuição, concentração e equilíbrio da agenda.' },
  ] : [], [snapshot])

  return <div className={`space-y-6 sm:space-y-8 ${className}`}><section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-5 sm:px-7 sm:py-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">Centro de Comando Docente</p><h2 className="mt-1 text-2xl font-bold tracking-tight text-[#071827] sm:text-3xl">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{getCurrentDateLabel()}</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => void reload()} disabled={isProcessing} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-60">{refreshing ? 'Atualizando...' : 'Atualizar dados'}</button>{isProcessing ? <button type="button" onClick={cancel} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100">Cancelar</button> : null}</div></div></div><div className="p-5 sm:p-7"><ProgressPanel status={status} progress={progress} stepLabel={stepLabel} />{error ? <div role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><p className="font-bold">{statusPresentation.label}</p><p className="mt-1 leading-6">{error}</p><button type="button" onClick={() => void load()} className="mt-3 font-bold underline underline-offset-4">Tentar novamente</button></div> : null}{generatedAt ? <p className="mt-4 text-xs text-slate-500">Última atualização: {formatDateTime(generatedAt)}</p> : null}</div></section><GuidedJourneyPanel journey={guidedJourney} summary={operationalSummary} /><OperationalSummary {...summaryMetrics} />{snapshot ? <><TeacherPerformanceSnapshotPanel snapshot={snapshot} /><TeacherScoreExplanationPanel overallScore={snapshot.summary.overall_score} dimensions={scoreDimensions} /></> : null}</div>
}
