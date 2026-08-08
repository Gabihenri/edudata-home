'use client'

import Link from 'next/link'
import { type FormEvent, useEffect, useMemo, useState } from 'react'

import { AgendaPageShell } from '@/components/agenda/AgendaPageShell'

type CalendarContext = {
  id: string
  organization: { id: string; name: string }
  school: {
    id: string
    name: string
    shortName: string | null
    city: string | null
    state: string | null
  }
  roleLabel: string
  canManage: boolean
}

type IndividualIdentity = {
  professionalTitle: string | null
  registrationLabel: string | null
  registrationValue: string | null
  city: string | null
  state: string | null
  addressLine: string | null
  footerText: string | null
  showEduDataBrand: boolean
}

type IndividualProfile = {
  displayName: string
  email: string | null
  phone: string | null
  role: string
  identity: IndividualIdentity
}

type Organization = {
  id: string
  name: string
  short_name?: string | null
  document?: string | null
  email?: string | null
  phone?: string | null
  website?: string | null
  logo_url?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zip_code?: string | null
}

type School = {
  id: string
  name: string
  short_name?: string | null
  inep_code?: string | null
  principal_name?: string | null
  email?: string | null
  phone?: string | null
  website?: string | null
  postal_code?: string | null
  address?: string | null
  number?: string | null
  complement?: string | null
  district?: string | null
  city?: string | null
  state?: string | null
}

const fieldClass = 'mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-[#071827] outline-none focus:border-[#0B7491] focus:ring-4 focus:ring-cyan-100'

export default function DocumentIdentityPage() {
  const [contexts, setContexts] = useState<CalendarContext[]>([])
  const [contextId, setContextId] = useState('')
  const [profile, setProfile] = useState<IndividualProfile | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [school, setSchool] = useState<School | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')
  const [professionalTitle, setProfessionalTitle] = useState('Professor')
  const [registrationLabel, setRegistrationLabel] = useState('')
  const [registrationValue, setRegistrationValue] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [addressLine, setAddressLine] = useState('')
  const [footerText, setFooterText] = useState('')
  const [showEduDataBrand, setShowEduDataBrand] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const selectedContext = useMemo(
    () => contexts.find(item => item.id === contextId) ?? contexts[0] ?? null,
    [contexts, contextId],
  )

  useEffect(() => {
    let cancelled = false

    async function loadBase() {
      setLoading(true)
      setError(null)
      try {
        const [profileResponse, contextsResponse] = await Promise.all([
          fetch('/api/agenda/registry/document-identity', { credentials: 'include', cache: 'no-store' }),
          fetch('/api/agenda/institutional-calendar/contexts?limit=100', { credentials: 'include', cache: 'no-store' }),
        ])

        const profileBody = await profileResponse.json() as { success?: boolean; data?: IndividualProfile; error?: string }
        const contextsBody = await contextsResponse.json() as { success?: boolean; data?: CalendarContext[]; error?: string }

        if (!profileResponse.ok || !profileBody.success || !profileBody.data) {
          throw new Error(profileBody.error || 'Não foi possível carregar a identidade do usuário.')
        }

        if (!cancelled) {
          const nextProfile = profileBody.data
          setProfile(nextProfile)
          setDisplayName(nextProfile.displayName ?? '')
          setPhone(nextProfile.phone ?? '')
          setProfessionalTitle(nextProfile.identity.professionalTitle ?? 'Professor')
          setRegistrationLabel(nextProfile.identity.registrationLabel ?? '')
          setRegistrationValue(nextProfile.identity.registrationValue ?? '')
          setCity(nextProfile.identity.city ?? '')
          setState(nextProfile.identity.state ?? '')
          setAddressLine(nextProfile.identity.addressLine ?? '')
          setFooterText(nextProfile.identity.footerText ?? '')
          setShowEduDataBrand(nextProfile.identity.showEduDataBrand !== false)

          const nextContexts = contextsResponse.ok && contextsBody.success ? (contextsBody.data ?? []) : []
          setContexts(nextContexts)
          setContextId(nextContexts[0]?.id ?? '')
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar a identidade documental.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadBase()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!selectedContext) {
      setOrganization(null)
      setSchool(null)
      return
    }

    let cancelled = false
    async function loadInstitutionalIdentity() {
      try {
        const [organizationResponse, schoolResponse] = await Promise.all([
          fetch(`/api/organizations/${selectedContext!.organization.id}`, { credentials: 'include', cache: 'no-store' }),
          fetch(`/api/schools/${selectedContext!.school.id}`, { credentials: 'include', cache: 'no-store' }),
        ])

        const organizationBody = await organizationResponse.json() as { success?: boolean; data?: Organization }
        const schoolBody = await schoolResponse.json() as { success?: boolean; data?: School }

        if (!cancelled) {
          setOrganization(organizationResponse.ok && organizationBody.success ? (organizationBody.data ?? null) : null)
          setSchool(schoolResponse.ok && schoolBody.success ? (schoolBody.data ?? null) : null)
        }
      } catch {
        if (!cancelled) {
          setOrganization(null)
          setSchool(null)
        }
      }
    }

    void loadInstitutionalIdentity()
    return () => { cancelled = true }
  }, [selectedContext?.id])

  async function saveIndividual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/agenda/registry/document-identity', {
        method: 'PATCH',
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName,
          phone,
          identity: {
            professionalTitle,
            registrationLabel,
            registrationValue,
            city,
            state,
            addressLine,
            footerText,
            showEduDataBrand,
          },
        }),
      })

      const body = await response.json() as { success?: boolean; error?: string }
      if (!response.ok || !body.success) throw new Error(body.error || 'Não foi possível salvar a identidade.')
      setSuccess('Identidade individual salva. Os relatórios poderão reutilizar estes dados automaticamente.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Não foi possível salvar a identidade.')
    } finally {
      setSaving(false)
    }
  }

  const headerLocation = school
    ? [school.address, school.number, school.district, school.city, school.state].filter(Boolean).join(' · ')
    : [selectedContext?.school.city, selectedContext?.school.state].filter(Boolean).join(' · ')

  return (
    <AgendaPageShell
      eyebrow="EIOS Registry · Documentos"
      title="Identidade e Cabeçalho dos Relatórios"
      description="Defina uma vez os dados usados nos PDFs. Em contexto institucional, a Agenda reutiliza organizations e schools já existentes; em uso individual, utiliza o perfil profissional do professor."
    >
      <div className="space-y-6 sm:space-y-8">
        {contexts.length > 0 ? (
          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B7491]">Cabeçalho institucional</p>
            <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-end">
              <div>
                <h2 className="text-2xl font-bold text-[#071827]">Usar dados já cadastrados da instituição</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">A Agenda não duplica os dados de escolas e organizações. Selecione o contexto que será usado no documento.</p>
              </div>
              <label className="text-sm font-semibold text-slate-700">Instituição / unidade
                <select value={contextId} onChange={event => setContextId(event.target.value)} className={fieldClass}>
                  {contexts.map(item => <option key={item.id} value={item.id}>{item.organization.name} · {item.school.name}</option>)}
                </select>
              </label>
            </div>

            {selectedContext ? (
              <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Prévia do cabeçalho institucional</p>
                <div className="mx-auto mt-5 max-w-3xl text-center">
                  <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#0B7491]">{organization?.name ?? selectedContext.organization.name}</p>
                  <h3 className="mt-2 text-2xl font-bold text-[#071827]">{school?.name ?? selectedContext.school.name}</h3>
                  {school?.inep_code ? <p className="mt-1 text-sm text-slate-600">INEP {school.inep_code}</p> : null}
                  {headerLocation ? <p className="mt-2 text-sm text-slate-600">{headerLocation}</p> : null}
                  <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-slate-500">
                    {school?.phone ? <span>{school.phone}</span> : null}
                    {school?.email ? <span>{school.email}</span> : null}
                    {school?.website ? <span>{school.website}</span> : organization?.website ? <span>{organization.website}</span> : null}
                  </div>
                  {school?.principal_name ? <p className="mt-4 text-xs font-semibold text-slate-600">Direção: {school.principal_name}</p> : null}
                </div>
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-3">
              {selectedContext?.canManage ? (
                <Link href={`/schools/${selectedContext.school.id}`} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#071827] px-5 py-2.5 text-sm font-bold text-white">Editar dados da unidade</Link>
              ) : null}
              {selectedContext?.canManage ? (
                <Link href={`/organizations/${selectedContext.organization.id}`} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700">Editar organização</Link>
              ) : null}
            </div>
          </section>
        ) : null}

        <form onSubmit={saveIndividual} className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B7491]">Perfil profissional individual</p>
          <h2 className="mt-1 text-2xl font-bold text-[#071827]">Cabeçalho quando não houver instituição</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Também funciona como identidade profissional do usuário individual. O UUID interno nunca aparece no documento.</p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">Nome para documentos
              <input value={displayName} onChange={event => setDisplayName(event.target.value)} className={fieldClass} />
            </label>
            <label className="text-sm font-semibold text-slate-700">Título profissional
              <input value={professionalTitle} onChange={event => setProfessionalTitle(event.target.value)} className={fieldClass} placeholder="Ex.: Professor de Física" />
            </label>
            <label className="text-sm font-semibold text-slate-700">Telefone
              <input value={phone} onChange={event => setPhone(event.target.value)} className={fieldClass} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm font-semibold text-slate-700">Identificação profissional
                <input value={registrationLabel} onChange={event => setRegistrationLabel(event.target.value)} className={fieldClass} placeholder="Ex.: Registro" />
              </label>
              <label className="text-sm font-semibold text-slate-700">Número
                <input value={registrationValue} onChange={event => setRegistrationValue(event.target.value)} className={fieldClass} />
              </label>
            </div>
            <label className="text-sm font-semibold text-slate-700">Cidade
              <input value={city} onChange={event => setCity(event.target.value)} className={fieldClass} />
            </label>
            <label className="text-sm font-semibold text-slate-700">Estado
              <input value={state} onChange={event => setState(event.target.value)} className={fieldClass} />
            </label>
            <label className="text-sm font-semibold text-slate-700 md:col-span-2">Endereço ou linha complementar
              <input value={addressLine} onChange={event => setAddressLine(event.target.value)} className={fieldClass} />
            </label>
            <label className="text-sm font-semibold text-slate-700 md:col-span-2">Texto de rodapé
              <textarea value={footerText} onChange={event => setFooterText(event.target.value)} rows={3} className={fieldClass} placeholder="Texto opcional para documentos e relatórios." />
            </label>
          </div>

          <label className="mt-5 flex items-start gap-3 rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-slate-700">
            <input type="checkbox" checked={showEduDataBrand} onChange={event => setShowEduDataBrand(event.target.checked)} className="mt-1 h-4 w-4" />
            <span><strong className="text-[#071827]">Identificação EduData IA</strong><br />Permitir a indicação discreta de que o documento foi gerado pela Agenda Inteligente EDI.</span>
          </label>

          <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Prévia individual</p>
            <h3 className="mt-3 text-2xl font-bold text-[#071827]">{displayName || 'Nome do professor'}</h3>
            <p className="mt-1 text-sm font-semibold text-[#0B7491]">{professionalTitle || 'Professor'}</p>
            <p className="mt-2 text-sm text-slate-600">{profile?.email ?? ''}{phone ? `${profile?.email ? ' · ' : ''}${phone}` : ''}</p>
            {(city || state) ? <p className="mt-1 text-sm text-slate-500">{[city, state].filter(Boolean).join(' · ')}</p> : null}
          </div>

          {error ? <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">{error}</p> : null}
          {success ? <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{success}</p> : null}

          <button type="submit" disabled={saving || loading} className="mt-5 min-h-12 rounded-xl bg-[#0B7491] px-6 py-3 text-sm font-bold text-white disabled:opacity-50">
            {saving ? 'Salvando…' : 'Salvar identidade individual'}
          </button>
        </form>
      </div>
    </AgendaPageShell>
  )
}
