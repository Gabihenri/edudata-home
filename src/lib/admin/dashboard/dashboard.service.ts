import {
  adminDashboardRepository,
  type AdminDashboardMetrics,
} from './dashboard.repository'

export type AdminDashboardOverview = {
  generatedAt: string
  metrics: AdminDashboardMetrics
  indicators: {
    freeToProConversionPercent: number
    openUpgradeRatePercent: number
    supportCriticalTotal: number
  }
}

function calculatePercentage(
  numerator: number,
  denominator: number,
): number {
  if (denominator <= 0) {
    return 0
  }

  return Number(
    (
      (numerator / denominator) *
      100
    ).toFixed(2),
  )
}

class AdminDashboardService {
  async getOverview(): Promise<AdminDashboardOverview> {
    const metrics =
      await adminDashboardRepository.getMetrics()

    const totalIndividualSubscriptions =
      metrics.subscriptions.freeActive +
      metrics.subscriptions.professorProActive

    const freeToProConversionPercent =
      calculatePercentage(
        metrics.subscriptions.professorProActive,
        totalIndividualSubscriptions,
      )

    const openUpgradeRatePercent =
      calculatePercentage(
        metrics.upgrades.open,
        metrics.users.total,
      )

    const supportCriticalTotal =
      metrics.support.urgent +
      metrics.support.highPriority

    return {
      generatedAt:
        new Date().toISOString(),

      metrics,

      indicators: {
        freeToProConversionPercent,
        openUpgradeRatePercent,
        supportCriticalTotal,
      },
    }
  }
}

export const adminDashboardService =
  new AdminDashboardService()