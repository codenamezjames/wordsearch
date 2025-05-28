import { computed } from 'vue'
import { useUserStore } from '../stores/user'
import { useTimeFormat } from './useTimeFormat'

/**
 * @typedef {Object} GameStats
 * @property {string} category - Game category
 * @property {string} difficulty - Game difficulty
 * @property {number} timeInSeconds - Time taken in seconds
 * @property {number} wordsFound - Number of words found
 * @property {boolean} won - Whether the game was won
 */

/**
 * @typedef {Object} UserPreferences
 * @property {boolean} soundEnabled - Whether sound effects are enabled
 * @property {boolean} hintsEnabled - Whether hints are enabled
 * @property {string} theme - UI theme ('light' or 'dark')
 */

/**
 * User management composable
 * @returns {{
 *   totalGamesPlayed: import('vue').ComputedRef<number>,
 *   totalWordsFound: import('vue').ComputedRef<number>,
 *   totalTimePlayed: import('vue').ComputedRef<number>,
 *   winRate: import('vue').ComputedRef<number>,
 *   formattedTotalTime: import('vue').ComputedRef<string>,
 *   preferences: import('vue').ComputedRef<UserPreferences>,
 *   getHighScore: (category: string, difficulty: string) => number,
 *   getBestTime: (category: string, difficulty: string) => number,
 *   updateStats: (stats: GameStats) => void,
 *   updatePreferences: (prefs: Partial<UserPreferences>) => void,
 *   resetProgress: () => void
 * }}
 */
export function useUser() {
  const userStore = useUserStore()

  /** @type {import('vue').ComputedRef<number>} */
  const totalGamesPlayed = computed(() => userStore.stats.totalGamesPlayed)

  /** @type {import('vue').ComputedRef<number>} */
  const totalWordsFound = computed(() => userStore.stats.totalWordsFound)

  /** @type {import('vue').ComputedRef<number>} */
  const totalTimePlayed = computed(() => userStore.stats.totalTimePlayed)

  /** @type {import('vue').ComputedRef<number>} */
  const winRate = computed(() => {
    if (totalGamesPlayed.value === 0) return 0
    return Math.round((userStore.wins / totalGamesPlayed.value) * 100)
  })

  // Use the new time formatting utility with letter format
  const { formattedTime: formattedTotalTime } = useTimeFormat(totalTimePlayed, {
    useLetters: true,
    showHours: true,
  })

  /** @type {import('vue').ComputedRef<UserPreferences>} */
  const preferences = computed(() => userStore.preferences)

  /**
   * Get high score for a category and difficulty
   * @param {string} category - Game category
   * @param {string} difficulty - Game difficulty
   * @returns {number} - High score
   */
  const getHighScore = (category, difficulty) => {
    return userStore.getHighScore(category, difficulty)
  }

  /**
   * Get best completion time for a category and difficulty
   * @param {string} category - Game category
   * @param {string} difficulty - Game difficulty
   * @returns {number} - Best time in seconds
   */
  const getBestTime = (category, difficulty) => {
    const key = `${category}-${difficulty}`
    return userStore.bestTimes[key] || 0
  }

  /**
   * Update game statistics
   * @param {GameStats} stats - Game statistics
   * @returns {void}
   */
  const updateStats = (stats) => {
    userStore.updateStats(stats)
  }

  /**
   * Update user preferences
   * @param {Partial<UserPreferences>} prefs - User preferences
   * @returns {void}
   */
  const updatePreferences = (prefs) => {
    userStore.updatePreferences(prefs)
  }

  /**
   * Reset all user progress
   * @returns {void}
   */
  const resetProgress = () => {
    userStore.resetProgress()
  }

  return {
    totalGamesPlayed,
    totalWordsFound,
    totalTimePlayed,
    winRate,
    formattedTotalTime,
    preferences,
    getHighScore,
    getBestTime,
    updateStats,
    updatePreferences,
    resetProgress,
  }
}
