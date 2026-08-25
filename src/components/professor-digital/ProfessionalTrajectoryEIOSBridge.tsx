'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { useEvidences } from '@/lib/agenda/hooks/useEvidences'
import { useLessons } from '@/lib/agenda/hooks/useLessons'
import { useObjectives } from '@/lib/agenda/hooks/useObjectives'
import { usePlanning } from '@/lib/agenda/hooks/usePlanning'
import { useProfessionalTrajectoryAnalysis } from '@/lib/professor-digital/hooks/useProfessionalTrajectoryAnalysis'
import {
  readProfessionalProfileContext,
  type ProfessionalProfileContext,
} from '@/lib/professor-digital/profile-context'
import type { ProfessionalTrajectoryRecord } from '@/lib/professor-digital/services/professorDigitalIntelligence.service'

import { ProfessionalTrajectoryAnalysisPanel } from './ProfessionalTrajectoryAnalysisPanel'

function toRecord(source: ProfessionalTrajectoryRecord['source'], item: unknown): ProfessionalTrajectoryRecord {
  const record = item as Record<string, unknown>
  const title = typeof record.title === 'string' ? record.title : typeof record.name === 'string' ? record.name : source
  const tags = Array.isArray(record.tags) ? record.tags.filter((tag): tag is string => typeof tag === 'string') : undefined

  return {
    source,
    title,
    theme: typeof record.subject === 'string' ? record.subject : typeof record.theme === 'string' ? record.theme : undefined,
    area: typeof record.area === 'string' ? record.area : undefined,
    category: typeof record.category === 'string' ? record.category : undefined,
    tags,
    status: typeof record.status === 'string' ? record.status : undefined,
  }
}

export function ProfessionalTrajectoryEIOSBridge() {
  const { planning, loading: planningLoading } = usePlanning()
  const { objectives, loading: objectivesLoading } = useObjectives()
  const { lessons, loading: lessonsLoading } = useLessons()
  const { evidences, loading: evidencesLoading } = useEvidences()
  const { analysis, loading, error, runAnalysis } = useProfessionalTrajectoryAnalysis()
  const [profileContext, setProfileContext] = useState<ProfessionalProfileContext | null>(null)

  useEffect(() => {
    setProfileContext(readProfessionalProfileContext())
  }, [])

  const history = useMemo<ProfessionalTrajectoryRecord[]>(() => [
    ...planning.map(item => toRecord('planning', item)),
    ...lessons.map(item => toRecord('lesson', item)),
    ...objectives.map(item => toRecord('objective', item)),
    ...evidences.map(item => toRecord('evidence', item)),
  ], [evidences, lessons, objectives, planning])

  const recordsLoading = planningLoading || objectivesLoading || lessonsLoading || evidencesLoading

  const handleAnalyze = useCallback(() => {
    if (!profileContext) return
    void runAnalysis(profileContext, history)
  }, [history, profileContext, runAnalysis])

  return (
    <ProfessionalTrajectoryAnalysisPanel
      analysis={analysis}
      loading={loading}
      error={error}
      onAnalyze={handleAnalyze}
      disabled={!profileContext || recordsLoading}
    />
  )
}
