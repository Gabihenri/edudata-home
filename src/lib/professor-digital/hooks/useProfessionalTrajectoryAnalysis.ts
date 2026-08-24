'use client'

import { useCallback, useState } from 'react'

import {
  analyzeProfessionalTrajectory,
  type ProfessionalProfileContext,
  type ProfessionalTrajectoryAnalysis,
  type ProfessionalTrajectoryRecord,
} from '@/lib/professor-digital/services/professorDigitalIntelligence.service'

type AnalysisState = {
  analysis: ProfessionalTrajectoryAnalysis | null
  loading: boolean
  error: string | null
}

export function useProfessionalTrajectoryAnalysis() {
  const [state, setState] = useState<AnalysisState>({
    analysis: null,
    loading: false,
    error: null,
  })

  const runAnalysis = useCallback(async (
    context: ProfessionalProfileContext,
    history: ProfessionalTrajectoryRecord[],
  ) => {
    setState(current => ({ ...current, loading: true, error: null }))

    try {
      const analysis = await analyzeProfessionalTrajectory(context, history)
      setState({ analysis, loading: false, error: null })
      return analysis
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'Não foi possível processar sua leitura profissional agora.'
      setState(current => ({ ...current, loading: false, error: message }))
      return null
    }
  }, [])

  return {
    ...state,
    runAnalysis,
  }
}
