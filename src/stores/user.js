import { defineStore } from 'pinia'

const STORAGE_KEY = 'word-search-user-data'

export const useUserStore = defineStore('user', {
  state: () => {
    // Try to load state from localStorage
    const savedState = localStorage.getItem(STORAGE_KEY)
    const defaultState = {
      wins: 0,
      highScores: {}, // { 'category-difficulty': score }
      bestTimes: {}, // { 'category-difficulty': timeInSeconds }
      stats: {
        totalGamesPlayed: 0,
        totalWordsFound: 0,
        totalTimePlayed: 0, // in seconds
        averageGameTime: 0,
        fastestWin: null, // { category, difficulty, time }
      },
      preferences: {
        soundEnabled: true,
        hintsEnabled: false,
        theme: 'light', // for future dark mode support
      },
    }

    if (savedState) {
      try {
        return JSON.parse(savedState)
      } catch (e) {
        console.error('Error parsing saved user data:', e)
        return defaultState
      }
    }

    return defaultState
  },

  getters: {
    getHighScore: (state) => (category, difficulty) => {
      const key = `${category}-${difficulty}`
      return state.highScores[key] || 0
    },

    getBestTime: (state) => (category, difficulty) => {
      const key = `${category}-${difficulty}`
      return state.bestTimes[key] || 0
    },

    totalGamesPlayed: (state) => state.stats.totalGamesPlayed,
    totalWordsFound: (state) => state.stats.totalWordsFound,
    totalWins: (state) => state.wins,

    winRate: (state) => {
      if (state.stats.totalGamesPlayed === 0) return 0
      return ((state.wins / state.stats.totalGamesPlayed) * 100).toFixed(1)
    },

    formattedTotalTime: (state) => {
      const hours = Math.floor(state.stats.totalTimePlayed / 3600)
      const minutes = Math.floor((state.stats.totalTimePlayed % 3600) / 60)
      const seconds = state.stats.totalTimePlayed % 60

      if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`
      } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`
      } else {
        return `${seconds}s`
      }
    },
  },

  actions: {
    // Add save state method
    saveState() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.$state))
      } catch (e) {
        console.error('Error saving user data:', e)
      }
    },

    incrementWins() {
      this.wins++
      this.saveState()
    },

    updateHighScore(category, difficulty, score) {
      const key = `${category}-${difficulty}`
      const currentHigh = this.highScores[key] || 0

      if (score > currentHigh) {
        this.highScores[key] = score
        this.saveState()
        return true // New high score
      }
      return false
    },

    updateBestTime(category, difficulty, timeInSeconds) {
      const key = `${category}-${difficulty}`
      const currentBest = this.bestTimes[key] || Infinity

      if (timeInSeconds < currentBest) {
        this.bestTimes[key] = timeInSeconds
        this.saveState()
        return true // New best time
      }
      return false
    },

    updateStats(gameData) {
      this.stats.totalGamesPlayed++
      this.stats.totalWordsFound += gameData.wordsFound
      this.stats.totalTimePlayed += gameData.timeInSeconds
      this.stats.averageGameTime = Math.floor(
        this.stats.totalTimePlayed / this.stats.totalGamesPlayed,
      )

      // Update fastest win
      if (gameData.won) {
        if (!this.stats.fastestWin || gameData.timeInSeconds < this.stats.fastestWin.time) {
          this.stats.fastestWin = {
            category: gameData.category,
            difficulty: gameData.difficulty,
            time: gameData.timeInSeconds,
          }
        }
      }

      // Save after updating stats
      this.saveState()
    },

    updatePreference(key, value) {
      if (key in this.preferences) {
        this.preferences[key] = value
        this.saveState()
      }
    },

    resetStats() {
      this.wins = 0
      this.highScores = {}
      this.stats = {
        totalGamesPlayed: 0,
        totalWordsFound: 0,
        totalTimePlayed: 0,
        averageGameTime: 0,
        fastestWin: null,
      }
      this.saveState()
    },

    resetProgress() {
      this.resetStats()
      this.bestTimes = {}
      this.saveState()
    },

    updatePreferences(prefs) {
      this.preferences = { ...this.preferences, ...prefs }
      this.saveState()
    },
  },
})
