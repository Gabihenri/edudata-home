'use client'

import {
  useMemo,
} from 'react'

import CommandCenter from '@/components/dashboard/CommandCenter'

import EDIIntelligencePanel, {
  type EDIIntelligencePanelState,
} from '@/components/core/intelligence/EDIIntelligencePanel'

import {
  createCommandCenterViewModel,
} from '@/lib/agenda/adapters/command-center.adapter'

import {
  useAgendaIntelligence,
} from '@/lib/agenda/hooks/useAgendaIntelligence'

type AgendaCommandCenterProps = {
  userName?: string | null

  className?: string
}

export default function AgendaCommandCenter({
  userName =
    null,

  className =
    '',
}: AgendaCommandCenterProps) {
  const intelligenceState =
    useAgendaIntelligence()

  const {
    intelligence,
    analytics,
    recommendations,
    loading,
  } = intelligenceState

  const commandCenterViewModel =
    useMemo(
      () =>
        createCommandCenterViewModel({
          analytics,
          recommendations,
        }),
      [
        analytics,
        recommendations,
      ],
    )

  const controlledPanelState =
    useMemo<
      EDIIntelligencePanelState
    >(
      () => ({
        intelligence:
          intelligenceState
            .intelligence,

        analytics:
          intelligenceState
            .analytics,

        insights:
          intelligenceState
            .insights,

        recommendations:
          intelligenceState
            .recommendations,

        loading:
          intelligenceState
            .loading,

        refreshing:
          intelligenceState
            .refreshing,

        error:
          intelligenceState
            .error,

        generatedAt:
          intelligenceState
            .generatedAt,

        operationalScore:
          intelligenceState
            .operationalScore,

        reload:
          intelligenceState
            .reload,
      }),
      [
        intelligenceState
          .analytics,

        intelligenceState
          .error,

        intelligenceState
          .generatedAt,

        intelligenceState
          .insights,

        intelligenceState
          .intelligence,

        intelligenceState
          .loading,

        intelligenceState
          .operationalScore,

        intelligenceState
          .recommendations,

        intelligenceState
          .refreshing,

        intelligenceState
          .reload,
      ],
    )

  const initialLoading =
    loading &&
    intelligence ===
      null

  return (
    <CommandCenter
      userName={
        userName
      }
      priorities={
        commandCenterViewModel
          .priorities
      }
      metrics={
        commandCenterViewModel
          .metrics
      }
      loading={
        initialLoading
      }
      className={
        className
      }
      intelligencePanel={
        <EDIIntelligencePanel
          source="agenda"
          title="Inteligência EDI"
          description="Leitura operacional da Agenda Inteligente EDI, produzida pelo EIOS a partir de planejamentos, objetivos, aulas e evidências autorizadas."
          maximumInsights={
            6
          }
          maximumRecommendations={
            6
          }
          showHeader={
            false
          }
          state={
            controlledPanelState
          }
        />
      }
    />
  )
}