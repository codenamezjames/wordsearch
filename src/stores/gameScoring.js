import { defineStore } from 'pinia'
import { useGameStateStore } from './gameState'
import { useGameTimerStore } from './gameTimer'
import { saveScoringState, loadScoringState } from '../services/GameStateStorage'

export const useGameScoringStore = defineStore('gameScoring', {
  state: () => ({
    score: 0,
    baseWordPoints: 100,
    scoreMultiplier: 1,
    chainMultiplier: 1,
    gracePeriod: 3, // 3 seconds grace period
    totalAttempts: 0,
  }),

  getters: {
    formattedScore: (state) => state.score.toLocaleString(),
  },

  actions: {
    calculateWordScore(_word) {
      const gameState = useGameStateStore()
      const timer = useGameTimerStore()

      const currentTime = timer.seconds
      const startTime = timer.currentWordStartTime
      const basePoints = this.baseWordPoints
      const gracePeriod = this.gracePeriod

      // Calculate time elapsed since last word or game start
      const timeElapsed = Math.max(0, currentTime - startTime)

      // Only reduce points after grace period
      const effectiveTimeElapsed = Math.max(0, timeElapsed - gracePeriod)

      // Calculate base points with minimum of 10
      let points = Math.max(10, basePoints - effectiveTimeElapsed)

      // Apply difficulty multiplier
      const difficultyMultipliers = {
        baby: 0.5,
        easy: 1,
        medium: 1.5,
        hard: 2,
      }
      const difficultyMultiplier = difficultyMultipliers[gameState.difficulty] || 1

      points = points * difficultyMultiplier

      // Apply any active multipliers
      points = points * this.scoreMultiplier * this.chainMultiplier

      // Round and ensure minimum
      return Math.max(10, Math.round(points))
    },

    addScore(points) {
      this.score += points
      const timer = useGameTimerStore()
      timer.markWordFound()
      this.saveState()
    },

    incrementAttempts() {
      this.totalAttempts++
      this.saveState()
    },

    resetScore() {
      this.score = 0
      this.scoreMultiplier = 1
      this.chainMultiplier = 1
      this.totalAttempts = 0
      this.saveState()
    },

    setMultiplier(multiplier) {
      this.scoreMultiplier = multiplier
      this.saveState()
    },

    setChainMultiplier(multiplier) {
      this.chainMultiplier = multiplier
      this.saveState()
    },

    // Storage methods
    saveState() {
      saveScoringState(this.$state)
    },

    loadState() {
      const savedState = loadScoringState()

      if (savedState) {
        // Restore state from storage
        this.$patch({
          score: savedState.score || 0,
          baseWordPoints: savedState.baseWordPoints || 100,
          scoreMultiplier: savedState.scoreMultiplier || 1,
          chainMultiplier: savedState.chainMultiplier || 1,
          gracePeriod: savedState.gracePeriod !== undefined ? savedState.gracePeriod : 3,
          totalAttempts: savedState.totalAttempts || 0,
        })
      }
    },
  },
})
