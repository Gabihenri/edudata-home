'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type ProfileContext = {
  area: string
  stage: string
  experience: string
  interests: string[]
  developmentGoal: string
}

const profileContextKey = 'edudata-professor-digital-profile-context'

const initialProfile: ProfileContext = {
  area: '',
  stage: '',
  experience: '',
  interests: [],
  developmentGoal: '',
}

const interestOptions = [
  'Prática pedagógica',
  'Tecnologias educacionais',
  'Avaliação e evidências',
  'Inclusão e acessibilidade',
  'Gestão e liderança',
  'Pesquisa e inovação',
]

export default function PerfilPage() {
  const [profile, setProfile] = useState<ProfileContext>(initialProfile)
  const [saved, setSaved] = useState(false)
  const [restored, setRestored] = useState(false)

  useEffect(() => {
    try {
      const storedProfile = window.sessionStorage.getItem(profileContextKey)

      if (storedProfile) {
        const parsedProfile = JSON.parse(storedProfile) as Partial<ProfileContext>

        setProfile({
          area: typeof parsedProfile.area === 'string' ? parsedProfile.area : '',
          stage: typeof parsedProfile.stage === 'string' ? parsedProfile.stage : '',
          experience: typeof parsedProfile.experience === 'string' ? parsedProfile.experience : '',
          interests: Array.isArray(parsedProfile.interests)
            ? parsedProfile.interests.filter(item => typeof item === 'string')
            : [],
          developmentGoal:
            typeof parsedProfile.developmentGoal === 'string'
              ? parsedProfile.developmentGoal
              : '',
        })
        setRestored(true)
      }
    } catch {
      window.sessionStorage.removeItem(profileContextKey)
    }
  }, [])

  function updateInterest(interest: string) {
    setSaved(false)

    setProfile(current => ({
      ...current,
      interests: current.interests.includes(interest)
        ? current.interests.filter(item => item !== interest)
        : [...current.interests, interest],
    }))
  }

  function handleSave() {
    try {
      window.sessionStorage.setItem(profileContextKey, JSON.stringify(profile))
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
              Meu Contexto Profissional
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
              O ponto de partida para construir um espelho inteligente da sua trajetória
              profissional é você definir quais aspectos do seu contexto deseja compartilhar.
            </p>
          </div>

          <div className="px-6 py-10 sm:px-10 sm:py-14">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-700">
                Construção do perfil
              </p>
              <h2 className="mt-3 text-2xl font-bold text-[#081C2E] sm:text-3xl">
                Seu contexto não é um diagnóstico
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                O Professor Digital não atribui níveis, rótulos comportamentais ou avaliações
                psicológicas. As informações abaixo servem como contexto para suas próprias
                reflexões, para organizar sua memória profissional e, futuramente, ajudar o
                EIOS a apresentar possibilidades de desenvolvimento que você pode aceitar,
                adaptar ou ignorar.
              </p>
              {restored ? (
                <p className="mt-4 text-sm font-medium text-cyan-800">
                  Recuperamos o contexto que você havia organizado nesta sessão para que possa
                  revisar ou atualizar suas escolhas.
                </p>
              ) : null}
            </div>

            <form
              className="mt-10 space-y-8"
              onSubmit={event => {
                event.preventDefault()
                handleSave()
              }}
            >
              <div className="grid gap-6 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-[#081C2E]">
                    Em que área você atua?
                  </span>
                  <select
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                    value={profile.area}
                    onChange={event => {
                      setSaved(false)
                      setProfile(current => ({
                        ...current,
                        area: event.target.value,
                      }))
                    }}
                  >
                    <option value="">Selecione uma opção</option>
                    <option value="Educação Infantil">Educação Infantil</option>
                    <option value="Ensino Fundamental">Ensino Fundamental</option>
                    <option value="Ensino Médio">Ensino Médio</option>
                    <option value="Educação Profissional">Educação Profissional</option>
                    <option value="Ensino Superior">Ensino Superior</option>
                    <option value="Gestão ou apoio pedagógico">Gestão ou apoio pedagógico</option>
                    <option value="Outra atuação educacional">Outra atuação educacional</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-[#081C2E]">
                    Em que momento profissional você se encontra?
                  </span>
                  <select
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                    value={profile.stage}
                    onChange={event => {
                      setSaved(false)
                      setProfile(current => ({
                        ...current,
                        stage: event.target.value,
                      }))
                    }}
                  >
                    <option value="">Selecione uma opção</option>
                    <option value="Início ou transição">Início ou transição</option>
                    <option value="Consolidação da prática">Consolidação da prática</option>
                    <option value="Ampliação de repertório">Ampliação de repertório</option>
                    <option value="Novos desafios profissionais">Novos desafios profissionais</option>
                    <option value="Revisão de trajetória">Revisão de trajetória</option>
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-semibold text-[#081C2E]">
                  Como você descreve sua experiência atual? <span className="font-normal text-slate-500">(opcional)</span>
                </span>
                <textarea
                  className="mt-2 min-h-32 w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  placeholder="Exemplo: estou buscando compreender melhor minha produção recente, aprofundar conhecimentos ou preparar uma nova etapa da minha trajetória."
                  value={profile.experience}
                  onChange={event => {
                    setSaved(false)
                    setProfile(current => ({
                      ...current,
                      experience: event.target.value,
                    }))
                  }}
                />
              </label>

              <fieldset>
                <legend className="text-sm font-semibold text-[#081C2E]">
                  Quais temas você gostaria de aprofundar?
                </legend>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Selecione os temas que fazem sentido para você neste momento. Eles não
                  representam uma classificação do seu perfil.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {interestOptions.map(interest => {
                    const selected = profile.interests.includes(interest)

                    return (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => updateInterest(interest)}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                          selected
                            ? 'border-cyan-700 bg-cyan-50 text-cyan-900'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-cyan-300'
                        }`}
                      >
                        {interest}
                      </button>
                    )
                  })}
                </div>
              </fieldset>

              <label className="block">
                <span className="text-sm font-semibold text-[#081C2E]">
                  O que você gostaria de desenvolver agora? <span className="font-normal text-slate-500">(opcional)</span>
                </span>
                <textarea
                  className="mt-2 min-h-28 w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  placeholder="Descreva uma pergunta, objetivo ou possibilidade que você deseja explorar."
                  value={profile.developmentGoal}
                  onChange={event => {
                    setSaved(false)
                    setProfile(current => ({
                      ...current,
                      developmentGoal: event.target.value,
                    }))
                  }}
                />
              </label>

              <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5">
                <h3 className="font-semibold text-[#081C2E]">
                  Você continua no controle
                </h3>
                <p className="mt-2 leading-7 text-slate-600">
                  Esta etapa beta organiza o seu contexto nesta sessão para validação da
                  experiência. Nenhuma informação desta tela gera avaliação institucional
                  automática. A persistência e o compartilhamento de dados serão ativados
                  apenas nos fluxos autorizados e transparentes do produto.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="submit"
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#081C2E] px-6 font-semibold text-white transition hover:bg-[#102B43]"
                >
                  Registrar contexto nesta sessão
                </button>
                <Link
                  href="/professor-digital"
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 px-6 font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Voltar ao Professor Digital
                </Link>
              </div>

              {saved ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
                  <p className="font-semibold">Contexto organizado para esta sessão.</p>
                  <p className="mt-1 text-sm leading-6">
                    Agora você pode levar esse contexto para Minha Atuação e observar como
                    suas escolhas dialogam com os registros autorizados da Agenda Inteligente
                    EDI.
                  </p>
                  <Link
                    href="/professor-digital/agenda"
                    className="mt-4 inline-flex font-semibold text-emerald-900 underline underline-offset-4"
                  >
                    Ir para Minha Atuação →
                  </Link>
                </div>
              ) : null}
            </form>
          </div>
        </section>
      </div>
    </main>
  )
}
