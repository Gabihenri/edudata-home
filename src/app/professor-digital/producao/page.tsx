'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

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

const knowledgeMapKey = 'edudata-professor-digital-knowledge-map'
const productionKey = 'edudata-professor-digital-production-memory'

const productionTypes = [
  'Aula ou sequência didática',
  'Projeto pedagógico',
  'Pesquisa ou estudo',
  'Material ou recurso criado',
  'Relatório ou análise',
  'Formação ou aprendizagem',
  'Outra produção profissional',
]

export default function ProducaoPage() {
  const [knowledge, setKnowledge] = useState<KnowledgeEntry[]>([])
  const [entries, setEntries] = useState<ProductionEntry[]>([])
  const [title, setTitle] = useState('')
  const [type, setType] = useState(productionTypes[0])
  const [period, setPeriod] = useState('')
  const [description, setDescription] = useState('')
  const [learning, setLearning] = useState('')
  const [nextStep, setNextStep] = useState('')
  const [themes, setThemes] = useState<string[]>([])
  const [saved, setSaved] = useState(false)
  const [restored, setRestored] = useState(false)

  useEffect(() => {
    try {
      const storedKnowledge = window.sessionStorage.getItem(knowledgeMapKey)
      const storedProduction = window.sessionStorage.getItem(productionKey)

      if (storedKnowledge) {
        const parsedKnowledge = JSON.parse(storedKnowledge) as KnowledgeEntry[]
        if (Array.isArray(parsedKnowledge)) {
          setKnowledge(
            parsedKnowledge.filter(
              entry => entry && typeof entry.theme === 'string' && entry.theme.trim(),
            ),
          )
        }
      }

      if (storedProduction) {
        const parsedEntries = JSON.parse(storedProduction) as ProductionEntry[]
        if (Array.isArray(parsedEntries)) {
          setEntries(
            parsedEntries.filter(
              entry =>
                entry &&
                typeof entry.id === 'string' &&
                typeof entry.title === 'string' &&
                typeof entry.type === 'string' &&
                typeof entry.period === 'string' &&
                typeof entry.description === 'string' &&
                typeof entry.learning === 'string' &&
                typeof entry.nextStep === 'string' &&
                Array.isArray(entry.themes),
            ),
          )
          setRestored(true)
        }
      }
    } catch {
      window.sessionStorage.removeItem(productionKey)
    }
  }, [])

  const availableThemes = useMemo(() => knowledge.map(entry => entry.theme), [knowledge])

  function toggleTheme(theme: string) {
    setSaved(false)
    setThemes(current =>
      current.includes(theme)
        ? current.filter(item => item !== theme)
        : [...current, theme],
    )
  }

  function addProduction() {
    const normalizedTitle = title.trim()
    if (!normalizedTitle) return

    setSaved(false)
    setEntries(current => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: normalizedTitle,
        type,
        period: period.trim(),
        description: description.trim(),
        learning: learning.trim(),
        nextStep: nextStep.trim(),
        themes,
      },
      ...current,
    ])

    setTitle('')
    setType(productionTypes[0])
    setPeriod('')
    setDescription('')
    setLearning('')
    setNextStep('')
    setThemes([])
  }

  function removeProduction(id: string) {
    setSaved(false)
    setEntries(current => current.filter(entry => entry.id !== id))
  }

  function saveMemory() {
    try {
      window.sessionStorage.setItem(productionKey, JSON.stringify(entries))
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
              Professor Digital
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Minha Produção
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
              Uma memória profissional para registrar o que você produz, reconhecer o que
              está ganhando consistência e refletir sobre os próximos caminhos que deseja abrir.
            </p>
          </div>

          <div className="px-6 py-10 sm:px-10 sm:py-14">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-700">
                Memória profissional em construção
              </p>
              <h2 className="mt-3 text-2xl font-bold text-[#081C2E] sm:text-3xl">
                Produzir não é apenas entregar. É também compreender o caminho percorrido.
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                Nesta etapa beta, você escolhe o que deseja incluir na sua memória profissional.
                O Professor Digital organiza essas produções como pontos de reflexão, sem notas,
                rankings ou comparações automáticas entre profissionais.
              </p>
              {restored ? (
                <p className="mt-4 text-sm font-medium text-cyan-800">
                  Recuperamos as produções organizadas nesta sessão para que você possa revisar
                  e ampliar sua memória profissional.
                </p>
              ) : null}
            </div>

            {availableThemes.length > 0 ? (
              <section className="mt-10 rounded-3xl border border-cyan-100 bg-cyan-50/70 p-6 sm:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-800">
                  Conexões com seu mapa de conhecimento
                </p>
                <p className="mt-3 leading-7 text-slate-600">
                  Você pode relacionar suas produções aos temas que já escolheu aprofundar. Essa
                  conexão será uma das bases para futuras leituras reflexivas do EIOS.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {availableThemes.map(theme => (
                    <span
                      key={theme}
                      className="rounded-full border border-cyan-200 bg-white px-3 py-2 text-sm font-medium text-cyan-950"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              </section>
            ) : (
              <section className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 sm:p-8">
                <h2 className="text-xl font-bold text-[#081C2E]">Sua produção também pode construir conhecimento</h2>
                <p className="mt-3 leading-7 text-slate-600">
                  Você pode começar a registrar produções agora. Se organizar seu mapa de
                  conhecimento depois, poderá conectar seus estudos, projetos e produções aos
                  territórios que deseja aprofundar.
                </p>
                <Link
                  href="/professor-digital/conhecimento"
                  className="mt-5 inline-flex font-semibold text-cyan-800 underline underline-offset-4"
                >
                  Organizar meu mapa de conhecimento →
                </Link>
              </section>
            )}

            <section className="mt-10 rounded-3xl border border-slate-200 bg-[#F8FAFC] p-6 sm:p-8">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-700">
                  Adicionar à minha memória
                </p>
                <h2 className="mt-3 text-2xl font-bold text-[#081C2E] sm:text-3xl">
                  O que você gostaria de reconhecer nesta etapa da sua trajetória?
                </h2>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label>
                  <span className="text-sm font-semibold text-[#081C2E]">Título da produção</span>
                  <input
                    value={title}
                    onChange={event => {
                      setSaved(false)
                      setTitle(event.target.value)
                    }}
                    placeholder="Exemplo: sequência didática sobre energia"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  />
                </label>

                <label>
                  <span className="text-sm font-semibold text-[#081C2E]">Tipo de produção</span>
                  <select
                    value={type}
                    onChange={event => {
                      setSaved(false)
                      setType(event.target.value)
                    }}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  >
                    {productionTypes.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="mt-4 block">
                <span className="text-sm font-semibold text-[#081C2E]">
                  Período ou contexto <span className="font-normal text-slate-500">(opcional)</span>
                </span>
                <input
                  value={period}
                  onChange={event => {
                    setSaved(false)
                    setPeriod(event.target.value)
                  }}
                  placeholder="Exemplo: agosto de 2026, projeto em andamento, último semestre"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </label>

              <label className="mt-4 block">
                <span className="text-sm font-semibold text-[#081C2E]">
                  O que foi desenvolvido? <span className="font-normal text-slate-500">(opcional)</span>
                </span>
                <textarea
                  value={description}
                  onChange={event => {
                    setSaved(false)
                    setDescription(event.target.value)
                  }}
                  placeholder="Descreva brevemente a produção, o projeto ou a experiência que você deseja registrar."
                  className="mt-2 min-h-28 w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </label>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label>
                  <span className="text-sm font-semibold text-[#081C2E]">
                    O que você aprendeu ou percebeu? <span className="font-normal text-slate-500">(opcional)</span>
                  </span>
                  <textarea
                    value={learning}
                    onChange={event => {
                      setSaved(false)
                      setLearning(event.target.value)
                    }}
                    placeholder="Que aspecto dessa produção merece ser reconhecido ou compreendido melhor?"
                    className="mt-2 min-h-28 w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  />
                </label>

                <label>
                  <span className="text-sm font-semibold text-[#081C2E]">
                    Que próximo passo faria sentido? <span className="font-normal text-slate-500">(opcional)</span>
                  </span>
                  <textarea
                    value={nextStep}
                    onChange={event => {
                      setSaved(false)
                      setNextStep(event.target.value)
                    }}
                    placeholder="Exemplo: revisar, ampliar, pesquisar, compartilhar ou transformar em novo projeto."
                    className="mt-2 min-h-28 w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  />
                </label>
              </div>

              {availableThemes.length > 0 ? (
                <fieldset className="mt-6">
                  <legend className="text-sm font-semibold text-[#081C2E]">
                    Que temas do seu mapa se conectam a esta produção?
                  </legend>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {availableThemes.map(theme => {
                      const selected = themes.includes(theme)
                      return (
                        <button
                          key={theme}
                          type="button"
                          onClick={() => toggleTheme(theme)}
                          className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                            selected
                              ? 'border-[#081C2E] bg-[#081C2E] text-white'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-cyan-300'
                          }`}
                        >
                          {theme}
                        </button>
                      )
                    })}
                  </div>
                </fieldset>
              ) : null}

              <button
                type="button"
                onClick={addProduction}
                className="mt-6 inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#081C2E] px-6 font-semibold text-white transition hover:bg-[#102B43]"
              >
                Adicionar à minha produção
              </button>
            </section>

            <section className="mt-10">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-700">
                    Minha memória profissional
                  </p>
                  <h2 className="mt-3 text-2xl font-bold text-[#081C2E] sm:text-3xl">
                    Produções que você escolheu tornar visíveis.
                  </h2>
                </div>
                <p className="text-sm text-slate-500">{entries.length} registro(s)</p>
              </div>

              <div className="mt-6 space-y-4">
                {entries.length > 0 ? (
                  entries.map(entry => (
                    <article
                      key={entry.id}
                      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">
                            {entry.type}
                          </p>
                          <h3 className="mt-2 text-xl font-bold text-[#081C2E]">{entry.title}</h3>
                          {entry.period ? (
                            <p className="mt-1 text-sm text-slate-500">{entry.period}</p>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeProduction(entry.id)}
                          className="text-sm font-semibold text-slate-500 underline underline-offset-4 hover:text-rose-700"
                        >
                          Remover
                        </button>
                      </div>

                      {entry.description ? (
                        <p className="mt-5 leading-7 text-slate-600">{entry.description}</p>
                      ) : null}

                      {entry.learning ? (
                        <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                          <p className="text-sm font-semibold text-[#081C2E]">O que essa produção ajudou você a perceber</p>
                          <p className="mt-2 leading-7 text-slate-600">{entry.learning}</p>
                        </div>
                      ) : null}

                      {entry.nextStep ? (
                        <div className="mt-4 rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4">
                          <p className="text-sm font-semibold text-cyan-900">Possível continuidade escolhida por você</p>
                          <p className="mt-2 leading-7 text-slate-700">{entry.nextStep}</p>
                        </div>
                      ) : null}

                      {entry.themes.length > 0 ? (
                        <div className="mt-5 flex flex-wrap gap-2">
                          {entry.themes.map(theme => (
                            <span
                              key={theme}
                              className="rounded-full border border-cyan-200 bg-white px-3 py-2 text-xs font-semibold text-cyan-900"
                            >
                              {theme}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  ))
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 leading-7 text-slate-600">
                    Sua memória profissional começa quando você decide o que merece ser reconhecido.
                    Registre uma produção, experiência ou projeto que faça sentido para sua trajetória.
                  </div>
                )}
              </div>
            </section>

            <section className="mt-10 rounded-3xl border border-cyan-100 bg-cyan-50/60 p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-800">
                Próxima leitura do EIOS
              </p>
              <h2 className="mt-3 text-2xl font-bold text-[#081C2E]">
                A produção pode se transformar em uma pergunta de desenvolvimento.
              </h2>
              <p className="mt-4 leading-7 text-slate-600">
                Com mais contexto autorizado, o EIOS poderá ajudar a relacionar objetivos,
                temas e produções para apresentar possibilidades de aprofundamento. Essas leituras
                serão sempre sugestões explicáveis e revisáveis — não prescrições sobre o que você
                deve fazer.
              </p>
              <Link
                href="/professor-digital/desenvolvimento"
                className="mt-5 inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#0B7491] px-6 font-semibold text-white transition hover:bg-[#09657E]"
              >
                Explorar Meu Desenvolvimento →
              </Link>
            </section>

            <div className="mt-10 flex flex-col gap-3 border-t border-slate-200 pt-8 sm:flex-row">
              <button
                type="button"
                onClick={saveMemory}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[#081C2E] px-6 font-semibold text-[#081C2E] transition hover:bg-slate-100"
              >
                Salvar memória nesta sessão
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
                <p className="font-semibold">Memória profissional organizada para esta sessão.</p>
                <p className="mt-1 text-sm leading-6">
                  O próximo passo é escolher quais objetivos e possibilidades de desenvolvimento
                  fazem sentido para você a partir dessa trajetória.
                </p>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  )
}
