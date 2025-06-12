import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { GameEngine } from '../GameEngine'
import { BaseModifier } from '../BaseModifier'

// Create real instances for integration testing
let gameEngine
let scoreDoubleModifier

// Mock the store functionality but use real instances
const mockStores = {
  gameState: {
    resetGameState: vi.fn(),
    setCategory: vi.fn(),
    setDifficulty: vi.fn(),
    addFoundWord: vi.fn().mockImplementation((word) => {
      if (!mockStores.gameState.foundWords.has(word)) {
        mockStores.gameState.foundWords.add(word)
        return true
      }
      return false
    }),
    words: ['cat', 'dog', 'bird', 'fish', 'lion'],
    foundWords: new Set(),
    isGameActive: true,
    gameComplete: false,
    currentCategory: 'animals',
    difficulty: 'medium',
    gridSize: 10,
    get foundWordsCount() {
      return this.foundWords.size
    },
    get totalWords() {
      return this.words.length
    },
    get isGameComplete() {
      return this.foundWordsCount === this.totalWords && this.totalWords > 0
    },
    wordCountForDifficulty: 5,
  },
  timer: {
    resetTimer: vi.fn(),
    startTimer: vi.fn(),
    stopTimer: vi.fn(),
    seconds: 0,
    isRunning: false,
  },
  scoring: {
    resetScore: vi.fn(),
    calculateWordScore: vi.fn().mockImplementation(() => 100),
    addScore: vi.fn().mockImplementation((points) => {
      mockStores.scoring.score += points
    }),
    score: 0,
  },
  challengeMode: {
    initChallenge: vi.fn(),
    completeRound: vi.fn(),
    isActive: false,
    completed: false,
    currentRound: 1,
    totalRounds: 10,
    $state: {},
  },
  categories: {
    getRandomWords: vi.fn().mockImplementation(() => ['cat', 'dog', 'bird', 'fish', 'lion']),
  },
}

// Mock the store imports
vi.mock('../../stores/gameState.js', () => ({
  useGameStateStore: vi.fn(() => mockStores.gameState),
}))

vi.mock('../../stores/gameTimer.js', () => ({
  useGameTimerStore: vi.fn(() => mockStores.timer),
}))

vi.mock('../../stores/gameScoring.js', () => ({
  useGameScoringStore: vi.fn(() => mockStores.scoring),
}))

vi.mock('../../stores/challengeMode.js', () => ({
  useChallengeModeStore: vi.fn(() => mockStores.challengeMode),
}))

vi.mock('../../stores/categories.js', () => ({
  useCategoriesStore: vi.fn(() => mockStores.categories),
}))

describe('Game Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Reset mock store states
    mockStores.gameState.foundWords = new Set()
    mockStores.gameState.isGameActive = true
    mockStores.gameState.gameComplete = false
    mockStores.scoring.score = 0
    mockStores.timer.seconds = 0
    mockStores.challengeMode.isActive = false
    mockStores.challengeMode.completed = false

    // Create a new engine instance
    gameEngine = new GameEngine()
    gameEngine.initialize()

    // Create a score doubler modifier
    scoreDoubleModifier = new BaseModifier({
      name: 'ScoreDoubler',
      type: 'score',
      duration: 30,
    })

    // Override the apply method to double scores
    vi.spyOn(scoreDoubleModifier, 'apply').mockImplementation(async (type, value) =>
      type === 'score' ? value * 2 : value,
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Complete game flow', () => {
    it('should handle a full game lifecycle', async () => {
      // Set up event listeners to track game flow
      const events = []
      gameEngine.on('*', (data, event) => {
        events.push({ event, data })
      })

      // 1. Start a new game
      await gameEngine.startGame({
        category: 'animals',
        difficulty: 'medium',
      })

      // Verify game started correctly
      expect(mockStores.gameState.isGameActive).toBe(true)
      expect(mockStores.timer.startTimer).toHaveBeenCalled()
      expect(mockStores.scoring.resetScore).toHaveBeenCalled()
      expect(events.some((e) => e.event === 'game:started')).toBe(true)

      // 2. Find a word
      await gameEngine.foundWord('cat')

      // Verify word was found
      expect(mockStores.gameState.foundWords.has('cat')).toBe(true)
      expect(mockStores.scoring.score).toBe(100)
      expect(events.some((e) => e.event === 'word:found')).toBe(true)

      // 3. Activate a modifier
      await scoreDoubleModifier.activate()
      gameEngine.registerModifier(scoreDoubleModifier)

      // 4. Find another word with modifier active
      await gameEngine.foundWord('dog')

      // Verify score was doubled
      expect(mockStores.gameState.foundWords.has('dog')).toBe(true)
      expect(mockStores.scoring.score).toBe(300) // 100 + 200 (doubled)

      // 5. Find remaining words to complete the game
      await gameEngine.foundWord('bird')
      await gameEngine.foundWord('fish')

      // Game not complete yet
      expect(mockStores.gameState.isGameComplete).toBe(false)

      // Find last word to complete game
      await gameEngine.foundWord('lion')

      // Verify game completion
      expect(mockStores.gameState.isGameComplete).toBe(true)
      expect(mockStores.gameState.isGameActive).toBe(false)
      expect(mockStores.gameState.gameComplete).toBe(true)
      expect(mockStores.timer.stopTimer).toHaveBeenCalled()
      expect(events.some((e) => e.event === 'game:completed')).toBe(true)

      // Final score should include all words with appropriate modifiers
      expect(mockStores.scoring.score).toBe(700) // 100 + 200 + 200 + 200 (last 3 doubled)
    })

    it('should handle challenge mode flow', async () => {
      // Enable challenge mode
      mockStores.challengeMode.isActive = true

      // Start game in challenge mode
      await gameEngine.startGame({
        category: 'animals',
        difficulty: 'medium',
        challengeMode: true,
      })

      // Complete the round by finding all words
      await gameEngine.foundWord('cat')
      await gameEngine.foundWord('dog')
      await gameEngine.foundWord('bird')
      await gameEngine.foundWord('fish')
      await gameEngine.foundWord('lion')

      // Verify challenge round completion
      expect(mockStores.challengeMode.completeRound).toHaveBeenCalledWith(500)

      // Set up for final round
      mockStores.challengeMode.currentRound = 10
      mockStores.challengeMode.completed = true

      // Reset for next round
      mockStores.gameState.foundWords = new Set()
      mockStores.gameState.isGameActive = true
      mockStores.gameState.gameComplete = false

      // Start final round
      await gameEngine.startGame({
        category: 'animals',
        difficulty: 'hard',
        challengeMode: true,
      })

      // Complete final round
      await gameEngine.foundWord('cat')
      await gameEngine.foundWord('dog')
      await gameEngine.foundWord('bird')
      await gameEngine.foundWord('fish')
      await gameEngine.foundWord('lion')

      // Verify challenge completion
      expect(mockStores.challengeMode.completeRound).toHaveBeenCalledTimes(2)
    })
  })

  describe('Error handling and edge cases', () => {
    it('should handle invalid words gracefully', async () => {
      await gameEngine.startGame()

      // Try to find a word not in the list
      const result = await gameEngine.foundWord('elephant')

      expect(result).toBe(false)
      expect(mockStores.gameState.foundWords.size).toBe(0)
      expect(mockStores.scoring.score).toBe(0)
    })

    it('should handle duplicate word selections', async () => {
      await gameEngine.startGame()

      // Find a word
      await gameEngine.foundWord('cat')
      expect(mockStores.scoring.score).toBe(100)

      // Try to find the same word again
      const result = await gameEngine.foundWord('cat')

      expect(result).toBe(false)
      expect(mockStores.gameState.foundWords.size).toBe(1)
      expect(mockStores.scoring.score).toBe(100) // Score unchanged
    })

    it('should handle game pause and resume', async () => {
      await gameEngine.startGame()

      // Pause the game
      gameEngine.pauseGame()
      expect(mockStores.timer.stopTimer).toHaveBeenCalled()

      // Resume the game
      gameEngine.resumeGame()
      expect(mockStores.timer.startTimer).toHaveBeenCalled()
    })
  })

  describe('Modifier interaction', () => {
    it('should stack compatible modifiers correctly', async () => {
      // Create a second modifier that adds 50 points
      const bonusModifier = new BaseModifier({
        name: 'BonusPoints',
        type: 'score',
        stackable: true,
      })

      vi.spyOn(bonusModifier, 'apply').mockImplementation(async (type, value) =>
        type === 'score' ? value + 50 : value,
      )

      // Activate and register both modifiers
      await scoreDoubleModifier.activate()
      await bonusModifier.activate()
      gameEngine.registerModifier(scoreDoubleModifier)
      gameEngine.registerModifier(bonusModifier)

      await gameEngine.startGame()

      // Find a word with both modifiers active
      await gameEngine.foundWord('cat')

      // Score should be: (100 * 2) + 50 = 250
      expect(mockStores.scoring.score).toBe(250)
    })

    it('should handle modifier expiration', async () => {
      // Create a short-lived modifier
      const tempModifier = new BaseModifier({
        name: 'TempBonus',
        type: 'score',
        duration: 1, // 1 second duration
      })

      vi.spyOn(tempModifier, 'apply').mockImplementation(async (type, value) =>
        type === 'score' ? value * 3 : value,
      )

      // Activate and register the modifier
      await tempModifier.activate()
      gameEngine.registerModifier(tempModifier)

      await gameEngine.startGame()

      // Find a word with modifier active
      await gameEngine.foundWord('cat')

      // Score should be tripled: 100 * 3 = 300
      expect(mockStores.scoring.score).toBe(300)

      // Advance time to expire the modifier
      vi.advanceTimersByTime(1100) // 1.1 seconds

      // Find another word after modifier expired
      await gameEngine.foundWord('dog')

      // Score should be normal: 300 + 100 = 400
      expect(mockStores.scoring.score).toBe(400)
    })
  })
})
