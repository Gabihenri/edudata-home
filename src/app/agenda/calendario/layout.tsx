import {
  type ReactNode,
} from 'react'

import {
  AgendaCalendarExperience,
} from '@/components/agenda/AgendaCalendarExperience'

type AgendaCalendarLayoutProps = {
  children: ReactNode
}

export default function AgendaCalendarLayout({
  children,
}: AgendaCalendarLayoutProps) {
  return (
    <AgendaCalendarExperience>
      {children}
    </AgendaCalendarExperience>
  )
}