import { JobCard, JobCardStatus, DependencyCheckResult } from '@/types/job-card'

/**
 * Check if a job card can start based on its dependencies
 */
export function checkDependencies(
  jobCardId: string,
  allJobCards: JobCard[]
): DependencyCheckResult {
  const jobCard = allJobCards.find(jc => jc.id === jobCardId)

  if (!jobCard) {
    return {
      canStart: false,
      blockedBy: [],
      blocks: []
    }
  }

  // Find job cards that are blocking this one
  const blockedBy = jobCard.dependsOnJobCardIds
    .map(id => allJobCards.find(jc => jc.id === id || jc.jobCardNo === id))
    .filter((jc): jc is JobCard => jc !== undefined && jc.status !== JobCardStatus.COMPLETED)

  // Find job cards that this one blocks
  const blocks = allJobCards.filter(jc =>
    jc.dependsOnJobCardIds.includes(jobCard.id) ||
    jc.dependsOnJobCardIds.includes(jobCard.jobCardNo)
  )

  return {
    canStart: blockedBy.length === 0 && jobCard.status !== JobCardStatus.BLOCKED,
    blockedBy,
    blocks
  }
}

/**
 * Update dependent job cards when a job card is completed
 * Returns updated array of all job cards
 */
export function updateDependentJobCards(
  completedJobCardId: string,
  allJobCards: JobCard[]
): JobCard[] {
  const completedCard = allJobCards.find(jc => jc.id === completedJobCardId)
  if (!completedCard) return allJobCards

  return allJobCards.map(jc => {
    // Check if this job card depends on the completed one
    const dependsOnCompleted =
      jc.dependsOnJobCardIds.includes(completedJobCardId) ||
      jc.dependsOnJobCardIds.includes(completedCard.jobCardNo)

    if (dependsOnCompleted) {
      // Remove from blockedBy array
      const newBlockedBy = jc.blockedBy.filter(
        id => id !== completedJobCardId && id !== completedCard.jobCardNo
      )

      // If no more blockers and currently blocked, change to ready
      if (newBlockedBy.length === 0 && jc.status === JobCardStatus.BLOCKED) {
        return {
          ...jc,
          blockedBy: newBlockedBy,
          status: JobCardStatus.READY,
          updatedAt: new Date(),
          updatedBy: 'system'
        }
      }

      return {
        ...jc,
        blockedBy: newBlockedBy,
        updatedAt: new Date()
      }
    }

    return jc
  })
}

/**
 * Check if a job card can be deleted (no dependent job cards)
 */
export function canDeleteJobCard(
  jobCardId: string,
  allJobCards: JobCard[]
): { canDelete: boolean; reason?: string; dependentCards?: JobCard[] } {
  const jobCard = allJobCards.find(jc => jc.id === jobCardId)
  if (!jobCard) {
    return { canDelete: false, reason: 'Job card not found' }
  }

  const dependentCards = allJobCards.filter(jc =>
    jc.dependsOnJobCardIds.includes(jobCardId) ||
    jc.dependsOnJobCardIds.includes(jobCard.jobCardNo)
  )

  if (dependentCards.length > 0) {
    return {
      canDelete: false,
      reason: `Cannot delete. ${dependentCards.length} job card(s) depend on this one.`,
      dependentCards
    }
  }

  return { canDelete: true }
}

/**
 * Detect circular dependencies in job cards
 */
export function detectCircularDependency(
  jobCardId: string,
  dependsOn: string[],
  allJobCards: JobCard[]
): boolean {
  const visited = new Set<string>()
  const stack = new Set<string>()

  function hasCycle(currentId: string): boolean {
    if (stack.has(currentId)) return true
    if (visited.has(currentId)) return false

    visited.add(currentId)
    stack.add(currentId)

    const currentCard = allJobCards.find(jc => jc.id === currentId || jc.jobCardNo === currentId)
    if (currentCard) {
      for (const depId of currentCard.dependsOnJobCardIds) {
        if (hasCycle(depId)) return true
      }
    }

    // Check new dependencies
    if (currentId === jobCardId) {
      for (const depId of dependsOn) {
        if (hasCycle(depId)) return true
      }
    }

    stack.delete(currentId)
    return false
  }

  return hasCycle(jobCardId)
}

/**
 * Get the execution order of job cards based on dependencies
 */
export function getExecutionOrder(jobCards: JobCard[]): JobCard[][] {
  const levels: JobCard[][] = []
  const processed = new Set<string>()

  while (processed.size < jobCards.length) {
    const currentLevel = jobCards.filter(jc => {
      if (processed.has(jc.id)) return false

      // Check if all dependencies are processed
      return jc.dependsOnJobCardIds.every(depId => {
        const depCard = jobCards.find(c => c.id === depId || c.jobCardNo === depId)
        return !depCard || processed.has(depCard.id)
      })
    })

    if (currentLevel.length === 0) {
      // If no cards can be processed, there might be a circular dependency
      break
    }

    levels.push(currentLevel)
    currentLevel.forEach(jc => processed.add(jc.id))
  }

  return levels
}

/**
 * Calculate the critical path (longest sequence) through job cards
 */
export function calculateCriticalPath(jobCards: JobCard[]): {
  path: JobCard[]
  totalTime: number
} {
  const levels = getExecutionOrder(jobCards)
  let longestPath: JobCard[] = []
  let longestTime = 0

  function findPath(
    currentCard: JobCard,
    currentPath: JobCard[],
    currentTime: number
  ) {
    const newPath = [...currentPath, currentCard]
    const newTime = currentTime + currentCard.estimatedTotalTimeMin

    // Find dependent cards
    const dependents = jobCards.filter(jc =>
      jc.dependsOnJobCardIds.includes(currentCard.id) ||
      jc.dependsOnJobCardIds.includes(currentCard.jobCardNo)
    )

    if (dependents.length === 0) {
      // End of path
      if (newTime > longestTime) {
        longestTime = newTime
        longestPath = newPath
      }
    } else {
      // Continue with dependents
      dependents.forEach(dep => findPath(dep, newPath, newTime))
    }
  }

  // Start from cards with no dependencies
  const startCards = jobCards.filter(jc => jc.dependsOnJobCardIds.length === 0)
  startCards.forEach(card => findPath(card, [], 0))

  return {
    path: longestPath,
    totalTime: longestTime
  }
}
