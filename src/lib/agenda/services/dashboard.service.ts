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
  recentEvidences: Awaited<ReturnType<typeof evidencesService.listAll>>
}

class DashboardService {
  async getSummary(): Promise<AgendaDashboardSummary> {
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

    const now = new Date()

    const upcomingEvents = events
      .filter((event) => new Date(event.start_at) >= now)
      .slice(0, 5)

    const pendingTasks = tasks
      .filter((task) => task.status !== 'concluida')
      .slice(0, 5)

    const recentEvidences = evidences.slice(0, 5)

    return {
      totals: {
        events: events.length,
        tasks: tasks.length,
        pendingTasks: tasks.filter(
          (task) => task.status !== 'concluida',
        ).length,
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

export const dashboardService = new DashboardService()