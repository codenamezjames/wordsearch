import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { BaseModifier } from '../BaseModifier'

describe('BaseModifier', () => {
  let modifier
  let mockEngine

  beforeEach(() => {
    vi.useFakeTimers()

    // Create a mock engine with emit method
    mockEngine = {
      emit: vi.fn(),
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      modifier = new BaseModifier()

      expect(modifier.config.name).toBe('UnnamedModifier')
      expect(modifier.config.type).toBe('generic')
      expect(modifier.config.duration).toBe(0)
      expect(modifier.config.stackable).toBe(true)
      expect(modifier.isActive).toBe(false)
      expect(modifier.engine).toBeNull()
    })

    it('should initialize with custom config', () => {
      const config = {
        name: 'TestModifier',
        type: 'score',
        duration: 30,
        stackable: false,
        priority: 10,
        description: 'Test description',
      }

      modifier = new BaseModifier(config)

      expect(modifier.config.name).toBe('TestModifier')
      expect(modifier.config.type).toBe('score')
      expect(modifier.config.duration).toBe(30)
      expect(modifier.config.stackable).toBe(false)
      expect(modifier.config.priority).toBe(10)
      expect(modifier.config.description).toBe('Test description')
    })
  })

  describe('Engine integration', () => {
    it('should set engine reference', () => {
      modifier = new BaseModifier()
      modifier.setEngine(mockEngine)

      expect(modifier.engine).toBe(mockEngine)
    })
  })

  describe('Activation and deactivation', () => {
    beforeEach(() => {
      modifier = new BaseModifier({
        name: 'TestModifier',
        duration: 30,
      })
      modifier.setEngine(mockEngine)
    })

    it('should activate correctly', async () => {
      await modifier.activate()

      expect(modifier.isActive).toBe(true)
      expect(modifier.startTime).toBeDefined()
      expect(modifier.endTime).toBeDefined()
      expect(mockEngine.emit).toHaveBeenCalledWith(
        'modifier:activated',
        expect.objectContaining({
          name: 'TestModifier',
        }),
      )
    })

    it('should deactivate correctly', async () => {
      await modifier.activate()
      await modifier.deactivate()

      expect(modifier.isActive).toBe(false)
      expect(mockEngine.emit).toHaveBeenCalledWith(
        'modifier:deactivated',
        expect.objectContaining({
          name: 'TestModifier',
        }),
      )
    })

    it('should auto-deactivate after duration', async () => {
      await modifier.activate()

      expect(modifier.isActive).toBe(true)

      // Advance time past duration
      vi.advanceTimersByTime(31 * 1000)

      expect(modifier.hasExpired()).toBe(true)
      expect(modifier.canApply('any')).toBe(false)
    })

    it('should prevent activation of non-stackable active modifier', async () => {
      modifier = new BaseModifier({
        name: 'NonStackable',
        stackable: false,
      })

      await modifier.activate()

      await expect(modifier.activate()).rejects.toThrow(/not stackable/)
    })
  })

  describe('Time tracking', () => {
    beforeEach(() => {
      modifier = new BaseModifier({
        name: 'TimedModifier',
        duration: 60,
      })
    })

    it('should track remaining time correctly', async () => {
      await modifier.activate()

      vi.advanceTimersByTime(20 * 1000)
      expect(modifier.getRemainingTime()).toBe(40)

      vi.advanceTimersByTime(30 * 1000)
      expect(modifier.getRemainingTime()).toBe(10)

      vi.advanceTimersByTime(15 * 1000)
      expect(modifier.getRemainingTime()).toBe(0)
    })

    it('should track elapsed time correctly', async () => {
      await modifier.activate()

      vi.advanceTimersByTime(25 * 1000)
      expect(modifier.getElapsedTime()).toBe(25)
    })

    it('should report zero remaining time for permanent modifiers', async () => {
      modifier = new BaseModifier({
        duration: 0, // permanent
      })

      await modifier.activate()
      expect(modifier.getRemainingTime()).toBe(0)
    })
  })

  describe('Modifier application', () => {
    it('should not apply when inactive', () => {
      modifier = new BaseModifier({
        type: 'score',
      })

      expect(modifier.canApply('score')).toBe(false)
    })

    it('should apply based on type', async () => {
      modifier = new BaseModifier({
        type: 'score',
      })

      await modifier.activate()

      expect(modifier.canApply('score')).toBe(true)
      expect(modifier.canApply('timer')).toBe(false)
    })

    it('should apply for generic type', async () => {
      modifier = new BaseModifier({
        type: 'generic',
      })

      await modifier.activate()

      expect(modifier.canApply('score')).toBe(true)
      expect(modifier.canApply('timer')).toBe(true)
    })

    it('should pass through value by default', async () => {
      modifier = new BaseModifier()
      await modifier.activate()

      const result = await modifier.apply('score', 100)
      expect(result).toBe(100)
    })
  })

  describe('Metadata management', () => {
    beforeEach(() => {
      modifier = new BaseModifier()
    })

    it('should set and get metadata', () => {
      modifier.setMetadata('key1', 'value1')
      modifier.setMetadata('key2', { complex: 'value' })

      expect(modifier.getMetadata('key1')).toBe('value1')
      expect(modifier.getMetadata('key2')).toEqual({ complex: 'value' })
    })

    it('should get all metadata', () => {
      modifier.setMetadata('key1', 'value1')
      modifier.setMetadata('key2', 'value2')

      const allMetadata = modifier.getAllMetadata()
      expect(allMetadata.size).toBe(2)
      expect(allMetadata.get('key1')).toBe('value1')
      expect(allMetadata.get('key2')).toBe('value2')
    })
  })

  describe('Status reporting', () => {
    it('should report status correctly', async () => {
      modifier = new BaseModifier({
        name: 'StatusTest',
        duration: 30,
      })

      await modifier.activate()
      vi.advanceTimersByTime(10 * 1000)

      const status = modifier.getStatus()

      expect(status.name).toBe('StatusTest')
      expect(status.isActive).toBe(true)
      expect(status.remainingTime).toBe(20)
      expect(status.elapsedTime).toBe(10)
    })
  })

  describe('Static factory methods', () => {
    it('should create simple modifiers', async () => {
      const simpleModifier = BaseModifier.create(
        { name: 'SimpleModifier', type: 'score' },
        (value) => value * 2,
      )

      const instance = new simpleModifier()
      await instance.activate()

      const result = await instance.apply('score', 100)
      expect(result).toBe(200)
    })

    it('should validate config', () => {
      const validConfig = BaseModifier.validateConfig({
        name: 'Valid',
        type: 'score',
      })

      expect(validConfig.name).toBe('Valid')

      expect(() => {
        BaseModifier.validateConfig({})
      }).not.toThrow()
    })
  })

  describe('Lifecycle hooks', () => {
    it('should call lifecycle hooks', async () => {
      class TestModifier extends BaseModifier {
        async onActivate(options) {
          this.setMetadata('activateOptions', options)
        }

        async onDeactivate(options) {
          this.setMetadata('deactivateOptions', options)
        }
      }

      const testModifier = new TestModifier()
      await testModifier.activate({ reason: 'test' })
      await testModifier.deactivate({ reason: 'complete' })

      expect(testModifier.getMetadata('activateOptions')).toEqual({ reason: 'test' })
      expect(testModifier.getMetadata('deactivateOptions')).toEqual({ reason: 'complete' })
    })
  })

  describe('Cleanup', () => {
    it('should clean up resources', async () => {
      modifier = new BaseModifier()
      await modifier.activate()

      modifier.cleanup()

      expect(modifier.isActive).toBe(false)
      expect(modifier.timeoutId).toBeNull()
    })
  })
})
