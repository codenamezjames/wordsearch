import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { GameEngine } from '../GameEngine'
import { BaseModifier } from '../BaseModifier'

// Mock the store imports
vi.mock('../../stores/gameState.js', () => ({
  useGameStateStore: vi.fn(() => mockGameStateStore),
}))

vi.mock('../../stores/gameTimer.js', () => ({
  useGameTimerStore: vi.fn(() => mockGameTimerStore),
}))

vi.mock('../../stores/gameScoring.js', () => ({
  useGameScoringStore: vi.fn(() => mockGameScoringStore),
}))

vi.mock('../../stores/challengeMode.js', () => ({
  useChallengeModeStore: vi.fn(() => mockChallengeModeStore),
}))

vi.mock('../../stores/categories.js', () => ({
  useCategoriesStore: vi.fn(() => mockCategoriesStore),
}))

// Mock store instances
const mockGameStateStore = {
  resetGameState: vi.fn(),
  setCategory: vi.fn(),
  setDifficulty: vi.fn(),
  addFoundWord: vi.fn(),
  words: ['cat', 'dog', 'bird'],
  foundWords: new Set(),
  isGameActive: true,
  gameComplete: false,
  currentCategory: 'animals',
  difficulty: 'medium',
  foundWordsCount: 0,
  totalWords: 3,
  wordCountForDifficulty: 3,
  isGameComplete: false,
}

const mockGameTimerStore = {
  resetTimer: vi.fn(),
  startTimer: vi.fn(),
  stopTimer: vi.fn(),
  seconds: 30,
}

const mockGameScoringStore = {
  resetScore: vi.fn(),
  calculateWordScore: vi.fn(() => 100),
  addScore: vi.fn(),
  score: 500,
}

const mockChallengeModeStore = {
  initChallenge: vi.fn(),
  completeRound: vi.fn(),
  isActive: false,
  completed: false,
  currentRound: 1,
  totalRounds: 10,
  $state: {},
}

const mockCategoriesStore = {
  getRandomWords: vi.fn(() => ['cat', 'dog', 'bird']),
}

describe('GameEngine', () => {
  let gameEngine

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()

    // Create a new instance for each test
    gameEngine = new GameEngine()

    // Reset mock store states
    mockGameStateStore.foundWords = new Set()
    mockGameStateStore.isGameActive = true
    mockGameStateStore.gameComplete = false
    mockGameStateStore.isGameComplete = false
    mockChallengeModeStore.isActive = false
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with empty state', () => {
      expect(gameEngine.isInitialized).toBe(false)
      expect(gameEngine.modifiers.size).toBe(0)
      expect(gameEngine.eventBus).toBeDefined()
    })

    it('should initialize stores correctly', () => {
      const emitSpy = vi.spyOn(gameEngine.eventBus, 'emit')

      gameEngine.initialize()

      expect(gameEngine.isInitialized).toBe(true)
      expect(gameEngine.stores.gameState).toBe(mockGameStateStore)
      expect(gameEngine.stores.timer).toBe(mockGameTimerStore)
      expect(gameEngine.stores.scoring).toBe(mockGameScoringStore)
      expect(gameEngine.stores.challengeMode).toBe(mockChallengeModeStore)
      expect(gameEngine.stores.categories).toBe(mockCategoriesStore)
      expect(emitSpy).toHaveBeenCalledWith('engine:initialized')
    })

    it('should not re-initialize if already initialized', () => {
      gameEngine.initialize()
      const emitSpy = vi.spyOn(gameEngine.eventBus, 'emit')

      gameEngine.initialize()

      expect(emitSpy).not.toHaveBeenCalled()
    })
  })

  describe('Game lifecycle', () => {
    beforeEach(() => {
      gameEngine.initialize()
    })

    it('should start a new game with default options', async () => {
      const emitSpy = vi.spyOn(gameEngine.eventBus, 'emit')

      await gameEngine.startGame()

      expect(mockGameStateStore.resetGameState).toHaveBeenCalled()
      expect(mockGameTimerStore.resetTimer).toHaveBeenCalled()
      expect(mockGameScoringStore.resetScore).toHaveBeenCalled()
      expect(mockGameTimerStore.startTimer).toHaveBeenCalled()
      expect(mockGameStateStore.isGameActive).toBe(true)
      expect(mockGameStateStore.words).toEqual(['cat', 'dog', 'bird'])
      expect(emitSpy).toHaveBeenCalledWith('game:started', expect.anything())
    })

    it('should start a game with custom options', async () => {
      await gameEngine.startGame({
        category: 'food',
        difficulty: 'hard',
        challengeMode: true,
      })

      expect(mockGameStateStore.setCategory).toHaveBeenCalledWith('food')
      expect(mockGameStateStore.setDifficulty).toHaveBeenCalledWith('hard')
      expect(mockChallengeModeStore.initChallenge).toHaveBeenCalled()
    })

    it('should handle word found correctly', async () => {
      const emitSpy = vi.spyOn(gameEngine.eventBus, 'emit')
      mockGameStateStore.words = ['apple', 'banana', 'cherry']
      mockGameStateStore.addFoundWord.mockReturnValue(true)

      const result = await gameEngine.foundWord('apple', { row: 1, col: 2 })

      expect(result).toBe(true)
      expect(mockGameStateStore.addFoundWord).toHaveBeenCalledWith('apple', { row: 1, col: 2 })
      expect(mockGameScoringStore.addScore).toHaveBeenCalled()
      expect(emitSpy).toHaveBeenCalledWith('word:found', expect.anything())
    })

    it('should reject invalid words', async () => {
      const emitSpy = vi.spyOn(gameEngine.eventBus, 'emit')
      mockGameStateStore.words = ['apple', 'banana', 'cherry']

      const result = await gameEngine.foundWord('invalid')

      expect(result).toBe(false)
      expect(mockGameStateStore.addFoundWord).not.toHaveBeenCalled()
      expect(emitSpy).toHaveBeenCalledWith('word:invalid', expect.anything())
    })

    it('should reject duplicate words', async () => {
      const emitSpy = vi.spyOn(gameEngine.eventBus, 'emit')
      mockGameStateStore.words = ['apple', 'banana', 'cherry']
      mockGameStateStore.foundWords = new Set(['apple'])

      const result = await gameEngine.foundWord('apple')

      expect(result).toBe(false)
      expect(mockGameStateStore.addFoundWord).not.toHaveBeenCalled()
      expect(emitSpy).toHaveBeenCalledWith('word:duplicate', expect.anything())
    })

    it('should handle game completion', async () => {
      const emitSpy = vi.spyOn(gameEngine.eventBus, 'emit')
      mockGameStateStore.isGameComplete = true
      mockGameStateStore.addFoundWord.mockReturnValue(true)

      await gameEngine.foundWord('apple')

      expect(mockGameStateStore.isGameActive).toBe(false)
      expect(mockGameStateStore.gameComplete).toBe(true)
      expect(mockGameTimerStore.stopTimer).toHaveBeenCalled()
      expect(emitSpy).toHaveBeenCalledWith('game:completed', expect.anything())
    })

    it('should handle challenge mode completion', async () => {
      const emitSpy = vi.spyOn(gameEngine.eventBus, 'emit')
      mockGameStateStore.isGameComplete = true
      mockGameStateStore.addFoundWord.mockReturnValue(true)
      mockChallengeModeStore.isActive = true

      await gameEngine.foundWord('apple')

      expect(mockChallengeModeStore.completeRound).toHaveBeenCalledWith(mockGameScoringStore.score)
      expect(emitSpy).toHaveBeenCalledWith('challenge:round-complete', expect.anything())
    })

    it('should handle final challenge completion', async () => {
      const emitSpy = vi.spyOn(gameEngine.eventBus, 'emit')
      mockGameStateStore.isGameComplete = true
      mockGameStateStore.addFoundWord.mockReturnValue(true)
      mockChallengeModeStore.isActive = true
      mockChallengeModeStore.completed = true

      await gameEngine.foundWord('apple')

      expect(emitSpy).toHaveBeenCalledWith('challenge:completed', expect.anything())
    })
  })

  describe('Game control', () => {
    beforeEach(() => {
      gameEngine.initialize()
    })

    it('should pause the game', () => {
      gameEngine.pauseGame()

      expect(mockGameTimerStore.stopTimer).toHaveBeenCalled()
    })

    it('should resume the game', () => {
      gameEngine.resumeGame()

      expect(mockGameTimerStore.startTimer).toHaveBeenCalled()
    })

    it('should end the game', () => {
      const emitSpy = vi.spyOn(gameEngine.eventBus, 'emit')

      gameEngine.endGame()

      expect(mockGameStateStore.isGameActive).toBe(false)
      expect(mockGameTimerStore.stopTimer).toHaveBeenCalled()
      expect(emitSpy).toHaveBeenCalledWith('game:ended', expect.anything())
    })

    it('should clean up resources', () => {
      const eventBusSpy = vi.spyOn(gameEngine.eventBus, 'removeAllListeners')

      gameEngine.cleanup()

      expect(mockGameStateStore.resetGameState).toHaveBeenCalled()
      expect(mockGameTimerStore.stopTimer).toHaveBeenCalled()
      expect(mockGameScoringStore.resetScore).toHaveBeenCalled()
      expect(eventBusSpy).toHaveBeenCalled()
      expect(gameEngine.modifiers.size).toBe(0)
    })
  })

  describe('Modifier system', () => {
    let testModifier

    beforeEach(() => {
      gameEngine.initialize()

      // Create a test modifier
      testModifier = new BaseModifier({
        name: 'TestModifier',
        type: 'score',
      })
    })

    it('should register modifiers', () => {
      const setEngineSpy = vi.spyOn(testModifier, 'setEngine')

      gameEngine.registerModifier(testModifier)

      expect(gameEngine.modifiers.has('TestModifier')).toBe(true)
      expect(setEngineSpy).toHaveBeenCalledWith(gameEngine)
    })

    it('should unregister modifiers', () => {
      gameEngine.registerModifier(testModifier)
      gameEngine.unregisterModifier(testModifier)

      expect(gameEngine.modifiers.has('TestModifier')).toBe(false)
    })

    it('should apply modifiers to values', async () => {
      const applySpy = vi
        .spyOn(testModifier, 'apply')
        .mockImplementation(async (type, value) => value * 2)

      await testModifier.activate()
      gameEngine.registerModifier(testModifier)

      const result = await gameEngine.applyModifiers('score', 100)

      expect(applySpy).toHaveBeenCalledWith('score', 100, {})
      expect(result).toBe(200)
    })

    it('should apply multiple modifiers in priority order', async () => {
      const modifier1 = new BaseModifier({
        name: 'Modifier1',
        type: 'score',
        priority: 10,
      })

      const modifier2 = new BaseModifier({
        name: 'Modifier2',
        type: 'score',
        priority: 5,
      })

      vi.spyOn(modifier1, 'apply').mockImplementation(async (type, value) => value * 2)

      vi.spyOn(modifier2, 'apply').mockImplementation(async (type, value) => value + 50)

      await modifier1.activate()
      await modifier2.activate()

      gameEngine.registerModifier(modifier1)
      gameEngine.registerModifier(modifier2)

      // Higher priority (modifier1) should be applied first: (100 * 2) + 50 = 250
      const result = await gameEngine.applyModifiers('score', 100)

      expect(result).toBe(250)
    })
  })

  describe('Event delegation', () => {
    beforeEach(() => {
      gameEngine.initialize()
    })

    it('should delegate on() to eventBus', () => {
      const spy = vi.spyOn(gameEngine.eventBus, 'on')
      const handler = () => {}

      gameEngine.on('test', handler)

      expect(spy).toHaveBeenCalledWith('test', handler)
    })

    it('should delegate off() to eventBus', () => {
      const spy = vi.spyOn(gameEngine.eventBus, 'off')
      const handler = () => {}

      gameEngine.off('test', handler)

      expect(spy).toHaveBeenCalledWith('test', handler)
    })

    it('should delegate emit() to eventBus', () => {
      const spy = vi.spyOn(gameEngine.eventBus, 'emit')

      gameEngine.emit('test', { data: 'value' })

      expect(spy).toHaveBeenCalledWith('test', { data: 'value' })
    })
  })

  describe('Error handling', () => {
    beforeEach(() => {
      gameEngine.initialize()
    })

    it('should throw if methods are called before initialization', () => {
      const uninitializedEngine = new GameEngine()

      expect(() => {
        uninitializedEngine.startGame()
      }).toThrow(/not initialized/)
    })

    it('should handle errors during game start', async () => {
      const emitSpy = vi.spyOn(gameEngine.eventBus, 'emit')
      mockCategoriesStore.getRandomWords.mockReturnValueOnce([])

      await expect(gameEngine.startGame()).rejects.toThrow(/No words available/)
      expect(emitSpy).toHaveBeenCalledWith('game:error', expect.anything())
    })
  })

  describe('Game state access', () => {
    beforeEach(() => {
      gameEngine.initialize()
    })

    it('should provide game state snapshot', () => {
      const state = gameEngine.getGameState()

      expect(state.isActive).toBe(mockGameStateStore.isGameActive)
      expect(state.category).toBe(mockGameStateStore.currentCategory)
      expect(state.difficulty).toBe(mockGameStateStore.difficulty)
      expect(state.foundWords).toBe(mockGameStateStore.foundWordsCount)
      expect(state.totalWords).toBe(mockGameStateStore.totalWords)
      expect(state.score).toBe(mockGameScoringStore.score)
      expect(state.time).toBe(mockGameTimerStore.seconds)
    })
  })
})
