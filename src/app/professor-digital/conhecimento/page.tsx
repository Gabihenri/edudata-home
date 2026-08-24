'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type ProfileContext = {
  interests: string[]
  developmentGoal: string
}

type KnowledgeEntry = {
  theme: string
  relationship: 'explorar' | 'desenvolver' | 'aprofundar'
  question: string
}

const profileContextKey = 'edudata-professor-digital-profile-context'
const knowledgeMapKey = 'edudata-professor-digital-knowledge-map'

const relationshipLabels: Record<KnowledgeEntry['relationship'], string> = {
  explorar: 'Quero explorar',
  desenvolver: 'Estou desenvolvendo',
  aprofundar: 'Quero aprofundar',
}

const relationshipOptions: KnowledgeEntry['relationship'][] = [
  'explorar',
  'desenvolver',
  'aprofundar',
]

export default function ConhecimentoPage() {
  const [profile, setProfile] = useState<ProfileContext>({
    interests: [],
    developmentGoal: '',
  })
  const [entries, setEntries] = useState<KnowledgeEntry[]>([])
  const [newTheme, setNewTheme] = useState('')
  const [newQuestion, setNewQuestion] = useState('')
  const [newRelationship, setNewRelationship] =
    useState<KnowledgeEntry['relationship']>('explorar')
  const [saved, setSaved] = useState(false)
  const [restored, setRestored] = useState(false)

  useEffect(() => {
    try {
      const storedProfile = window.sessionStorage.getItem(profileContextKey)
      const storedKnowledge = window.sessionStorage.getItem(knowledgeMapKey)

      if (storedProfile) {
        const parsedProfile = JSON.parse(storedProfile) as Partial<ProfileContext>
        setProfile({
          interests: Array.isArray(parsedProfile.interests)
            ? parsedProfile.interests.filter(item => typeof item === 'string')
            : [],
          developmentGoal:
            typeof parsedProfile.developmentGoal === 'string'
              ? parsedProfile.developmentGoal
              : '',
        })
      }

      if (storedKnowledge) {
        const parsedEntries = JSON.parse(storedKnowledge) as KnowledgeEntry[]
        if (Array.isArray(parsedEntries)) {
          setEntries(
            parsedEntries.filter(
              entry =>
                entry &&
                typeof entry.theme === 'string' &&
                typeof entry.question === 'string' &&
                relationshipOptions.includes(entry.relationship),
            ),
          )
          setRestored(true)
        }
      }
    } catch {
      window.sessionStorage.removeItem(knowledgeMapKey)
    }
  }, [])

  const suggestedThemes = useMemo(
    () => profile.interests.filter(interest => !entries.some(entry => entry.theme === interest)),
    [entries, profile.interests],
  )

  function addEntry(theme = newTheme) {
    const normalizedTheme = theme.trim()
    if (!normalizedTheme || entries.some(entry => entry.theme === normalizedTheme)) return

    setSaved(false)
    setEntries(current => [
      ...current,
      {
        theme: normalizedTheme,
        relationship: newRelationship,
        question: newQuestion.trim(),
      },
    ])
    setNewTheme('')
    setNewQuestion('')
    setNewRelationship('explorar')
  }

  function updateRelationship(theme: string, relationship: KnowledgeEntry['relationship']) {
    setSaved(false)
    setEntries(current =>
      current.map(entry => (entry.theme === theme ? { ...entry, relationship } : entry)),
    )
  }

  function updateQuestion(theme: string, question: string) {
    setSaved(false)
    setEntries(current =>
      current.map(entry => (entry.theme === theme ? { ...entry, question } : entry)),
    )
  }

  function removeEntry(theme: string) {
    setSaved(false)
    setEntries(current => current.filter(entry => entry.theme !== theme))
  }

  function saveMap() {
    try {
      window.sessionStorage.setItem(knowledgeMapKey, JSON.stringify(entries))
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
              Meu Conhecimento
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
              Um espaço para tornar visíveis os temas que você explora, as perguntas que
              orientam sua aprendizagem e os territórios profissionais que deseja aprofundar.
            </p>
          </div>

          <div className="px-6 py-10 sm:px-10 sm:py-14">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-700">
                Mapa profissional em construção
              </p>
              <h2 className="mt-3 text-2xl font-bold text-[#081C2E] sm:text-3xl">
                Conhecimento não é uma nota. É uma trajetória que você organiza.
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                Nesta etapa beta, você escolhe os temas que deseja observar e define como se
                relaciona com cada um deles. O Professor Digital não mede sua competência nem
                atribui níveis automáticos: o mapa serve para apoiar reflexão, memória e
                decisões sobre desenvolvimento.
              </p>
              {restored ? (
                <p className="mt-4 text-sm font-medium text-cyan-800">
                  Recuperamos o mapa que você organizou nesta sessão para que possa continuar
                  revisando suas escolhas.
                </p>
              ) : null}
            </div>

            {profile.interests.length > 0 || profile.developmentGoal ? (
              <section className="mt-10 rounded-3xl border border-cyan-100 bg-cyan-50/70 p-6 sm:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-800">
                  Contexto autorizado para esta sessão
                </p>
                {profile.interests.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {profile.interests.map(interest => (
                      <span
                        key={interest}
                        className="rounded-full border border-cyan-200 bg-white px-3 py-2 text-sm font-medium text-cyan-950"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                ) : null}
                {profile.developmentGoal ? (
                  <p className="mt-4 leading-7 text-slate-700">
                    <span className="font-semibold text-[#081C2E]">Seu objetivo atual:</span>{' '}
                    {profile.developmentGoal}
                  </p>
                ) : null}
              </section>
            ) : (
              <section className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 sm:p-8">
                <h2 className="text-xl font-bold text-[#081C2E]">Comece pelo seu contexto</h2>
                <p className="mt-3 leading-7 text-slate-600">
                  Se você organizar seus interesses e objetivos primeiro, o mapa de conhecimento
                  poderá começar com os temas que fazem sentido para sua trajetória.
                </p>
                <Link
                  href="/professor-digital/perfil"
                  className="mt-5 inline-flex font-semibold text-cyan-800 underline underline-offset-4"
                >
                  Organizar meu contexto profissional →
                </Link>
              </section>
            )}

            <section className="mt-10">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-700">
                    Meu mapa de conhecimento
                  </p>
                  <h2 className="mt-3 text-2xl font-bold text-[#081C2E] sm:text-3xl">
                    Quais territórios fazem sentido para você agora?
                  </h2>
                </div>
                <p className="text-sm text-slate-500">{entries.length} tema(s) organizado(s)</p>
              </div>

              {suggestedThemes.length > 0 ? (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-sm font-semibold text-[#081C2E]">
                    Temas que você já indicou como interesse
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {suggestedThemes.map(theme => (
                      <button
                        key={theme}
                        type="button"
                        onClick={() => addEntry(theme)}
                        className="rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-900 transition hover:border-cyan-400 hover:bg-cyan-100"
                      >
                        + {theme}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-6 space-y-4">
                {entries.length > 0 ? (
                  entries.map(entry => (
                    <article
                      key={entry.theme}
                      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-[#081C2E]">{entry.theme}</h3>
                          <p className="mt-1 text-sm text-slate-500">
                            Você define como este tema participa da sua trajetória atual.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeEntry(entry.theme)}
                          className="text-sm font-semibold text-slate-500 underline underline-offset-4 hover:text-rose-700"
                        >
                          Remover
                        </button>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2">
                        {relationshipOptions.map(option => {
                          const selected = entry.relationship === option
                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => updateRelationship(entry.theme, option)}
                              className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
                                selected
                                  ? 'border-[#081C2E] bg-[#081C2E] text-white'
                                  : 'border-slate-200 bg-white text-slate-600 hover:border-cyan-300'
                              }`}
                            >
                              {relationshipLabels[option]}
                            </button>
                          )
                        })}
                      </div>

                      <label className="mt-5 block">
                        <span className="text-sm font-semibold text-[#081C2E]">
                          Que pergunta você gostaria de investigar neste tema?{' '}
                          <span className="font-normal text-slate-500">(opcional)</span>
                        </span>
                        <textarea
                          value={entry.question}
                          onChange={event => updateQuestion(entry.theme, event.target.value)}
                          placeholder="Exemplo: como posso transformar esse interesse em uma prática, estudo ou projeto que faça sentido para meu contexto?"
                          className="mt-2 min-h-24 w-full resize-y rounded-2xl border border-slate-200 px-4 py-3 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                        />
                      </label>
                    </article>
                  ))
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-600">
                    Escolha um tema acima ou adicione o primeiro território que deseja observar.
                  </div>
                )}
              </div>

              <div className="mt-6 rounded-3xl border border-slate-200 bg-[#F8FAFC] p-6 sm:p-8">
                <h3 className="text-xl font-bold text-[#081C2E]">Adicionar outro tema</h3>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <label>
                    <span className="text-sm font-semibold text-[#081C2E]">Tema</span>
                    <input
                      value={newTheme}
                      onChange={event => {
                        setSaved(false)
                        setNewTheme(event.target.value)
                      }}
                      placeholder="Exemplo: Ensino de Física"
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                    />
                  </label>
                  <label>
                    <span className="text-sm font-semibold text-[#081C2E]">Como ele aparece hoje?</span>
                    <select
                      value={newRelationship}
                      onChange={event => {
                        setSaved(false)
                        setNewRelationship(event.target.value as KnowledgeEntry['relationship'])
                      }}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                    >
                      {relationshipOptions.map(option => (
                        <option key={option} value={option}>
                          {relationshipLabels[option]}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="mt-4 block">
                  <span className="text-sm font-semibold text-[#081C2E]">
                    Pergunta ou intenção <span className="font-normal text-slate-500">(opcional)</span>
                  </span>
                  <textarea
                    value={newQuestion}
                    onChange={event => {
                      setSaved(false)
                      setNewQuestion(event.target.value)
                    }}
                    placeholder="Que questão você gostaria de levar adiante neste território?"
                    className="mt-2 min-h-24 w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => addEntry()}
                  className="mt-5 inline-flex min-h-12 items-center justify-center rounded-2xl border border-[#081C2E] px-5 font-semibold text-[#081C2E] transition hover:bg-slate-100"
                >
                  Adicionar ao meu mapa
                </button>
              </div>
            </section>

            <section className="mt-10 rounded-3xl border border-cyan-100 bg-cyan-50/60 p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-800">
                Leitura inicial do EIOS
              </p>
              <h2 className="mt-3 text-2xl font-bold text-[#081C2E]">
                O próximo passo nasce das escolhas que você organizou.
              </h2>
              <p className="mt-4 leading-7 text-slate-600">
                Nesta versão beta, o EIOS ainda não produz recomendações automáticas. O que já
                está disponível é a base da experiência: seus interesses, perguntas e objetivos
                podem ser organizados para, nos próximos fluxos, conectar conhecimento, produção
                e possibilidades formativas sem reduzir sua trajetória a uma pontuação.
              </p>
            </section>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={saveMap}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#081C2E] px-6 font-semibold text-white transition hover:bg-[#102B43]"
              >
                Registrar mapa nesta sessão
              </button>
              <Link
                href="/professor-digital/plano"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-cyan-200 bg-cyan-50 px-6 font-semibold text-cyan-900 transition hover:border-cyan-300 hover:bg-cyan-100"
              >
                Ver possibilidades de desenvolvimento
              </Link>
              <Link
                href="/professor-digital"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 px-6 font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Voltar ao Professor Digital
              </Link>
            </div>

            {saved ? (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
                <p className="font-semibold">Mapa de conhecimento organizado para esta sessão.</p>
                <p className="mt-1 text-sm leading-6">
                  Você pode revisar esses territórios a qualquer momento e levá-los para Meu
                  Desenvolvimento quando quiser escolher um próximo passo.
                </p>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  )
}
