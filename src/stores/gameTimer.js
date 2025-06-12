import { defineStore } from 'pinia'
import { saveTimerState, loadTimerState } from '../services/GameStateStorage'

export const useGameTimerStore = defineStore('gameTimer', {
  state: () => ({
    seconds: 0,
    isRunning: false,
    maxTime: 300, // 5 minutes default
    interval: null,
    lastWordFoundTime: 0,
    currentWordStartTime: 0,
  }),

  getters: {
    formattedTime: (state) => {
      const minutes = Math.floor(state.seconds / 60)
      const seconds = state.seconds % 60
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    },

    elapsedSinceLastWord: (state) => {
      return state.seconds - state.lastWordFoundTime
    },
  },

  actions: {
    startTimer() {
      if (this.interval) {
        clearInterval(this.interval)
      }
      this.isRunning = true
      this.interval = setInterval(() => {
        if (this.isRunning) {
          this.seconds++
          this.saveState()
        }
      }, 1000)
    },

    stopTimer() {
      if (this.interval) {
        clearInterval(this.interval)
        this.interval = null
      }
      this.isRunning = false
      this.saveState()
    },

    resetTimer() {
      this.stopTimer()
      this.seconds = 0
      this.lastWordFoundTime = 0
      this.currentWordStartTime = 0
      this.saveState()
    },

    markWordFound() {
      this.lastWordFoundTime = this.seconds
      this.currentWordStartTime = this.seconds
      this.saveState()
    },

    // Storage methods
    saveState() {
      // Don't save interval reference
      const stateToSave = { ...this.$state }
      delete stateToSave.interval
      saveTimerState(stateToSave)
    },

    loadState() {
      const savedState = loadTimerState()

      if (savedState) {
        // Restore state from storage
        this.$patch({
          seconds: savedState.seconds || 0,
          isRunning: false, // Always start paused when loading
          maxTime: savedState.maxTime || 300,
          lastWordFoundTime: savedState.lastWordFoundTime || 0,
          currentWordStartTime: savedState.currentWordStartTime || 0,
        })
      }
    },
  },
})
