'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type Report = {
  period: string
  summary: string
  productionCount: number
  themes: string[]
  reflections: string[]
  nextPossibilities: string[]
}

export default function RelatorioProfissionalPage() {
  const [report, setReport] = useState<Report | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/professor-digital/report', { credentials: 'include', cache: 'no-store' })
      .then(async response => {
        const result = await response.json() as { success?: boolean; report?: Report; error?: string }
        if (!response.ok || !result.success || !result.report) throw new Error(result.error ?? 'Não foi possível gerar o relatório.')
        setReport(result.report)
      })
      .catch(currentError => setError(currentError instanceof Error ? currentError.message : 'Não foi possível gerar o relatório.'))
  }, [])

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-10 sm:px-6 sm:py-16">
      <section className="mx-auto max-w-4xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="bg-[#081C2E] px-6 py-10 sm:px-10 sm:py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-200">Professor Digital · EIOS</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">Minha síntese profissional</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">Uma leitura reflexiva dos registros que você autorizou manter na sua memória profissional.</p>
        </div>

        <div className="px-6 py-10 sm:px-10 sm:py-14">
          {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-900">{error}</p> : null}
          {!report && !error ? <p className="text-slate-600">Preparando sua síntese...</p> : null}

          {report ? (
            <div className="space-y-8">
              <section>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">{report.period}</p>
                <h2 className="mt-3 text-2xl font-bold text-[#081C2E]">O que seus próprios registros ajudam a tornar visível</h2>
                <p className="mt-4 leading-8 text-slate-600">{report.summary}</p>
              </section>

              <section className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5"><p className="text-sm text-slate-500">Produções registradas</p><p className="mt-2 text-3xl font-bold text-[#081C2E]">{report.productionCount}</p></div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:col-span-2"><p className="text-sm text-slate-500">Temas que aparecem na memória</p><p className="mt-2 font-semibold text-[#081C2E]">{report.themes.length ? report.themes.join(' · ') : 'Ainda não há temas suficientes para uma leitura.'}</p></div>
              </section>

              <section><h2 className="text-2xl font-bold text-[#081C2E]">Aprendizagens que você registrou</h2>{report.reflections.length ? <ul className="mt-4 space-y-3">{report.reflections.map(item => <li key={item} className="rounded-2xl bg-slate-50 p-4 text-slate-600">{item}</li>)}</ul> : <p className="mt-4 text-slate-600">Nenhuma aprendizagem foi registrada ainda.</p>}</section>

              <section><h2 className="text-2xl font-bold text-[#081C2E]">Possibilidades para considerar</h2>{report.nextPossibilities.length ? <ul className="mt-4 space-y-3">{report.nextPossibilities.map(item => <li key={item} className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4 text-[#081C2E]">{item}</li>)}</ul> : <p className="mt-4 text-slate-600">Complete sua jornada para que o EIOS possa conectar mais elementos autorizados por você.</p>}</section>

              <div className="rounded-3xl border border-cyan-100 bg-cyan-50/60 p-6 text-sm leading-7 text-slate-700">Esta síntese não é uma avaliação institucional, diagnóstico ou classificação profissional. Ela organiza evidências e reflexões que você mesmo registrou e pode revisar.</div>
            </div>
          ) : null}

          <div className="mt-10"><Link href="/professor-digital" className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#081C2E] px-6 font-semibold text-white">Voltar ao Professor Digital</Link></div>
        </div>
      </section>
    </main>
  )
}
