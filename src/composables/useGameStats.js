// useGameStats.js - Game scoring and statistics
import { ref, computed } from 'vue'
import { useGameStore } from '../stores/game'
import { useUserStore } from '../stores/user'

/**
 * @typedef {Object} ScoreContext
 * @property {number} timeSinceLastWord - Time since last word was found
 * @property {number} combo - Current combo count
 * @property {('baby'|'easy'|'medium'|'hard')} difficulty - Game difficulty
 * @property {boolean} hintsUsed - Whether hints were used
 * @property {boolean} isFirstWinToday - Whether this is the first win today
 */

/**
 * @typedef {Object} Achievement
 * @property {('speed'|'accuracy'|'combo'|'score')} type - Achievement type
 * @property {string} title - Achievement title
 * @property {string} description - Achievement description
 */

/**
 * Game statistics composable for tracking scores and achievements
 * @returns {{
 *   accuracy: import('vue').ComputedRef<number>,
 *   progress: import('vue').ComputedRef<number>,
 *   formattedScore: import('vue').ComputedRef<string>,
 *   isNewHighScore: import('vue').ComputedRef<boolean>,
 *   previousHighScore: import('vue').ComputedRef<number>,
 *   calculateScore: (baseScore?: number, context?: ScoreContext) => number,
 *   handleWordFound: () => void,
 *   resetStats: () => void,
 *   checkAchievements: () => Achievement[]
 * }}
 */
export function useGameStats() {
  const gameStore = useGameStore()
  const userStore = useUserStore()

  /** @type {import('vue').Ref<number>} */
  const lastWordTime = ref(0)

  /** @type {Object.<string, (score: number, context: ScoreContext) => number>} */
  const modifiers = {
    // Time bonus (faster finds = more points)
    timeBonus: (score, context) => {
      const { timeSinceLastWord } = context
      if (timeSinceLastWord < 2) return score + 100 // Super fast bonus
      if (timeSinceLastWord < 5) return score + 50 // Fast bonus
      if (timeSinceLastWord < 10) return score + 25 // Quick bonus
      return score
    },

    // Combo bonus for consecutive quick finds
    comboBonus: (score, context) => {
      const { timeSinceLastWord, combo } = context
      if (timeSinceLastWord < 5) {
        return score * (1 + combo * 0.1) // 10% bonus per combo
      }
      return score
    },

    // Difficulty multiplier
    difficultyBonus: (score, context) => {
      const multipliers = {
        baby: 0.5,
        easy: 1,
        medium: 1.5,
        hard: 2,
      }
      return score * (multipliers[context.difficulty] || 1)
    },

    // Bonus for not using hints
    noHintsBonus: (score, context) => {
      if (!context.hintsUsed) return score + 100
      return score
    },

    // First win of the day bonus
    firstWinBonus: (score, context) => {
      if (context.isFirstWinToday) return score * 1.2 // 20% bonus
      return score
    },
  }

  /**
   * Calculate score with all modifiers
   * @param {number} [baseScore=100] - Base score for finding a word
   * @param {Partial<ScoreContext>} [context={}] - Score context
   * @returns {number} - Final score after applying modifiers
   */
  const calculateScore = (baseScore = 100, context = {}) => {
    return Object.values(modifiers).reduce((score, modifier) => {
      return Math.round(
        modifier(score, {
          timeSinceLastWord: context.timeSinceLastWord,
          combo: gameStore.combo,
          difficulty: gameStore.difficulty,
          hintsUsed: gameStore.hintsEnabled,
          isFirstWinToday: context.isFirstWinToday,
          ...context,
        }),
      )
    }, baseScore)
  }

  /** @type {import('vue').ComputedRef<number>} */
  const accuracy = computed(() => {
    if (gameStore.totalAttempts === 0) return 100
    return Math.round((gameStore.foundWordsCount / gameStore.totalAttempts) * 100)
  })

  /** @type {import('vue').ComputedRef<number>} */
  const progress = computed(() => {
    if (gameStore.totalWords === 0) return 0
    return Math.round((gameStore.foundWordsCount / gameStore.totalWords) * 100)
  })

  /** @type {import('vue').ComputedRef<string>} */
  const formattedScore = computed(() => gameStore.score.toLocaleString())

  /** @type {import('vue').ComputedRef<boolean>} */
  const isNewHighScore = computed(() => {
    const currentScore = gameStore.score
    const previousBest = userStore.getHighScore(gameStore.currentCategory, gameStore.difficulty)
    return currentScore > (previousBest || 0)
  })

  /** @type {import('vue').ComputedRef<number>} */
  const previousHighScore = computed(
    () => userStore.getHighScore(gameStore.currentCategory, gameStore.difficulty) || 0,
  )

  /**
   * Check for achievements based on current game state
   * @returns {Achievement[]} - List of earned achievements
   */
  const checkAchievements = () => {
    const achievements = []

    // Speed achievements
    if (gameStore.timer.seconds < 60 && progress.value === 100) {
      achievements.push({
        type: 'speed',
        title: 'Speed Demon',
        description: 'Complete a game in under 1 minute',
      })
    }

    // Accuracy achievements
    if (accuracy.value === 100 && gameStore.totalAttempts > 5) {
      achievements.push({
        type: 'accuracy',
        title: 'Perfect Aim',
        description: '100% accuracy with more than 5 attempts',
      })
    }

    // Combo achievements
    if (gameStore.combo >= 5) {
      achievements.push({
        type: 'combo',
        title: 'Combo Master',
        description: 'Get a 5x combo',
      })
    }

    // Score achievements
    if (gameStore.score > 10000) {
      achievements.push({
        type: 'score',
        title: 'High Roller',
        description: 'Score over 10,000 points',
      })
    }

    return achievements
  }

  /**
   * Handle word found event
   * @returns {void}
   */
  const handleWordFound = () => {
    const now = gameStore.timer.seconds
    const timeSinceLastWord = now - lastWordTime.value
    lastWordTime.value = now

    // Calculate and add score
    const points = calculateScore(100, { timeSinceLastWord })
    gameStore.addScore(points)

    // Update combo
    if (timeSinceLastWord < 5) {
      gameStore.combo++
    } else {
      gameStore.combo = 0
    }

    // Check for game completion
    if (progress.value === 100) {
      const achievements = checkAchievements()
      userStore.updateStats({
        category: gameStore.currentCategory,
        difficulty: gameStore.difficulty,
        score: gameStore.score,
        time: gameStore.timer.seconds,
        accuracy: accuracy.value,
        achievements,
      })
    }
  }

  /**
   * Reset stats for new game
   * @returns {void}
   */
  const resetStats = () => {
    lastWordTime.value = 0
    gameStore.combo = 0
    gameStore.score = 0
    gameStore.totalAttempts = 0
  }

  return {
    // Stats
    accuracy,
    progress,
    formattedScore,
    isNewHighScore,
    previousHighScore,

    // Methods
    calculateScore,
    handleWordFound,
    resetStats,
    checkAchievements,
  }
}
