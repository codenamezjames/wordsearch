import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  ScoreMultiplierModifier,
  DOUBLE_SCORE,
  TRIPLE_SCORE,
  MEGA_SCORE,
} from '../ScoreMultiplierModifier'

describe('ScoreMultiplierModifier', () => {
  let modifier
  let mockEngine

  beforeEach(() => {
    vi.useFakeTimers()

    // Create a mock engine
    mockEngine = {
      emit: vi.fn(),
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Basic functionality', () => {
    it('should initialize with default values', () => {
      modifier = new ScoreMultiplierModifier()

      expect(modifier.config.name).toBe('ScoreMultiplier')
      expect(modifier.config.type).toBe('score')
      expect(modifier.config.duration).toBe(30)
      expect(modifier.config.stackable).toBe(false)
      expect(modifier.multiplier).toBe(2)
    })

    it('should initialize with custom values', () => {
      modifier = new ScoreMultiplierModifier({
        name: 'CustomMultiplier',
        multiplier: 3,
        duration: 60,
        stackable: true,
        priority: 5,
      })

      expect(modifier.config.name).toBe('CustomMultiplier')
      expect(modifier.config.duration).toBe(60)
      expect(modifier.config.stackable).toBe(true)
      expect(modifier.config.priority).toBe(5)
      expect(modifier.multiplier).toBe(3)
    })

    it('should store multiplier in metadata', () => {
      modifier = new ScoreMultiplierModifier({ multiplier: 4 })

      expect(modifier.getMetadata('multiplier')).toBe(4)
    })
  })

  describe('Score modification', () => {
    beforeEach(() => {
      modifier = new ScoreMultiplierModifier({ multiplier: 3 })
      modifier.setEngine(mockEngine)
    })

    it('should multiply score values when active', async () => {
      await modifier.activate()

      const result = await modifier.apply('score', 100)

      expect(result).toBe(300) // 100 * 3
    })

    it('should not modify non-score values', async () => {
      await modifier.activate()

      const result = await modifier.apply('timer', 100)

      expect(result).toBe(100) // Unchanged
    })

    it('should not modify values when inactive', async () => {
      // Not activated
      const result = await modifier.apply('score', 100)

      expect(result).toBe(100) // Unchanged
    })

    it('should not modify values after expiration', async () => {
      modifier = new ScoreMultiplierModifier({
        multiplier: 3,
        duration: 5,
      })

      await modifier.activate()

      // Before expiration
      let result = await modifier.apply('score', 100)
      expect(result).toBe(300)

      // Advance time past duration
      vi.advanceTimersByTime(6000) // 6 seconds

      // After expiration
      result = await modifier.apply('score', 100)
      expect(result).toBe(100) // Back to normal
    })
  })

  describe('Lifecycle events', () => {
    beforeEach(() => {
      modifier = new ScoreMultiplierModifier({ multiplier: 2 })
      modifier.setEngine(mockEngine)
    })

    it('should emit activation event', async () => {
      await modifier.activate()

      expect(mockEngine.emit).toHaveBeenCalledWith(
        'modifier:scoreMultiplier:activated',
        expect.objectContaining({
          multiplier: 2,
          duration: 30,
        }),
      )
    })

    it('should emit deactivation event', async () => {
      await modifier.activate()
      await modifier.deactivate()

      expect(mockEngine.emit).toHaveBeenCalledWith(
        'modifier:scoreMultiplier:deactivated',
        expect.objectContaining({
          multiplier: 2,
        }),
      )
    })
  })

  describe('Factory methods', () => {
    it('should create modifier with static create method', () => {
      modifier = ScoreMultiplierModifier.create(4, 15)

      expect(modifier.config.name).toBe('4x Score')
      expect(modifier.multiplier).toBe(4)
      expect(modifier.config.duration).toBe(15)
      expect(modifier.config.description).toContain('4x for 15 seconds')
    })

    it('should create preset modifiers', () => {
      const doubleScore = DOUBLE_SCORE()
      expect(doubleScore.multiplier).toBe(2)
      expect(doubleScore.config.duration).toBe(30)

      const tripleScore = TRIPLE_SCORE()
      expect(tripleScore.multiplier).toBe(3)
      expect(tripleScore.config.duration).toBe(20)

      const megaScore = MEGA_SCORE()
      expect(megaScore.multiplier).toBe(5)
      expect(megaScore.config.duration).toBe(10)
    })
  })
})
