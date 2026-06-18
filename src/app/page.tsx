import { FrameworkEDI } from '@/components/framework/FrameworkEDI'
import { ProfessorDigital } from '@/components/professor/ProfessorDigital'
import { AgendaInteligente } from '@/components/agenda/AgendaInteligente'

import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import AccessibilityBar from '@/components/layout/AccessibilityBar'

import InclusaoEDI from '@/components/home/InclusaoEDI'
import LaboratorioExperimental from '@/components/home/LaboratorioExperimental'
import EcossistemaFlow from '@/components/home/EcossistemaFlow'
import EduDataAnalytics from '@/components/home/EduDataAnalytics'
import SGPA from '@/components/home/SGPA'
import Participacao from '@/components/home/Participacao'

export default function Page() {
  return (
    <>
      <AccessibilityBar />
      <Header />

      <main>
        <section className="min-h-screen bg-gradient-to-br from-[#F5F6F8] via-white to-[#E8EEF4] px-6 py-24 md:px-20">
          <div className="mx-auto grid max-w-7xl gap-16 md:grid-cols-[1fr_1.1fr] md:items-center">
            <div className="space-y-8">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
                Framework EDI
              </p>

              <h1 className="text-5xl font-bold leading-tight md:text-7xl">
                <span className="text-[#0A3A5E]">Evidências.</span>
                <br />
                <span className="text-[#1B6B3A]">Inclusão.</span>
                <br />
                <span className="text-[#5C1A8C]">Inteligência.</span>
              </h1>

              <p className="max-w-2xl text-xl leading-9 text-slate-600">
                Transformando dados educacionais em decisões inteligentes.
              </p>

              <p className="max-w-2xl text-lg leading-8 text-slate-500">
                A EduData IA organiza desenvolvimento profissional, registros
                pedagógicos, evidências e análise de dados em um ecossistema
                educacional integrado.
              </p>

              <div className="flex flex-wrap gap-4">
                <a
                  href="#framework"
                  className="rounded-full bg-[#0A3A5E] px-7 py-4 font-semibold text-white transition hover:opacity-90"
                >
                  Conheça o Framework EDI
                </a>

                <a
                  href="#agenda"
                  className="rounded-full border border-[#5C1A8C] px-7 py-4 font-semibold text-[#5C1A8C] transition hover:bg-[#5C1A8C] hover:text-white"
                >
                  Agenda Inteligente EDI
                </a>
              </div>
            </div>

            <div className="relative hidden md:block">
              <div className="absolute -left-10 top-8 h-28 w-28 clip-polygon-triangle bg-[#0A3A5E]/15" />
              <div className="absolute right-10 top-28 h-24 w-24 clip-polygon-diamond bg-[#1B6B3A]/15" />
              <div className="absolute bottom-4 left-32 h-28 w-28 clip-polygon-hexagon bg-[#5C1A8C]/15" />

              <div className="rounded-[2rem] border border-white/70 bg-white/70 p-10 shadow-xl backdrop-blur">
                <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                  EduData IA
                </p>

                <h2 className="text-4xl font-bold leading-tight text-slate-950">
                  Princípios que viram método.
                  <br />
                  Método que gera dados.
                  <br />
                  Dados que orientam decisões.
                </h2>

                <p className="mt-6 text-lg leading-8 text-slate-600">
                  Uma plataforma criada a partir do Framework EDI para apoiar
                  escolas, educadores e gestores na melhoria contínua da prática
                  educacional.
                </p>
              </div>
            </div>
          </div>
        </section>

        <FrameworkEDI />
        <ProfessorDigital />
        <AgendaInteligente />
        <InclusaoEDI />
        <LaboratorioExperimental />
        <EcossistemaFlow />
        <EduDataAnalytics />
        <SGPA />
        <Participacao />
      </main>

      <Footer />
    </>
  )
}