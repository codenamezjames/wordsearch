import { EventBus } from './EventBus.js'
// Store imports are now lazy-loaded to avoid Pinia initialization issues

/**
 * GameEngine - Central orchestrator for all game logic
 * Provides a clean abstraction layer over the store system
 * Manages game lifecycle, events, and modifiers
 */
export class GameEngine {
  constructor() {
    this.eventBus = new EventBus()
    this.modifiers = new Map()
    this.isInitialized = false

    // Store references
    this.stores = {
      gameState: null,
      timer: null,
      scoring: null,
      challengeMode: null,
      categories: null,
    }
  }

  /**
   * Initialize the game engine with store instances
   * Must be called before using the engine
   */
  async initialize() {
    if (this.isInitialized) return

    // Dynamically import store functions to avoid Pinia initialization issues
    const { useGameStateStore } = await import('../stores/gameState.js')
    const { useGameTimerStore } = await import('../stores/gameTimer.js')
    const { useGameScoringStore } = await import('../stores/gameScoring.js')
    const { useChallengeModeStore } = await import('../stores/challengeMode.js')
    const { useCategoriesStore } = await import('../stores/categories.js')

    // Initialize store references
    this.stores.gameState = useGameStateStore()
    this.stores.timer = useGameTimerStore()
    this.stores.scoring = useGameScoringStore()
    this.stores.challengeMode = useChallengeModeStore()
    this.stores.categories = useCategoriesStore()

    this.isInitialized = true
    this.eventBus.emit('engine:initialized')
  }

  /**
   * Start a new game with specified parameters
   * @param {Object} options - Game configuration
   * @param {string} options.category - Game category
   * @param {string} options.difficulty - Game difficulty
   * @param {boolean} options.challengeMode - Whether to start in challenge mode
   */
  async startGame(options = {}) {
    await this.ensureInitialized()

    const { category, difficulty, challengeMode = false } = options

    try {
      this.eventBus.emit('game:starting', options)

      // Set game parameters
      if (category) this.stores.gameState.setCategory(category)
      if (difficulty) this.stores.gameState.setDifficulty(difficulty)

      // Initialize challenge mode if requested
      if (challengeMode) {
        this.stores.challengeMode.initChallenge(
          this.stores.gameState.currentCategory,
          this.stores.gameState.difficulty,
        )
      }

      // Reset all game state
      this.stores.gameState.resetGameState()
      this.stores.timer.resetTimer()
      this.stores.scoring.resetScore()

      // Get words for the game
      const words = this.stores.categories.getRandomWords(
        this.stores.gameState.currentCategory,
        this.stores.gameState.wordCountForDifficulty,
      )

      if (!words || words.length === 0) {
        throw new Error(`No words available for category: ${this.stores.gameState.currentCategory}`)
      }

      // Set up the game
      this.stores.gameState.words = words
      this.stores.gameState.isGameActive = true

      // Start the timer
      this.stores.timer.startTimer()

      this.eventBus.emit('game:started', {
        category: this.stores.gameState.currentCategory,
        difficulty: this.stores.gameState.difficulty,
        words: words.length,
        challengeMode,
      })

      return true
    } catch (error) {
      this.eventBus.emit('game:error', { error: error.message })
      throw error
    }
  }

  /**
   * Handle a word being found
   * @param {string} word - The found word
   * @param {Object} wordData - Additional word data (position, etc.)
   */
  async foundWord(word, wordData = null) {
    await this.ensureInitialized()

    if (!this.stores.gameState.isGameActive) return false

    try {
      // Check if word is valid and not already found
      if (!this.stores.gameState.words.includes(word)) {
        this.eventBus.emit('word:invalid', { word })
        return false
      }

      if (this.stores.gameState.foundWords.has(word)) {
        this.eventBus.emit('word:duplicate', { word })
        return false
      }

      // Apply modifiers to scoring
      let baseScore = this.stores.scoring.calculateWordScore()
      const modifiedScore = await this.applyModifiers('score', baseScore, { word, wordData })

      // Add the word and score
      this.stores.gameState.addFoundWord(word, wordData)
      this.stores.scoring.addScore(modifiedScore)

      this.eventBus.emit('word:found', {
        word,
        score: modifiedScore,
        wordData,
        totalFound: this.stores.gameState.foundWordsCount,
        totalWords: this.stores.gameState.totalWords,
      })

      // Check for game completion
      if (this.stores.gameState.isGameComplete) {
        await this.handleGameComplete()
      }

      return true
    } catch (error) {
      this.eventBus.emit('word:error', { word, error: error.message })
      return false
    }
  }

  /**
   * Handle game completion
   */
  async handleGameComplete() {
    await this.ensureInitialized()

    this.stores.gameState.isGameActive = false
    this.stores.gameState.gameComplete = true
    this.stores.timer.stopTimer()

    const gameData = {
      score: this.stores.scoring.score,
      time: this.stores.timer.seconds,
      difficulty: this.stores.gameState.difficulty,
      category: this.stores.gameState.currentCategory,
      wordsFound: this.stores.gameState.foundWordsCount,
      totalWords: this.stores.gameState.totalWords,
    }

    // Handle challenge mode completion
    if (this.stores.challengeMode.isActive) {
      this.stores.challengeMode.completeRound(this.stores.scoring.score)

      if (this.stores.challengeMode.completed) {
        this.eventBus.emit('challenge:completed', {
          ...gameData,
          challengeData: this.stores.challengeMode.$state,
        })
      } else {
        this.eventBus.emit('challenge:round-complete', {
          ...gameData,
          round: this.stores.challengeMode.currentRound,
          totalRounds: this.stores.challengeMode.totalRounds,
        })
      }
    } else {
      this.eventBus.emit('game:completed', gameData)
    }

    // Apply completion modifiers
    await this.applyModifiers('gameComplete', gameData)
  }

  /**
   * Register a modifier with the engine
   * @param {BaseModifier} modifier - The modifier to register
   */
  async registerModifier(modifier) {
    await this.ensureInitialized()

    if (!modifier.config?.name) {
      throw new Error('Modifier must have a name')
    }

    this.modifiers.set(modifier.config.name, modifier)
    modifier.setEngine(this)

    this.eventBus.emit('modifier:registered', {
      name: modifier.config.name,
      type: modifier.config.type,
    })
  }

  /**
   * Unregister a modifier
   * @param {string|BaseModifier} modifier - Modifier name or instance
   */
  async unregisterModifier(modifier) {
    await this.ensureInitialized()

    const name = typeof modifier === 'string' ? modifier : modifier.config?.name

    if (this.modifiers.has(name)) {
      const mod = this.modifiers.get(name)
      mod.cleanup?.()
      this.modifiers.delete(name)

      this.eventBus.emit('modifier:unregistered', { name })
    }
  }

  /**
   * Apply modifiers to a value
   * @param {string} type - Type of modification
   * @param {*} value - Value to modify
   * @param {Object} context - Additional context
   */
  async applyModifiers(type, value, context = {}) {
    let result = value

    for (const [name, modifier] of this.modifiers) {
      if (modifier.canApply?.(type, context)) {
        try {
          result = await modifier.apply(type, result, context)
        } catch (error) {
          console.error(`Modifier ${name} failed:`, error)
          this.eventBus.emit('modifier:error', { name, error: error.message })
        }
      }
    }

    return result
  }

  /**
   * Get current game state
   */
  async getGameState() {
    await this.ensureInitialized()

    return {
      isActive: this.stores.gameState.isGameActive,
      isComplete: this.stores.gameState.gameComplete,
      category: this.stores.gameState.currentCategory,
      difficulty: this.stores.gameState.difficulty,
      words: this.stores.gameState.words,
      foundWords: Array.from(this.stores.gameState.foundWords),
      score: this.stores.scoring.score,
      time: this.stores.timer.seconds,
      formattedTime: this.stores.timer.formattedTime,
      progress: this.stores.gameState.progress,
      challengeMode: this.stores.challengeMode.isActive ? this.stores.challengeMode.$state : null,
    }
  }

  /**
   * Pause the game
   */
  async pauseGame() {
    await this.ensureInitialized()

    if (this.stores.gameState.isGameActive && this.stores.timer.isRunning) {
      this.stores.timer.stopTimer()
      this.eventBus.emit('game:paused')
    }
  }

  /**
   * Resume the game
   */
  async resumeGame() {
    await this.ensureInitialized()

    if (this.stores.gameState.isGameActive && !this.stores.timer.isRunning) {
      this.stores.timer.startTimer()
      this.eventBus.emit('game:resumed')
    }
  }

  /**
   * End the current game
   */
  async endGame() {
    await this.ensureInitialized()

    this.stores.gameState.isGameActive = false
    this.stores.timer.stopTimer()

    this.eventBus.emit('game:ended', this.getGameState())
  }

  /**
   * Clean up the engine
   */
  cleanup() {
    // Unregister all modifiers
    for (const [name] of this.modifiers) {
      this.unregisterModifier(name)
    }

    // Clean up stores
    this.stores.gameState?.resetGameState()
    this.stores.timer?.stopTimer()
    this.stores.scoring?.resetScore()
    this.stores.challengeMode?.exitChallenge()

    this.eventBus.emit('engine:cleanup')
    this.eventBus.removeAllListeners()
  }

  /**
   * Event system delegation
   */
  on(event, handler) {
    return this.eventBus.on(event, handler)
  }

  off(event, handler) {
    return this.eventBus.off(event, handler)
  }

  emit(event, data) {
    return this.eventBus.emit(event, data)
  }

  /**
   * Ensure engine is initialized
   */
  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initialize()
    }
  }
}
