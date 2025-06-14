import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { GameEngine } from '../GameEngine'
import { BaseModifier } from '../BaseModifier'
import { EventBus } from '../EventBus'

// Mock the store imports
vi.mock('../../stores/gameState.js', () => ({
  useGameStateStore: vi.fn(() => ({
    resetGameState: vi.fn(),
    setCategory: vi.fn(),
    setDifficulty: vi.fn(),
    addFoundWord: vi.fn().mockReturnValue(true),
    words: Array(100)
      .fill(0)
      .map((_, i) => `word${i}`),
    foundWords: new Set(),
    isGameActive: true,
    gameComplete: false,
    currentCategory: 'animals',
    difficulty: 'medium',
    foundWordsCount: 0,
    totalWords: 100,
    wordCountForDifficulty: 100,
    isGameComplete: false,
  })),
}))

vi.mock('../../stores/gameTimer.js', () => ({
  useGameTimerStore: vi.fn(() => ({
    resetTimer: vi.fn(),
    startTimer: vi.fn(),
    stopTimer: vi.fn(),
    seconds: 0,
  })),
}))

vi.mock('../../stores/gameScoring.js', () => ({
  useGameScoringStore: vi.fn(() => ({
    resetScore: vi.fn(),
    calculateWordScore: vi.fn(() => 100),
    addScore: vi.fn(),
    score: 0,
  })),
}))

vi.mock('../../stores/challengeMode.js', () => ({
  useChallengeModeStore: vi.fn(() => ({
    initChallenge: vi.fn(),
    completeRound: vi.fn(),
    isActive: false,
    completed: false,
    $state: {},
  })),
}))

vi.mock('../../stores/categories.js', () => ({
  useCategoriesStore: vi.fn(() => ({
    getRandomWords: vi.fn((_, count) =>
      Array(count)
        .fill(0)
        .map((_, i) => `word${i}`),
    ),
  })),
}))

describe('Performance Tests', () => {
  let gameEngine
  let eventBus

  beforeEach(async () => {
    vi.useFakeTimers()
    gameEngine = new GameEngine()
    await gameEngine.initialize()
    eventBus = new EventBus()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('EventBus performance', () => {
    it('should handle 1000 events efficiently', () => {
      const handler = vi.fn()
      eventBus.on('test', handler)

      const start = performance.now()

      for (let i = 0; i < 1000; i++) {
        eventBus.emit('test', { index: i })
      }

      const end = performance.now()
      const duration = end - start

      expect(handler).toHaveBeenCalledTimes(1000)
      expect(duration).toBeLessThan(100) // Should process 1000 events in under 100ms
    })

    it('should handle multiple listeners efficiently', () => {
      const handlerCount = 10
      const handlers = Array(handlerCount)
        .fill(0)
        .map(() => vi.fn())

      handlers.forEach((handler) => {
        eventBus.on('test', handler)
      })

      const start = performance.now()

      for (let i = 0; i < 100; i++) {
        eventBus.emit('test', { index: i })
      }

      const end = performance.now()
      const duration = end - start

      handlers.forEach((handler) => {
        expect(handler).toHaveBeenCalledTimes(100)
      })

      expect(duration).toBeLessThan(50) // Should process 100 events with 10 listeners each in under 50ms
    })
  })

  describe('Modifier system performance', () => {
    it('should handle many active modifiers efficiently', async () => {
      // Create 50 simple modifiers
      const modifierCount = 50

      for (let i = 0; i < modifierCount; i++) {
        const modifier = new BaseModifier({
          name: `Modifier${i}`,
          type: 'score',
          priority: i,
        })

        // Each modifier adds 1 to the score
        vi.spyOn(modifier, 'apply').mockImplementation(async (type, value) =>
          type === 'score' ? value + 1 : value,
        )

        await modifier.activate()
        await gameEngine.registerModifier(modifier)
      }

      const start = performance.now()

      // Apply all modifiers to a value
      const result = await gameEngine.applyModifiers('score', 100)

      const end = performance.now()
      const duration = end - start

      // Result should be 100 + 50 modifiers = 150
      expect(result).toBe(150)
      expect(duration).toBeLessThan(50) // Should apply 50 modifiers in under 50ms
    })
  })

  describe('Game engine performance', () => {
    it('should handle rapid word finding efficiently', async () => {
      await gameEngine.startGame()

      const wordCount = 50
      const start = performance.now()

      // Find 50 words in quick succession
      for (let i = 0; i < wordCount; i++) {
        await gameEngine.foundWord(`word${i}`)
      }

      const end = performance.now()
      const duration = end - start

      expect(duration).toBeLessThan(100) // Should process 50 words in under 100ms
    })

    it('should handle many event listeners during gameplay', async () => {
      // Add 20 listeners for various game events
      const listenerCount = 20
      const events = ['game:started', 'word:found', 'game:completed']
      const handlers = []

      events.forEach((event) => {
        for (let i = 0; i < listenerCount; i++) {
          const handler = vi.fn()
          handlers.push(handler)
          gameEngine.on(event, handler)
        }
      })

      const start = performance.now()

      // Start game and find 10 words
      await gameEngine.startGame()

      for (let i = 0; i < 10; i++) {
        await gameEngine.foundWord(`word${i}`)
      }

      const end = performance.now()
      const duration = end - start

      // Verify listeners were called
      expect(handlers[0]).toHaveBeenCalled() // game:started listener
      expect(handlers[listenerCount + 1]).toHaveBeenCalled() // word:found listener

      expect(duration).toBeLessThan(100) // Should complete operations with many listeners in under 100ms
    })
  })
})
