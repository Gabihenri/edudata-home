import type { ReactNode } from 'react'

import Link from 'next/link'

import { ProfessorDigitalJourney } from '@/components/professor-digital/ProfessorDigitalJourney'

export default function ProfessorDigitalLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <>
      <div className="border-b border-cyan-200 bg-cyan-50">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-semibold text-[#081C2E]">
              Professor Digital Beta disponível
            </p>
            <p className="text-xs leading-5 text-slate-600">
              Os núcleos estão em evolução, mas a experiência beta já pode ser acessada.
            </p>
          </div>
          <Link
            href="/professor-digital/perfil"
            className="inline-flex min-h-10 w-fit items-center justify-center rounded-xl bg-[#0B7491] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#09657E]"
          >
            Começar minha experiência
          </Link>
        </div>
      </div>
      <ProfessorDigitalJourney />
      {children}
    </>
  )
}
