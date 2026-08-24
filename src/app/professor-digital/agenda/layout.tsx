import type { ReactNode } from 'react'

import { ProfessionalTrajectoryEIOSBridge } from '@/components/professor-digital/ProfessionalTrajectoryEIOSBridge'

export default function ProfessorDigitalAgendaLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <>
      {children}
      <section className="bg-[#EEF3F7] px-4 pb-12 sm:px-6 sm:pb-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <ProfessionalTrajectoryEIOSBridge />
        </div>
      </section>
    </>
  )
}
