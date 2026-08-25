import type { ReactNode } from 'react'

import { ProfessorDigitalJourney } from '@/components/professor-digital/ProfessorDigitalJourney'

export default function ProfessorDigitalLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <>
      <ProfessorDigitalJourney />
      {children}
    </>
  )
}
