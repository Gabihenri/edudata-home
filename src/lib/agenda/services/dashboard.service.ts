import { classesService } from './classes.service'
import { evidencesService } from './evidences.service'
import { eventsService } from './events.service'
import { planningService } from './planning.service'
import { tasksService } from './tasks.service'

export type AgendaDashboardSummary = {
  totals: {
    events: number
    tasks: number
    pendingTasks: number
    planning: number
    evidences: number
    classes: number
  }

  upcomingEvents: Awaited<
    ReturnType<
      typeof eventsService.listByUserId
    >
  >

  pendingTasks: Awaited<
    ReturnType<
      typeof tasksService.listByUserId
    >
  >

  recentEvidences: Awaited<
    ReturnType<
      typeof evidencesService.listByUserId
    >
  >
}

function createEmptySummary(): AgendaDashboardSummary {
  return {
    totals: {
      events: 0,
      tasks: 0,
      pendingTasks: 0,
      planning: 0,
      evidences: 0,
      classes: 0,
    },
    upcomingEvents: [],
    pendingTasks: [],
    recentEvidences: [],
  }
}

function normalizeUserId(
  userId?: string,
): string | null {
  const normalizedUserId =
    userId?.trim()

  return normalizedUserId || null
}

class DashboardService {
  async getSummary(
    userId?: string,
  ): Promise<AgendaDashboardSummary> {
    const normalizedUserId =
      normalizeUserId(userId)

    /*
     * Segurança por padrão:
     * sem usuário autenticado, nenhum dado
     * será consultado ou retornado.
     */
    if (!normalizedUserId) {
      return createEmptySummary()
    }

    /*
     * Cada consulta já é limitada no banco
     * ao usuário autenticado.
     *
     * Nenhum registro de outro usuário é
     * carregado no servidor.
     */
    const [
      events,
      tasks,
      planning,
      evidences,
      classes,
    ] = await Promise.all([
      eventsService.listByUserId(
        normalizedUserId,
      ),

      tasksService.listByUserId(
        normalizedUserId,
      ),

      planningService.listByUserId(
        normalizedUserId,
      ),

      evidencesService.listByUserId(
        normalizedUserId,
      ),

      classesService.listByTeacherId(
        normalizedUserId,
      ),
    ])

    const now = Date.now()

    const upcomingEvents = events
      .filter((event) => {
        const startAt =
          new Date(
            event.start_at,
          ).getTime()

        return (
          !Number.isNaN(startAt) &&
          startAt >= now
        )
      })
      .sort((firstEvent, secondEvent) => {
        return (
          new Date(
            firstEvent.start_at,
          ).getTime() -
          new Date(
            secondEvent.start_at,
          ).getTime()
        )
      })
      .slice(0, 5)

    const allPendingTasks =
      tasks.filter(
        (task) =>
          task.status !== 'concluida',
      )

    const pendingTasks =
      allPendingTasks.slice(0, 5)

    const recentEvidences = [
      ...evidences,
    ]
      .sort(
        (
          firstEvidence,
          secondEvidence,
        ) => {
          return (
            new Date(
              secondEvidence.created_at,
            ).getTime() -
            new Date(
              firstEvidence.created_at,
            ).getTime()
          )
        },
      )
      .slice(0, 5)

    return {
      totals: {
        events: events.length,
        tasks: tasks.length,
        pendingTasks:
          allPendingTasks.length,
        planning: planning.length,
        evidences: evidences.length,
        classes: classes.length,
      },
      upcomingEvents,
      pendingTasks,
      recentEvidences,
    }
  }
}

export const dashboardService =
  new DashboardService()