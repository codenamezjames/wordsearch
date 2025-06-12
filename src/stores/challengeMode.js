import { defineStore } from 'pinia'
import { saveChallengeState, loadChallengeState } from '../services/GameStateStorage'

export const useChallengeModeStore = defineStore('challengeMode', {
  state: () => ({
    isActive: false,
    currentRound: 1,
    totalRounds: 10,
    targetScore: 10000,
    cumulativeScore: 0,
    roundScores: [],
    category: null,
    difficulty: null,
    startTime: null,
    completed: false,
    success: false,
  }),

  getters: {
    challengeProgress: (state) => {
      if (!state.isActive) return 0
      return (state.cumulativeScore / state.targetScore) * 100
    },

    roundsRemaining: (state) => state.totalRounds - state.currentRound + 1,
  },

  actions: {
    initChallenge(category, difficulty) {
      const targets = {
        baby: 3000,
        easy: 5000,
        medium: 10000,
        hard: 15000,
      }

      this.isActive = true
      this.currentRound = 1
      this.totalRounds = 10
      this.targetScore = targets[difficulty] || 10000
      this.cumulativeScore = 0
      this.roundScores = []
      this.category = category
      this.difficulty = difficulty
      this.startTime = Date.now()
      this.completed = false
      this.success = false

      this.saveState()
    },

    completeRound(roundScore) {
      this.roundScores.push(roundScore)
      this.cumulativeScore += roundScore

      if (this.currentRound >= this.totalRounds) {
        this.completed = true
        this.success = this.cumulativeScore >= this.targetScore
      }

      this.saveState()
    },

    nextRound() {
      if (!this.completed) {
        this.currentRound++
        this.saveState()
      }
    },

    exitChallenge() {
      this.isActive = false
      this.saveState()
    },

    // Storage methods
    saveState() {
      saveChallengeState(this.$state)
    },

    loadState() {
      const savedState = loadChallengeState()

      if (savedState) {
        // Restore state from storage
        this.$patch({
          isActive: savedState.isActive || false,
          currentRound: savedState.currentRound || 1,
          totalRounds: savedState.totalRounds || 10,
          targetScore: savedState.targetScore || 10000,
          cumulativeScore: savedState.cumulativeScore || 0,
          roundScores: savedState.roundScores || [],
          category: savedState.category || null,
          difficulty: savedState.difficulty || null,
          startTime: savedState.startTime || null,
          completed: savedState.completed || false,
          success: savedState.success || false,
        })
      }
    },
  },
})
