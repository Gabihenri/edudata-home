'use client'

import Link from 'next/link'
import {
  useMemo,
} from 'react'

import {
  useEvidences,
} from '@/lib/agenda/hooks/useEvidences'

import {
  useLessons,
} from '@/lib/agenda/hooks/useLessons'

import {
  useObjectives,
} from '@/lib/agenda/hooks/useObjectives'

import {
  usePlanning,
} from '@/lib/agenda/hooks/usePlanning'

type NextStep = {
  eyebrow: string
  title: string
  description: string
  href: string
  actionLabel: string
  stage: string
}

export function ProfessorDigitalNextStep() {
  const {
    planning,
    loading:
      planningLoading,
    error:
      planningError,
  } = usePlanning()

  const {
    objectives,
    loading:
      objectivesLoading,
    error:
      objectivesError,
  } = useObjectives()

  const {
    lessons,
    loading:
      lessonsLoading,
    error:
      lessonsError,
  } = useLessons()

  const {
    evidences,
    loading:
      evidencesLoading,
    error:
      evidencesError,
  } = useEvidences()

  const loading =
    planningLoading ||
    objectivesLoading ||
    lessonsLoading ||
    evidencesLoading

  const hasError =
    Boolean(
      planningError ||
      objectivesError ||
      lessonsError ||
      evidencesError,
    )

  const activeObjectives =
    useMemo(
      () =>
        objectives.filter(
          objective =>
            objective.status ===
              'ativo' ||
            objective.status ===
              'em_acompanhamento',
        ),
      [
        objectives,
      ],
    )

  const completedLessons =
    useMemo(
      () =>
        lessons.filter(
          lesson =>
            lesson.status ===
              'realizada' ||
            lesson.status ===
              'parcialmente_realizada',
        ),
      [
        lessons,
      ],
    )

  const nextStep =
    useMemo<NextStep>(
      () => {
        if (
          planning.length ===
          0
        ) {
          return {
            eyebrow:
              'Início do ciclo',

            title:
              'Crie seu primeiro planejamento',

            description:
              'Estruture o que será desenvolvido, defina a turma, a disciplina e o período previsto para iniciar o ciclo pedagógico.',

            href:
              '/agenda/planejamento',

            actionLabel:
              'Criar planejamento',

            stage:
              'Planejamento',
          }
        }

        if (
          activeObjectives.length ===
          0
        ) {
          return {
            eyebrow:
              'Próximo passo recomendado',

            title:
              'Defina um objetivo pedagógico',

            description:
              `Você já possui ${planning.length} ${
                planning.length === 1
                  ? 'planejamento registrado'
                  : 'planejamentos registrados'
              }, mas ainda não há objetivos ativos. Crie um objetivo para orientar aulas, evidências e indicadores.`,

            href:
              '/agenda/objetivos',

            actionLabel:
              'Criar objetivo',

            stage:
              'Objetivos',
          }
        }

        if (
          lessons.length ===
          0
        ) {
          return {
            eyebrow:
              'Transformar intenção em ação',

            title:
              'Registre a primeira aula',

            description:
              'Seus planejamentos e objetivos já fornecem direção. Agora registre uma aula para iniciar a execução pedagógica.',

            href:
              '/agenda/aulas',

            actionLabel:
              'Registrar aula',

            stage:
              'Aulas',
          }
        }

        if (
          completedLessons.length ===
          0
        ) {
          return {
            eyebrow:
              'Acompanhamento da execução',

            title:
              'Atualize a situação das aulas',

            description:
              `Existem ${lessons.length} ${
                lessons.length === 1
                  ? 'aula registrada'
                  : 'aulas registradas'
              }, mas nenhuma está marcada como realizada. Atualize o status para alimentar os indicadores.`,

            href:
              '/agenda/aulas',

            actionLabel:
              'Atualizar aulas',

            stage:
              'Execução',
          }
        }

        if (
          evidences.length ===
          0
        ) {
          return {
            eyebrow:
              'Documentação pedagógica',

            title:
              'Registre uma evidência',

            description:
              'Há aulas realizadas, mas ainda não existem evidências registradas. Documente a prática para completar o ciclo operacional.',

            href:
              '/agenda/evidencias',

            actionLabel:
              'Registrar evidência',

            stage:
              'Evidências',
          }
        }

        return {
          eyebrow:
            'Ciclo pedagógico ativo',

          title:
            'Acompanhe os indicadores e recomendações',

          description:
            'Planejamentos, objetivos, aulas e evidências já alimentam o EIOS. Consulte o Dashboard para acompanhar pendências e próximos passos.',

          href:
            '/agenda/dashboard',

          actionLabel:
            'Abrir Dashboard',

          stage:
            'Inteligência',
        }
      },
      [
        activeObjectives.length,
        completedLessons.length,
        evidences.length,
        lessons.length,
        planning.length,
      ],
    )

  if (loading) {
    return (
      <section className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-700">
          Orientação operacional
        </p>

        <p className="mt-4 text-lg font-semibold text-slate-700">
          Analisando o ciclo pedagógico...
        </p>
      </section>
    )
  }

  if (hasError) {
    return (
      <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-7">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-800">
          Orientação temporariamente indisponível
        </p>

        <p className="mt-4 leading-7 text-amber-950">
          Não foi possível analisar todos os registros da Agenda neste momento.
          Os módulos continuam disponíveis para acesso manual.
        </p>

        <Link
          href="/agenda/dashboard"
          className="mt-6 inline-flex rounded-full bg-amber-900 px-6 py-3 font-semibold text-white"
        >
          Abrir Agenda EDI
        </Link>
      </section>
    )
  }

  return (
    <section
      aria-labelledby="professor-digital-next-step"
      className="overflow-hidden rounded-[2rem] border border-cyan-900/10 bg-white shadow-sm"
    >
      <div className="grid lg:grid-cols-[1fr_220px]">
        <div className="p-7 sm:p-9">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-cyan-700">
            {nextStep.eyebrow}
          </p>

          <h2
            id="professor-digital-next-step"
            className="mt-4 text-3xl font-bold tracking-tight text-[#081C2E]"
          >
            {nextStep.title}
          </h2>

          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            {nextStep.description}
          </p>

          <Link
            href={nextStep.href}
            className="mt-7 inline-flex rounded-full bg-[#0A3A5E] px-7 py-4 font-semibold text-white transition hover:opacity-90"
          >
            {nextStep.actionLabel}
          </Link>
        </div>

        <div className="flex min-h-40 flex-col justify-between border-t border-cyan-900/10 bg-[#081C2E] p-7 text-white lg:border-l lg:border-t-0">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">
            Etapa atual
          </p>

          <p className="mt-5 text-2xl font-bold">
            {nextStep.stage}
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-300">
            Ciclo EDI orientado por evidências
          </p>
        </div>
      </div>
    </section>
  )
}