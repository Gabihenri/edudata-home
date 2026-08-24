'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type ProfileContext = {
  area: string
  stage: string
  experience: string
  interests: string[]
  developmentGoal: string
}

type DevelopmentAxis = {
  title: string
  description: string
  action: string
}

const profileContextKey = 'edudata-professor-digital-profile-context'
const developmentFocusKey = 'edudata-professor-digital-development-focus'

const interestPaths: Record<string, DevelopmentAxis> = {
  'Prática pedagógica': {
    title: 'Aprofundar a prática pedagógica',
    description:
      'Transforme experiências recentes em perguntas sobre escolhas didáticas, continuidades e possibilidades de experimentação.',
    action: 'Observar a prática e registrar o que deseja aprofundar',
  },
  'Tecnologias educacionais': {
    title: 'Explorar tecnologias com intencionalidade pedagógica',
    description:
      'Relacione recursos digitais a problemas reais da sua atuação, evitando que a ferramenta substitua o objetivo educacional.',
    action: 'Definir uma questão pedagógica que deseja investigar com tecnologia',
  },
  'Avaliação e evidências': {
    title: 'Aprofundar a leitura de evidências',
    description:
      'Observe quais registros ajudam você a compreender processos de aprendizagem e quais ainda precisam ganhar significado.',
    action: 'Selecionar evidências que merecem ser revisadas ou contextualizadas',
  },
  'Inclusão e acessibilidade': {
    title: 'Ampliar repertórios de inclusão e acessibilidade',
    description:
      'Identifique situações da sua prática que pedem novas estratégias, recursos ou conhecimentos para ampliar a participação.',
    action: 'Escolher uma situação concreta para orientar seu próximo aprofundamento',
  },
  'Gestão e liderança': {
    title: 'Desenvolver atuação colaborativa e liderança',
    description:
      'Observe como sua trajetória se conecta a projetos, pessoas e processos coletivos e quais competências deseja fortalecer.',
    action: 'Definir um desafio profissional que deseja conduzir ou compreender melhor',
  },
  'Pesquisa e inovação': {
    title: 'Transformar a prática em investigação',
    description:
      'Conecte experiências recorrentes a perguntas de pesquisa, documentação e projetos que possam gerar novos conhecimentos.',
    action: 'Formular uma pergunta que mereça ser investigada ao longo da sua trajetória',
  },
}

function buildAxes(profile: ProfileContext | null): DevelopmentAxis[] {
  const axes = profile?.interests
    .map(interest => interestPaths[interest])
    .filter((axis): axis is DevelopmentAxis => Boolean(axis)) ?? []

  if (profile?.developmentGoal.trim()) {
    axes.unshift({
      title: 'Desenvolver o objetivo que você declarou',
      description: `Você indicou como foco: “${profile.developmentGoal.trim()}”. O EIOS pode usar essa intenção como ponto de partida para organizar perguntas, conexões e possibilidades, sem decidir por você qual caminho seguir.`,
      action: 'Transformar esse objetivo em uma pergunta de desenvolvimento',
    })
  }

  if (axes.length === 0) {
    axes.push(
      {
        title: 'Começar por uma questão profissional',
        description:
          'Escolha uma situação, tema ou desafio que você deseja compreender melhor. O desenvolvimento profissional ganha sentido quando parte de uma pergunta que reconhece como sua.',
        action: 'Registrar uma questão que deseja explorar',
      },
      {
        title: 'Construir repertório antes de escolher uma trilha',
        description:
          'Observe sua prática, suas produções e seus interesses antes de transformar desenvolvimento em uma lista genérica de cursos.',
        action: 'Revisar seu contexto profissional',
      },
    )
  }

  return axes.slice(0, 4)
}

export default function PlanoPage() {
  const [profile, setProfile] = useState<ProfileContext | null>(null)
  const [restored, setRestored] = useState(false)
  const [selectedFocus, setSelectedFocus] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    try {
      const storedProfile = window.sessionStorage.getItem(profileContextKey)
      const storedFocus = window.sessionStorage.getItem(developmentFocusKey)

      if (storedProfile) {
        const parsed = JSON.parse(storedProfile) as Partial<ProfileContext>
        setProfile({
          area: typeof parsed.area === 'string' ? parsed.area : '',
          stage: typeof parsed.stage === 'string' ? parsed.stage : '',
          experience: typeof parsed.experience === 'string' ? parsed.experience : '',
          interests: Array.isArray(parsed.interests)
            ? parsed.interests.filter(item => typeof item === 'string')
            : [],
          developmentGoal:
            typeof parsed.developmentGoal === 'string' ? parsed.developmentGoal : '',
        })
        setRestored(true)
      }

      if (storedFocus) {
        setSelectedFocus(storedFocus)
      }
    } catch {
      window.sessionStorage.removeItem(profileContextKey)
      window.sessionStorage.removeItem(developmentFocusKey)
    }
  }, [])

  const axes = useMemo(() => buildAxes(profile), [profile])

  function handleSaveFocus() {
    if (!selectedFocus) return

    try {
      window.sessionStorage.setItem(developmentFocusKey, selectedFocus)
      setSaved(true)
    } catch {
      setSaved(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#EEF3F7] px-4 py-10 text-[#071827] sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <header className="bg-[#081C2E] px-6 py-10 text-white sm:px-10 sm:py-14">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">
              Professor Digital · EIOS
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl">
              Meu Desenvolvimento
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              Desenvolvimento profissional não começa com uma trilha pronta. Começa com o
              que você deseja compreender, aprofundar e construir na sua própria trajetória.
              O EIOS ajuda a organizar possibilidades; a escolha continua sendo sua.
            </p>
          </header>

          <div className="px-6 py-10 sm:px-10 sm:py-14">
            <section className="rounded-3xl border border-cyan-100 bg-cyan-50/60 p-6 sm:p-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                    Leitura contextual do EIOS · Beta
                  </p>
                  <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                    Possibilidades construídas a partir do contexto que você autorizou.
                  </h2>
                  <p className="mt-3 leading-7 text-slate-600">
                    Nesta etapa beta, as sugestões abaixo partem das escolhas que você fez
                    sobre interesses e objetivos. Elas não são diagnóstico, nota ou prescrição.
                    À medida que os fluxos do produto evoluírem, o EIOS poderá ampliar essas
                    conexões com dados e produções autorizados pelo próprio profissional.
                  </p>
                </div>
                <span className="inline-flex w-fit rounded-full border border-cyan-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-cyan-800">
                  Você decide
                </span>
              </div>

              {profile ? (
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                      Área de atuação
                    </p>
                    <p className="mt-2 font-semibold">{profile.area || 'Não informada'}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                      Momento profissional
                    </p>
                    <p className="mt-2 font-semibold">{profile.stage || 'Não informado'}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                      Interesses escolhidos
                    </p>
                    <p className="mt-2 font-semibold">
                      {profile.interests.length > 0
                        ? profile.interests.join(' · ')
                        : 'Ainda não selecionados'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-cyan-200 bg-white p-5">
                  <p className="font-semibold text-[#071827]">
                    Seu contexto profissional ainda não foi organizado nesta sessão.
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Você pode explorar possibilidades iniciais, mas a leitura ganha mais sentido
                    quando começa pelas perguntas e interesses que reconhece como seus.
                  </p>
                  <Link
                    href="/professor-digital/perfil"
                    className="mt-4 inline-flex font-semibold text-[#0B7491] underline underline-offset-4"
                  >
                    Organizar meu contexto profissional →
                  </Link>
                </div>
              )}
            </section>

            <section className="mt-10">
              <div className="max-w-3xl">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                  Possibilidades para este momento
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                  Escolha um foco que faça sentido agora.
                </h2>
                <p className="mt-4 leading-7 text-slate-600">
                  O objetivo desta etapa não é acumular metas. É transformar desenvolvimento em
                  uma intenção profissional concreta que você possa revisar e ajustar.
                </p>
              </div>

              <div className="mt-7 grid gap-4 md:grid-cols-2">
                {axes.map(axis => {
                  const selected = selectedFocus === axis.title

                  return (
                    <button
                      key={axis.title}
                      type="button"
                      onClick={() => {
                        setSelectedFocus(axis.title)
                        setSaved(false)
                      }}
                      className={`rounded-3xl border p-6 text-left transition focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-200 ${
                        selected
                          ? 'border-[#0B7491] bg-cyan-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-cyan-200 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-bold">{axis.title}</h3>
                          <p className="mt-3 text-sm leading-7 text-slate-600">
                            {axis.description}
                          </p>
                        </div>
                        <span
                          aria-hidden="true"
                          className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                            selected
                              ? 'border-[#0B7491] bg-[#0B7491]'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {selected ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
                        </span>
                      </div>
                      <p className="mt-5 border-t border-slate-200 pt-4 text-sm font-semibold text-[#0B7491]">
                        {axis.action}
                      </p>
                    </button>
                  )
                })}
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={handleSaveFocus}
                  disabled={!selectedFocus}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#081C2E] px-6 py-3 font-semibold text-white transition hover:bg-[#102B43] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Definir este como meu foco atual
                </button>
                <Link
                  href="/professor-digital/agenda"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 px-6 py-3 font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-white"
                >
                  Voltar para Minha Atuação
                </Link>
              </div>

              {saved ? (
                <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950">
                  <p className="font-semibold">Seu foco foi organizado para esta sessão.</p>
                  <p className="mt-1 text-sm leading-6">
                    Agora ele pode funcionar como referência para suas próximas reflexões no
                    Professor Digital. Você poderá revisar essa escolha sempre que seu contexto
                    mudar.
                  </p>
                </div>
              ) : null}
            </section>

            <section className="mt-12 border-t border-slate-200 pt-10">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                Próximos movimentos
              </p>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <article className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-5">
                  <h3 className="font-bold">Aprofundar conhecimento</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Conecte temas, interesses e produções para construir um mapa mais claro do
                    que já faz parte da sua trajetória.
                  </p>
                  <Link
                    href="/professor-digital/recomendacoes"
                    className="mt-4 inline-flex text-sm font-semibold text-[#0B7491] underline underline-offset-4"
                  >
                    Explorar possibilidades →
                  </Link>
                </article>

                <article className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-5">
                  <h3 className="font-bold">Reconhecer minha produção</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Revise registros e evidências autorizados para transformar atividades em
                    memória profissional e reflexão sobre continuidade.
                  </p>
                  <Link
                    href="/professor-digital/evidencias"
                    className="mt-4 inline-flex text-sm font-semibold text-[#0B7491] underline underline-offset-4"
                  >
                    Ver minha memória profissional →
                  </Link>
                </article>

                <article className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-5">
                  <h3 className="font-bold">Encontrar formações</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    A EduData Academy é o espaço do ecossistema para aprofundar escolhas de
                    desenvolvimento por meio de experiências formativas.
                  </p>
                  <Link
                    href="/academy"
                    className="mt-4 inline-flex text-sm font-semibold text-[#0B7491] underline underline-offset-4"
                  >
                    Conhecer a EduData Academy →
                  </Link>
                </article>
              </div>
            </section>

            <p className="mt-10 text-sm leading-6 text-slate-500">
              {restored
                ? 'Seu contexto foi recuperado desta sessão para manter a continuidade da experiência.'
                : 'Esta experiência beta funciona com o contexto organizado durante a sessão e não substitui processos formais de avaliação profissional.'}
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
