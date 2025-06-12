import { defineStore } from 'pinia'
import { saveGameState, loadGameState } from '../services/GameStateStorage'

export const useGameStateStore = defineStore('gameState', {
  state: () => ({
    // Grid state
    grid: [],
    gridSize: 10,

    // Game state
    isGameActive: false,
    gameComplete: false,
    currentCategory: 'animals',
    difficulty: 'medium',
    words: [],
    foundWords: new Set(),
    selectedCells: [],
    permanentLines: [],

    // Settings
    soundEnabled: true,
    hintsEnabled: false,

    // Animation data
    lastFoundWordData: null,
  }),

  getters: {
    foundWordsCount: (state) => state.foundWords.size,
    totalWords: (state) => state.words.length,
    progress: (state) =>
      state.words.length > 0 ? (state.foundWords.size / state.words.length) * 100 : 0,
    isGameComplete: (state) =>
      state.foundWords.size === state.words.length && state.words.length > 0,

    gridSizeForDifficulty: (state) => {
      const sizes = {
        baby: 8,
        easy: 8,
        medium: 10,
        hard: 12,
      }
      return sizes[state.difficulty] || 10
    },

    wordCountForDifficulty: (state) => {
      const counts = {
        baby: 1,
        easy: 5,
        medium: 8,
        hard: 12,
      }
      return counts[state.difficulty] || 8
    },
  },

  actions: {
    setCategory(category) {
      this.currentCategory = category
      this.saveState()
    },

    setDifficulty(difficulty) {
      if (this.difficulty !== difficulty) {
        this.difficulty = difficulty
        this.selectedCells = []
        this.permanentLines = []
        this.gridSize = this.gridSizeForDifficulty
        this.saveState()
      }
    },

    updateGrid(newGrid) {
      this.grid = newGrid
      this.saveState()
    },

    addFoundWord(word, wordData = null) {
      if (!this.foundWords.has(word)) {
        this.foundWords.add(word)
        if (wordData) {
          this.lastFoundWordData = wordData
        }
        this.saveState()
        return true
      }
      return false
    },

    toggleSound() {
      this.soundEnabled = !this.soundEnabled
      this.saveState()
    },

    toggleHints() {
      this.hintsEnabled = !this.hintsEnabled
      this.saveState()
    },

    resetGameState() {
      this.isGameActive = false
      this.gameComplete = false
      this.foundWords = new Set()
      this.selectedCells = []
      this.permanentLines = []
      this.grid = Array(this.gridSize)
        .fill(null)
        .map(() => Array(this.gridSize).fill(''))
      this.saveState()
    },

    // Storage methods
    saveState() {
      // Convert Set to Array for storage
      const stateToSave = { ...this.$state }
      stateToSave.foundWords = Array.from(this.foundWords)

      saveGameState(stateToSave)
    },

    loadState() {
      const savedState = loadGameState()

      if (savedState) {
        // Restore state from storage
        this.$patch({
          grid: savedState.grid || this.grid,
          gridSize: savedState.gridSize || this.gridSize,
          isGameActive: savedState.isGameActive || false,
          gameComplete: savedState.gameComplete || false,
          currentCategory: savedState.currentCategory || 'animals',
          difficulty: savedState.difficulty || 'medium',
          words: savedState.words || [],
          foundWords: savedState.foundWords || new Set(),
          selectedCells: savedState.selectedCells || [],
          permanentLines: savedState.permanentLines || [],
          soundEnabled: savedState.soundEnabled !== undefined ? savedState.soundEnabled : true,
          hintsEnabled: savedState.hintsEnabled || false,
        })
      }
    },
  },
})
