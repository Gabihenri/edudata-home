'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  readProfessionalProfileContext,
  type ProfessionalProfileContext,
} from '@/lib/professor-digital/profile-context'

type KnowledgeEntry = {
  theme: string
  relationship: 'explorar' | 'desenvolver' | 'aprofundar'
  question: string
}

type ProductionEntry = {
  id: string
  title: string
  type: string
  period: string
  description: string
  learning: string
  nextStep: string
  themes: string[]
}

type DevelopmentChoice = {
  id: string
  title: string
  reason: string
  source: string[]
  nextAction: string
}

const knowledgeMapKey = 'edudata-professor-digital-knowledge-map'
const productionKey = 'edudata-professor-digital-production-memory'
const developmentKey = 'edudata-professor-digital-development-choices'

function isKnowledgeEntry(value: unknown): value is KnowledgeEntry {
  if (!value || typeof value !== 'object') return false
  const entry = value as Partial<KnowledgeEntry>
  return (
    typeof entry.theme === 'string' &&
    (entry.relationship === 'explorar' ||
      entry.relationship === 'desenvolver' ||
      entry.relationship === 'aprofundar') &&
    typeof entry.question === 'string'
  )
}

function isProductionEntry(value: unknown): value is ProductionEntry {
  if (!value || typeof value !== 'object') return false
  const entry = value as Partial<ProductionEntry>
  return (
    typeof entry.id === 'string' &&
    typeof entry.title === 'string' &&
    typeof entry.type === 'string' &&
    typeof entry.period === 'string' &&
    typeof entry.description === 'string' &&
    typeof entry.learning === 'string' &&
    typeof entry.nextStep === 'string' &&
    Array.isArray(entry.themes) &&
    entry.themes.every(theme => typeof theme === 'string')
  )
}

function buildSuggestions(
  profile: ProfessionalProfileContext,
  knowledge: KnowledgeEntry[],
  production: ProductionEntry[],
): DevelopmentChoice[] {
  const suggestions: DevelopmentChoice[] = []

  knowledge.forEach(entry => {
    if (entry.relationship === 'aprofundar') {
      suggestions.push({
        id: `knowledge-${entry.theme}`,
        title: `Aprofundar ${entry.theme}`,
        reason: entry.question
          ? `Você indicou que deseja aprofundar este tema e registrou uma pergunta que pode orientar uma próxima etapa: “${entry.question}”.`
          : 'Você indicou este tema como um território que deseja aprofundar na sua trajetória.',
        source: ['Meu Conhecimento'],
        nextAction: 'Definir uma pergunta de estudo, uma experiência prática ou uma formação que faça sentido para seu contexto.',
      })
    }
  })

  production.forEach(entry => {
    if (entry.nextStep) {
      suggestions.push({
        id: `production-${entry.id}`,
        title: `Dar continuidade a ${entry.title}`,
        reason: `Na sua memória profissional, você registrou um possível próximo passo: “${entry.nextStep}”.`,
        source: ['Minha Produção'],
        nextAction: 'Transformar esse próximo passo em um objetivo pessoal, estudo, projeto ou experiência formativa.',
      })
    }
  })

  if (profile.developmentGoal) {
    suggestions.push({
      id: 'profile-goal',
      title: 'Explorar o objetivo que você definiu',
      reason: `Seu contexto profissional inclui a seguinte intenção: “${profile.developmentGoal}”.`,
      source: ['Meu Contexto'],
      nextAction: 'Escolher um pequeno avanço observável que você gostaria de realizar nas próximas semanas.',
    })
  }

  if (suggestions.length === 0) {
    suggestions.push({
      id: 'start',
      title: 'Construir uma primeira direção de desenvolvimento',
      reason: 'Ainda há poucas informações organizadas no seu percurso para relacionar conhecimento, produção e objetivos.',
      source: ['Meu percurso'],
      nextAction: 'Organizar um interesse, uma produção recente ou uma pergunta profissional que você gostaria de investigar.',
    })
  }

  return suggestions.slice(0, 6)
}

function readArray<T>(key: string, predicate: (value: unknown) => value is T): T[] {
  try {
    const stored = window.localStorage.getItem(key)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed.filter(predicate) : []
  } catch {
    window.localStorage.removeItem(key)
    return []
  }
}

export default function DesenvolvimentoPage() {
  const [profile, setProfile] = useState<ProfessionalProfileContext>({
    area: '',
    stage: '',
    experience: '',
    interests: [],
    developmentGoal: '',
  })
  const [knowledge, setKnowledge] = useState<KnowledgeEntry[]>([])
  const [production, setProduction] = useState<ProductionEntry[]>([])
  const [choices, setChoices] = useState<string[]>([])
  const [saved, setSaved] = useState(false)
  const [restored, setRestored] = useState(false)

  useEffect(() => {
    const storedProfile = readProfessionalProfileContext()
    if (storedProfile) setProfile(storedProfile)

    const storedKnowledge = readArray<KnowledgeEntry>(knowledgeMapKey, isKnowledgeEntry)
    setKnowledge(storedKnowledge)

    const storedProduction = readArray<ProductionEntry>(productionKey, isProductionEntry)
    setProduction(storedProduction)

    const storedChoices = readArray<string>(developmentKey, (item): item is string => typeof item === 'string')
    setChoices(storedChoices)
    setRestored(
      Boolean(storedProfile) ||
        storedKnowledge.length > 0 ||
        storedProduction.length > 0 ||
        storedChoices.length > 0,
    )
  }, [])

  const suggestions = useMemo(
    () => buildSuggestions(profile, knowledge, production),
    [knowledge, production, profile],
  )

  function toggleChoice(id: string) {
    setSaved(false)
    setChoices(current =>
      current.includes(id) ? current.filter(item => item !== id) : [...current, id],
    )
  }

  function saveChoices() {
    try {
      window.localStorage.setItem(developmentKey, JSON.stringify(choices))
      setSaved(true)
    } catch {
      setSaved(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="bg-[#081C2E] px-6 py-10 sm:px-10 sm:py-14">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-200">
              Professor Digital · EIOS
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Meu Desenvolvimento
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
              Um espaço para transformar o que você escolheu observar sobre sua trajetória em
              possibilidades de aprofundamento — com você decidindo quais caminhos fazem sentido.
            </p>
          </div>

          <div className="px-6 py-10 sm:px-10 sm:py-14">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-700">
                Leitura inicial do EIOS
              </p>
              <h2 className="mt-3 text-2xl font-bold text-[#081C2E] sm:text-3xl">
                O EIOS conecta evidências. Você decide o que fazer com elas.
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                Nesta versão beta, as possibilidades abaixo são construídas a partir das
                informações que você organizou no seu próprio percurso. Cada sugestão mostra de
                onde vem; não há recomendação oculta, diagnóstico automático ou determinação
                sobre sua carreira profissional.
              </p>
              {restored ? (
                <p className="mt-4 text-sm font-medium text-cyan-800">
                  O EIOS recuperou os elementos que você já organizou neste dispositivo para
                  continuar a leitura da sua trajetória.
                </p>
              ) : null}
            </div>

            <section className="mt-10 grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">Meu Contexto</p>
                <p className="mt-3 text-3xl font-bold text-[#081C2E]">
                  {profile.interests.length + (profile.developmentGoal ? 1 : 0)}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">interesses e objetivos disponíveis</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">Meu Conhecimento</p>
                <p className="mt-3 text-3xl font-bold text-[#081C2E]">{knowledge.length}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">temas organizados no mapa</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">Minha Produção</p>
                <p className="mt-3 text-3xl font-bold text-[#081C2E]">{production.length}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">registros na memória profissional</p>
              </div>
            </section>

            <section className="mt-10">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-700">
                  Possibilidades para considerar
                </p>
                <h2 className="mt-3 text-2xl font-bold text-[#081C2E] sm:text-3xl">
                  O que os seus próprios registros podem ajudar você a explorar agora?
                </h2>
              </div>

              <div className="mt-6 space-y-4">
                {suggestions.map(suggestion => {
                  const selected = choices.includes(suggestion.id)
                  return (
                    <article
                      key={suggestion.id}
                      className={`rounded-3xl border p-6 transition ${
                        selected
                          ? 'border-cyan-300 bg-cyan-50/70'
                          : 'border-slate-200 bg-white shadow-sm'
                      }`}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap gap-2">
                            {suggestion.source.map(source => (
                              <span
                                key={source}
                                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600"
                              >
                                {source}
                              </span>
                            ))}
                          </div>
                          <h3 className="mt-4 text-xl font-bold text-[#081C2E]">{suggestion.title}</h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleChoice(suggestion.id)}
                          className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                            selected
                              ? 'border-[#081C2E] bg-[#081C2E] text-white'
                              : 'border-slate-200 text-slate-700 hover:border-cyan-300'
                          }`}
                        >
                          {selected ? 'Quero considerar' : 'Adicionar às minhas possibilidades'}
                        </button>
                      </div>

                      <p className="mt-4 leading-7 text-slate-600">{suggestion.reason}</p>

                      <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                        <p className="text-sm font-semibold text-[#081C2E]">Uma possível próxima ação</p>
                        <p className="mt-2 leading-7 text-slate-600">{suggestion.nextAction}</p>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>

            <section className="mt-10 rounded-3xl border border-cyan-100 bg-cyan-50/60 p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-800">
                Conexão com a EduData Academy
              </p>
              <h2 className="mt-3 text-2xl font-bold text-[#081C2E]">
                Desenvolvimento não precisa ser prescrito para ser apoiado.
              </h2>
              <p className="mt-4 leading-7 text-slate-600">
                As possibilidades escolhidas aqui poderão orientar conexões com experiências,
                formações e percursos da EduData Academy. O EIOS deve explicar por que uma
                conexão foi apresentada e permitir que você aceite, adapte ou simplesmente ignore
                qualquer sugestão.
              </p>
            </section>

            <section className="mt-10 rounded-3xl border border-slate-200 bg-[#F8FAFC] p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                Minhas escolhas
              </p>
              <h2 className="mt-3 text-2xl font-bold text-[#081C2E]">
                {choices.length > 0
                  ? `${choices.length} possibilidade(s) selecionada(s) por você.`
                  : 'Você ainda não selecionou uma possibilidade — e isso também faz parte do processo.'}
              </h2>
              <p className="mt-4 leading-7 text-slate-600">
                O objetivo não é obrigar uma decisão imediata. Você pode usar esta leitura para
                observar possibilidades, comparar caminhos e decidir quando houver contexto suficiente.
              </p>
            </section>

            <div className="mt-10 flex flex-col gap-3 border-t border-slate-200 pt-8 sm:flex-row">
              <button
                type="button"
                onClick={saveChoices}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#081C2E] px-6 font-semibold text-white transition hover:bg-[#102B43]"
              >
                Salvar minhas escolhas
              </button>
              <Link
                href="/professor-digital"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 px-6 font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Voltar ao Professor Digital
              </Link>
            </div>

            {saved ? (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
                <p className="font-semibold">Suas escolhas foram salvas neste dispositivo.</p>
                <p className="mt-1 text-sm leading-6">
                  Você poderá retomar essas escolhas para continuar refletindo sobre seus próximos
                  passos e, conforme as conexões autorizadas evoluírem, explorar oportunidades
                  relacionadas na EduData Academy.
                </p>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  )
}
