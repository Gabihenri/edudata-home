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
  upcomingEvents: Awaited<ReturnType<typeof eventsService.listAll>>
  pendingTasks: Awaited<ReturnType<typeof tasksService.listAll>>
  recentEvidences: Awaited<
    ReturnType<typeof evidencesService.listAll>
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

class DashboardService {
  async getSummary(
    userId?: string,
  ): Promise<AgendaDashboardSummary> {
    const normalizedUserId = userId?.trim()

    /*
     * Segurança por padrão:
     * se a rota não informar o usuário autenticado,
     * nenhum dado será retornado.
     */
    if (!normalizedUserId) {
      return createEmptySummary()
    }

    const [
      events,
      tasks,
      planning,
      evidences,
      classes,
    ] = await Promise.all([
      eventsService.listAll(),
      tasksService.listAll(),
      planningService.listAll(),
      evidencesService.listAll(),
      classesService.listAll(),
    ])

    const userEvents = events.filter(
      (event) => event.user_id === normalizedUserId,
    )

    const userTasks = tasks.filter(
      (task) => task.user_id === normalizedUserId,
    )

    const userPlanning = planning.filter(
      (planningItem) =>
        planningItem.user_id === normalizedUserId,
    )

    const userEvidences = evidences.filter(
      (evidence) =>
        evidence.user_id === normalizedUserId,
    )

    const userClasses = classes.filter(
      (agendaClass) =>
        agendaClass.teacher_id === normalizedUserId,
    )

    const now = new Date()

    const upcomingEvents = userEvents
      .filter(
        (event) =>
          new Date(event.start_at).getTime() >= now.getTime(),
      )
      .slice(0, 5)

    const pendingTasks = userTasks
      .filter((task) => task.status !== 'concluida')
      .slice(0, 5)

    const recentEvidences = userEvidences.slice(0, 5)

    return {
      totals: {
        events: userEvents.length,
        tasks: userTasks.length,
        pendingTasks: userTasks.filter(
          (task) => task.status !== 'concluida',
        ).length,
        planning: userPlanning.length,
        evidences: userEvidences.length,
        classes: userClasses.length,
      },
      upcomingEvents,
      pendingTasks,
      recentEvidences,
    }
  }
}

export const dashboardService = new DashboardService()