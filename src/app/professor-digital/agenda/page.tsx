'use client'

import Link from 'next/link'
import { useMemo } from 'react'

import { useEvidences } from '@/lib/agenda/hooks/useEvidences'
import { useLessons } from '@/lib/agenda/hooks/useLessons'
import { useObjectives } from '@/lib/agenda/hooks/useObjectives'
import { usePlanning } from '@/lib/agenda/hooks/usePlanning'

const nuclei = [
  {
    code: '01',
    eyebrow: 'Autoanálise profissional',
    title: 'Minha Atuação',
    description:
      'Observe sua trajetória a partir de registros autorizados e reflita sobre os padrões que você reconhece na própria prática.',
    question:
      'O que a distribuição das minhas ações recentes me ajuda a compreender sobre minha atuação?',
  },
  {
    code: '02',
    eyebrow: 'Mapa de conhecimento',
    title: 'Meu Conhecimento',
    description:
      'Construa uma visão dos temas, interesses e experiências que deseja aprofundar ao longo da sua trajetória.',
    question:
      'Que conhecimentos aparecem com mais força na minha prática e quais quero desenvolver agora?',
  },
  {
    code: '03',
    eyebrow: 'Memória profissional',
    title: 'Minha Produção',
    description:
      'Transforme registros autorizados em uma memória profissional que ajude a reconhecer continuidades, experiências e projetos em desenvolvimento.',
    question:
      'O que a minha produção recente revela sobre os projetos e ideias que estão ganhando continuidade?',
  },
  {
    code: '04',
    eyebrow: 'Desenvolvimento escolhido',
    title: 'Meu Desenvolvimento',
    description:
      'Conecte objetivos e interesses às possibilidades de aprofundamento identificadas pelo EIOS e pela EduData Academy.',
    question:
      'Que próximo passo faz sentido para os objetivos profissionais que escolhi desenvolver?',
  },
]

function Metric({ label, value, description }: { label: string; value: number; description: string }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B7491]">{label}</p>
      <p className="mt-3 text-3xl font-bold tracking-tight text-[#071827]">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </article>
  )
}

export default function ProfessorDigitalWorkspacePage() {
  const { planning, loading: planningLoading, error: planningError } = usePlanning()
  const { objectives, loading: objectivesLoading, error: objectivesError } = useObjectives()
  const { lessons, loading: lessonsLoading, error: lessonsError } = useLessons()
  const { evidences, loading: evidencesLoading, error: evidencesError } = useEvidences()

  const loading = planningLoading || objectivesLoading || lessonsLoading || evidencesLoading
  const hasError = Boolean(planningError || objectivesError || lessonsError || evidencesError)

  const summary = useMemo(() => {
    const completedLessons = lessons.filter(
      lesson => lesson.status === 'realizada' || lesson.status === 'parcialmente_realizada',
    )

    const activeObjectives = objectives.filter(
      objective => objective.status === 'ativo' || objective.status === 'em_acompanhamento',
    )

    return {
      completedLessons: completedLessons.length,
      activeObjectives: activeObjectives.length,
      evidences: evidences.length,
      planning: planning.length,
    }
  }, [evidences.length, lessons, objectives, planning.length])

  const reflection = useMemo(() => {
    if (summary.planning === 0 && summary.completedLessons === 0) {
      return {
        title: 'Sua trajetória profissional ainda está começando a ganhar registros.',
        description:
          'Quando você decidir registrar sua prática na Agenda Inteligente EDI, poderá autorizar o Professor Digital a usar esses dados como contexto para suas próprias reflexões.',
        actionLabel: 'Conhecer a Agenda Inteligente EDI',
        href: '/agenda',
      }
    }

    if (summary.evidences === 0 && summary.completedLessons > 0) {
      return {
        title: 'Há experiências realizadas que ainda podem ganhar memória profissional.',
        description:
          'Você pode decidir quais registros e evidências representam melhor sua trajetória. O Professor Digital não interpreta dados que você não autorizou.',
        actionLabel: 'Revisar registros autorizados',
        href: '/agenda/evidencias',
      }
    }

    if (summary.activeObjectives > 0) {
      return {
        title: 'Seus objetivos profissionais e sua prática já oferecem pontos para reflexão.',
        description:
          'Observe o que foi produzido, o que se repetiu e o que você deseja aprofundar. A leitura final continua sendo sua.',
        actionLabel: 'Explorar possibilidades de desenvolvimento',
        href: '/professor-digital/plano',
      }
    }

    return {
      title: 'Sua trajetória já possui registros que podem sustentar uma reflexão.',
      description:
        'O próximo passo é transformar a memória do trabalho em perguntas sobre continuidade, conhecimento e desenvolvimento profissional.',
      actionLabel: 'Ver recomendações contextuais',
      href: '/professor-digital/recomendacoes',
    }
  }, [summary])

  return (
    <main className="min-h-screen bg-[#EEF3F7] text-[#071827]">
      <section className="relative overflow-hidden bg-[#071827] text-white">
        <div aria-hidden="true" className="absolute -right-24 top-8 h-72 w-72 rounded-full border border-cyan-300/10" />
        <div aria-hidden="true" className="absolute right-20 top-32 h-40 w-40 rounded-full border border-cyan-300/10" />

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">Professor Digital · Beta</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl">
            Seu espaço de autoanálise e inteligência profissional.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
            Aqui, a EduData IA não organiza sua agenda. Ela ajuda você a observar o que a sua própria trajetória pode revelar sobre atuação, produção, conhecimento e possibilidades de desenvolvimento.
          </p>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">Minha trajetória agora</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">Um retrato inicial a partir dos dados disponíveis.</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-600">
              Estes números são contexto, não avaliação. Eles representam apenas registros disponíveis e autorizados para leitura no ecossistema.
            </p>
          </div>

          {loading ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
              Atualizando os dados que podem compor sua visão profissional…
            </div>
          ) : hasError ? (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950 shadow-sm">
              Ainda não foi possível carregar todos os registros. Você pode continuar navegando, e a leitura será atualizada quando os dados estiverem disponíveis.
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Planejamentos" value={summary.planning} description="Contextos registrados na Agenda Inteligente EDI." />
              <Metric label="Aulas realizadas" value={summary.completedLessons} description="Experiências registradas como realizadas ou parcialmente realizadas." />
              <Metric label="Objetivos ativos" value={summary.activeObjectives} description="Objetivos que ainda fazem parte do ciclo acompanhado." />
              <Metric label="Evidências" value={summary.evidences} description="Registros que podem ajudar a construir memória profissional." />
            </div>
          )}

          <div className="mt-8 rounded-3xl border border-cyan-200 bg-cyan-50/70 p-6 shadow-sm sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">Uma leitura para começar</p>
            <h2 className="mt-3 max-w-3xl text-2xl font-bold tracking-tight sm:text-3xl">{reflection.title}</h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">{reflection.description}</p>
            <Link
              href={reflection.href}
              className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-[#0B7491] px-6 py-3 font-semibold text-white transition hover:bg-[#09657E] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
            >
              {reflection.actionLabel}
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0B7491]">Os quatro núcleos do Professor Digital</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Quatro perspectivas sobre uma mesma trajetória.</h2>
            <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
              A experiência está sendo liberada progressivamente. O objetivo é construir utilidade real antes de automatizar interpretações mais complexas.
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {nuclei.map(item => (
              <article key={item.code} className="relative overflow-hidden rounded-3xl border border-slate-200 bg-[#F8FAFC] p-6 shadow-sm">
                <div aria-hidden="true" className="absolute left-0 top-0 h-full w-1 bg-[#0B7491]" />
                <div className="flex items-start justify-between gap-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">{item.eyebrow}</p>
                  <span className="font-mono text-xs font-bold text-slate-400">{item.code}</span>
                </div>
                <h3 className="mt-3 text-2xl font-bold">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#0B7491]">Pergunta para reflexão</p>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-700">“{item.question}”</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">Desenvolvimento</p>
            <h2 className="mt-3 text-2xl font-bold">O EIOS sugere possibilidades. Você escolhe.</h2>
            <p className="mt-4 leading-7 text-slate-600">
              Seus interesses, objetivos e registros autorizados podem ajudar a identificar caminhos de aprofundamento. Nenhuma sugestão é uma determinação sobre sua competência ou carreira.
            </p>
            <Link href="/professor-digital/plano" className="mt-6 inline-flex font-semibold text-[#0B7491] hover:underline">
              Explorar meu desenvolvimento →
            </Link>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">Memória e contexto</p>
            <h2 className="mt-3 text-2xl font-bold">A Agenda organiza. Você decide o que sua trajetória significa.</h2>
            <p className="mt-4 leading-7 text-slate-600">
              O Professor Digital não substitui a rotina operacional. Ele usa apenas os contextos que você autoriza para apoiar reflexão e desenvolvimento profissional.
            </p>
            <Link href="/agenda" className="mt-6 inline-flex font-semibold text-[#0B7491] hover:underline">
              Abrir Agenda Inteligente EDI →
            </Link>
          </article>
        </div>
      </section>
    </main>
  )
}
