import { defineStore } from 'pinia'
import { useGameStateStore } from './gameState'
import { useGameTimerStore } from './gameTimer'
import { useGameScoringStore } from './gameScoring'
import { useChallengeModeStore } from './challengeMode'
import { useCategoriesStore } from './categories'
import { saveSettings, loadSettings } from '../services/GameStateStorage'

export const useGameStore = defineStore('game', {
  state: () => ({
    // App-level settings that don't belong in individual stores
    appSettings: {
      darkMode: false,
      vibrationEnabled: true,
      autoSave: true,
    },
    // Flag to track if stores have been initialized
    initialized: false,
  }),

  getters: {
    // Delegate to sub-stores for backward compatibility
    grid: () => useGameStateStore().grid,
    gridSize: () => useGameStateStore().gridSize,
    isGameActive: () => useGameStateStore().isGameActive,
    gameComplete: () => useGameStateStore().gameComplete,
    currentCategory: () => useGameStateStore().currentCategory,
    difficulty: () => useGameStateStore().difficulty,
    words: () => useGameStateStore().words,
    foundWords: () => useGameStateStore().foundWords,
    foundWordsCount: () => useGameStateStore().foundWordsCount,
    totalWords: () => useGameStateStore().totalWords,
    progress: () => useGameStateStore().progress,
    soundEnabled: () => useGameStateStore().soundEnabled,
    hintsEnabled: () => useGameStateStore().hintsEnabled,
    lastFoundWordData: () => useGameStateStore().lastFoundWordData,
    selectedCells: () => useGameStateStore().selectedCells,
    permanentLines: () => useGameStateStore().permanentLines,
    isGameComplete: () => useGameStateStore().isGameComplete,
    gridSizeForDifficulty: () => useGameStateStore().gridSizeForDifficulty,
    wordCountForDifficulty: () => useGameStateStore().wordCountForDifficulty,

    // Timer getters
    timer: () => ({
      seconds: useGameTimerStore().seconds,
      isRunning: useGameTimerStore().isRunning,
    }),
    formattedTime: () => useGameTimerStore().formattedTime,

    // Scoring getters
    score: () => useGameScoringStore().score,
    totalAttempts: () => useGameScoringStore().totalAttempts,
    formattedScore: () => useGameScoringStore().formattedScore,

    // Challenge mode getters
    challengeMode: () => useChallengeModeStore().$state,
    isChallengeMode: () => useChallengeModeStore().isActive,
    challengeProgress: () => useChallengeModeStore().challengeProgress,
    challengeRoundsRemaining: () => useChallengeModeStore().roundsRemaining,
  },

  actions: {
    /**
     * Initialize all stores and load saved data
     */
    initialize() {
      if (this.initialized) return

      // Load settings first
      this.loadSettings()

      // Initialize sub-stores
      const gameState = useGameStateStore()
      const timer = useGameTimerStore()
      const scoring = useGameScoringStore()
      const challenge = useChallengeModeStore()

      // Load saved state for each store
      gameState.loadState()
      timer.loadState()
      scoring.loadState()
      challenge.loadState()

      this.initialized = true
    },

    /**
     * Start a new game
     */
    startNewGame() {
      // Ensure stores are initialized
      this.initialize()

      const gameState = useGameStateStore()
      const timer = useGameTimerStore()
      const scoring = useGameScoringStore()
      const categories = useCategoriesStore()

      // Reset all stores
      gameState.resetGameState()
      timer.resetTimer()
      scoring.resetScore()

      // Get words for category
      const selectedWords = categories.getRandomWords(
        gameState.currentCategory,
        gameState.wordCountForDifficulty,
      )

      if (!selectedWords || selectedWords.length === 0) {
        console.error('Failed to get words for category:', gameState.currentCategory)
        return
      }

      // Set up new game
      gameState.words = selectedWords
      gameState.isGameActive = true
      timer.startTimer()
    },

    /**
     * Add a found word and calculate score
     */
    addFoundWord(word, wordData = null) {
      const gameState = useGameStateStore()
      const scoring = useGameScoringStore()

      if (gameState.addFoundWord(word, wordData)) {
        const points = scoring.calculateWordScore(word)
        scoring.addScore(points)

        if (gameState.isGameComplete) {
          this.handleWin()
        }

        return points
      }
      return 0
    },

    /**
     * Handle game completion
     */
    handleWin() {
      const gameState = useGameStateStore()
      const timer = useGameTimerStore()
      const challengeMode = useChallengeModeStore()
      const scoring = useGameScoringStore()

      gameState.isGameActive = false
      gameState.gameComplete = true
      timer.stopTimer()

      if (challengeMode.isActive) {
        challengeMode.completeRound(scoring.score)
      }
    },

    // Settings management
    saveSettings() {
      saveSettings(this.appSettings)
    },

    loadSettings() {
      const settings = loadSettings()
      if (settings) {
        this.appSettings = {
          ...this.appSettings,
          ...settings,
        }
      }
    },

    setDarkMode(enabled) {
      this.appSettings.darkMode = enabled
      this.saveSettings()
    },

    setVibration(enabled) {
      this.appSettings.vibrationEnabled = enabled
      this.saveSettings()
    },

    setAutoSave(enabled) {
      this.appSettings.autoSave = enabled
      this.saveSettings()
    },

    // Delegate methods for backward compatibility
    setCategory: (category) => useGameStateStore().setCategory(category),
    setDifficulty: (difficulty) => useGameStateStore().setDifficulty(difficulty),
    updateGrid: (grid) => useGameStateStore().updateGrid(grid),
    toggleSound: () => useGameStateStore().toggleSound(),
    toggleHints: () => useGameStateStore().toggleHints(),
    initChallengeMode: (cat, diff) => useChallengeModeStore().initChallenge(cat, diff),
    exitChallengeMode: () => useChallengeModeStore().exitChallenge(),

    cleanup() {
      useGameStateStore().resetGameState()
      useGameTimerStore().stopTimer()
      useGameScoringStore().resetScore()
    },
  },
})
