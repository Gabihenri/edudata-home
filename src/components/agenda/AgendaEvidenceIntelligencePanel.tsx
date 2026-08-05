'use client'

import {
  EvidenceIntelligencePanel,
} from '@/components/agenda/EvidenceIntelligencePanel'

type AgendaEvidenceIntelligencePanelProps = {
  evidenceId:
    string

  evidenceTitle?:
    string

  initiallyOpen?:
    boolean
}

export function AgendaEvidenceIntelligencePanel({
  evidenceId,
  evidenceTitle,
  initiallyOpen = false,
}: AgendaEvidenceIntelligencePanelProps) {
  return (
    <EvidenceIntelligencePanel
      evidenceId={
        evidenceId
      }
      evidenceTitle={
        evidenceTitle
      }
      initiallyOpen={
        initiallyOpen
      }
    />
  )
}