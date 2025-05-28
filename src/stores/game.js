import { defineStore } from 'pinia'
import { useCategoriesStore } from './categories'

const STORAGE_KEY = 'word-search-game-state'

export const useGameStore = defineStore('game', {
  state: () => {
    // Try to load state from localStorage
    const savedState = localStorage.getItem(STORAGE_KEY)
    const defaultState = {
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

      // Timer state
      timer: {
        seconds: 0,
        isRunning: false,
        maxTime: 300, // 5 minutes default
        interval: null,
      },

      // Score state
      score: 0,
      lastWordTime: 0,
      totalAttempts: 0,
      combo: 0,

      // Settings
      soundEnabled: true,
      hintsEnabled: false,

      // Animation data
      lastFoundWordData: null,
    }

    if (savedState) {
      try {
        const parsed = JSON.parse(savedState)
        // Convert foundWords back to Set
        parsed.foundWords = new Set(parsed.foundWords)
        return parsed
      } catch (e) {
        console.error('Error parsing saved state:', e)
        return defaultState
      }
    }

    return defaultState
  },

  getters: {
    foundWordsCount: (state) => state.foundWords.size,
    totalWords: (state) => state.words.length,
    progress: (state) =>
      state.words.length > 0 ? (state.foundWords.size / state.words.length) * 100 : 0,
    isGameComplete: (state) =>
      state.foundWords.size === state.words.length && state.words.length > 0,

    formattedTime: (state) => {
      const minutes = Math.floor(state.timer.seconds / 60)
      const seconds = state.timer.seconds % 60
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    },

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
    // Add save state method
    saveState() {
      try {
        // Convert Set to Array for JSON serialization
        const stateToSave = {
          ...this.$state,
          foundWords: Array.from(this.foundWords),
          // Don't save timer interval
          timer: { ...this.timer, interval: null },
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave))
      } catch (e) {
        console.error('Error saving state:', e)
      }
    },

    initGame() {
      // Stop any existing timer
      this.stopTimer()

      // Initialize the game without starting it
      this.isGameActive = false
      this.gameComplete = false
      this.foundWords = new Set()
      this.score = 0
      this.lastWordTime = 0
      this.totalAttempts = 0
      this.combo = 0
      this.timer.seconds = 0
      this.timer.isRunning = false
      this.selectedCells = []
      this.permanentLines = []

      // Set grid size based on difficulty
      this.gridSize = this.gridSizeForDifficulty
      // Initialize empty grid
      this.grid = Array(this.gridSize)
        .fill(null)
        .map(() => Array(this.gridSize).fill(''))

      this.saveState()
    },

    startNewGame() {
      // Reset game state first
      this.initGame()

      // Get words for category
      const categoriesStore = useCategoriesStore()

      // Validate category exists
      if (!categoriesStore.categoryNames.includes(this.currentCategory)) {
        console.error('Invalid category:', this.currentCategory)
        this.currentCategory = 'animals' // fallback to default
      }

      // Get words and validate
      const selectedWords = categoriesStore.getRandomWords(
        this.currentCategory,
        this.wordCountForDifficulty,
      )

      if (!selectedWords || selectedWords.length === 0) {
        console.error('Failed to get words for category:', this.currentCategory)
        return
      }

      // Set words before grid initialization
      this.words = selectedWords

      // Start the game
      this.isGameActive = true
      this.timer.isRunning = true

      // Start timer interval
      this.startTimer()

      // Save state after game starts
      this.saveState()
    },

    startTimer() {
      if (this.timer.interval) {
        clearInterval(this.timer.interval)
      }
      this.timer.interval = setInterval(() => {
        if (this.timer.isRunning) {
          this.timer.seconds++
        }
      }, 1000)
    },

    stopTimer() {
      if (this.timer.interval) {
        clearInterval(this.timer.interval)
        this.timer.interval = null
      }
      this.timer.isRunning = false
    },

    updateGrid(newGrid) {
      this.grid = JSON.parse(JSON.stringify(newGrid)) // Deep copy to ensure reactivity
    },

    handleSelection(x, y) {
      if (!this.isGameActive) return

      // Only increment attempts when we have at least 2 cells selected
      // This prevents counting single cell selections as attempts
      if (this.selectedCells.length >= 1) {
        this.totalAttempts++
      }

      this.selectedCells.push({ x, y })
    },

    clearSelection() {
      this.selectedCells = []
    },

    addFoundWord(word, wordData = null) {
      if (!this.foundWords.has(word)) {
        console.log('Found new word:', word)
        this.foundWords.add(word)

        // Store the word data for animations
        if (wordData) {
          this.lastFoundWordData = wordData
        }

        // Calculate and add score
        const timeSinceLastWord = this.timer.seconds - this.lastWordTime
        const baseScore = 100
        const difficultyMultiplier =
          {
            baby: 0.5,
            easy: 1,
            medium: 1.5,
            hard: 2,
          }[this.difficulty] || 1

        // Calculate score with time bonus and difficulty multiplier
        let points = baseScore * difficultyMultiplier
        if (timeSinceLastWord < 5) {
          points *= 1.5 // Speed bonus
          this.combo++
        } else {
          this.combo = 0
        }

        // Add combo bonus
        points *= 1 + this.combo * 0.1

        // Update score and last word time
        this.score += Math.round(points)
        this.lastWordTime = this.timer.seconds

        // Save state after updating
        this.saveState()

        // Check for game completion
        if (this.isGameComplete) {
          this.handleWin()
        }
      }
    },

    handleWin() {
      console.log('Game won!')
      this.isGameActive = false
      this.gameComplete = true
      this.timer.isRunning = false
    },

    setDifficulty(difficulty) {
      if (this.difficulty !== difficulty) {
        console.log('Setting difficulty to:', difficulty)
        this.difficulty = difficulty

        // Reset selection state
        this.selectedCells = []
        this.permanentLines = []

        // Update grid size
        this.gridSize = this.gridSizeForDifficulty

        // Save state after updating
        this.saveState()

        // Start new game if active
        if (this.isGameActive) {
          this.startNewGame()
        }
      }
    },

    setCategory(category) {
      if (this.currentCategory !== category) {
        console.log('Setting category to:', category)
        this.currentCategory = category

        // Save state after updating
        this.saveState()

        if (this.isGameActive) {
          this.startNewGame()
        }
      }
    },

    toggleSound() {
      this.soundEnabled = !this.soundEnabled
      this.saveState()
    },

    toggleHints() {
      this.hintsEnabled = !this.hintsEnabled
      this.saveState()
    },

    useHint() {
      if (this.hintsEnabled && !this.gameComplete) {
        // TODO: Implement hint logic
        console.log('Hint used')
      }
    },

    addScore(points) {
      this.score += points
    },

    cleanup() {
      this.isGameActive = false
      this.stopTimer()
      this.grid = []
      this.words = []
      this.foundWords = new Set()
      this.selectedCells = []
      this.permanentLines = []
      this.saveState()
    },
  },
})
