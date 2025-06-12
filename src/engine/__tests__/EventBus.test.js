import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EventBus } from '../EventBus'

describe('EventBus', () => {
  let eventBus

  beforeEach(() => {
    eventBus = new EventBus()
  })

  describe('Basic functionality', () => {
    it('should initialize with empty listeners', () => {
      expect(eventBus.listeners.size).toBe(0)
      expect(eventBus.onceListeners.size).toBe(0)
    })

    it('should register and trigger event listeners', () => {
      const handler = vi.fn()
      eventBus.on('test', handler)

      eventBus.emit('test', { data: 'value' })

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith({ data: 'value' }, 'test')
    })

    it('should register and trigger once listeners', () => {
      const handler = vi.fn()
      eventBus.once('test', handler)

      eventBus.emit('test', { data: 'value' })
      eventBus.emit('test', { data: 'value2' })

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith({ data: 'value' }, 'test')
    })

    it('should remove listeners correctly', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      eventBus.on('test', handler1)
      eventBus.on('test', handler2)

      eventBus.off('test', handler1)
      eventBus.emit('test', {})

      expect(handler1).not.toHaveBeenCalled()
      expect(handler2).toHaveBeenCalledTimes(1)
    })

    it('should remove all listeners for an event', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      eventBus.on('test', handler1)
      eventBus.on('test', handler2)

      eventBus.removeAllListeners('test')
      eventBus.emit('test', {})

      expect(handler1).not.toHaveBeenCalled()
      expect(handler2).not.toHaveBeenCalled()
    })

    it('should remove all listeners for all events', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      eventBus.on('test1', handler1)
      eventBus.on('test2', handler2)

      eventBus.removeAllListeners()
      eventBus.emit('test1', {})
      eventBus.emit('test2', {})

      expect(handler1).not.toHaveBeenCalled()
      expect(handler2).not.toHaveBeenCalled()
    })
  })

  describe('Advanced features', () => {
    it('should respect listener priority', () => {
      const results = []

      eventBus.on('test', () => results.push(3), { priority: 1 })
      eventBus.on('test', () => results.push(1), { priority: 10 })
      eventBus.on('test', () => results.push(2), { priority: 5 })

      eventBus.emit('test')

      expect(results).toEqual([1, 2, 3])
    })

    it('should handle errors in listeners without breaking', () => {
      const goodHandler = vi.fn()
      const badHandler = vi.fn(() => {
        throw new Error('Test error')
      })
      const errorHandler = vi.fn()

      eventBus.on('test', badHandler)
      eventBus.on('test', goodHandler)
      eventBus.on('error', errorHandler)

      // Should not throw
      eventBus.emit('test')

      expect(badHandler).toHaveBeenCalled()
      expect(goodHandler).toHaveBeenCalled()
      expect(errorHandler).toHaveBeenCalled()
    })

    it('should enforce maximum listeners limit', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      eventBus.setMaxListeners(3)

      eventBus.on('test', () => {})
      eventBus.on('test', () => {})
      eventBus.on('test', () => {})
      eventBus.on('test', () => {})

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Maximum listeners'))
      expect(eventBus.listenerCount('test')).toBe(3)

      consoleWarnSpy.mockRestore()
    })
  })

  describe('Async functionality', () => {
    it('should emit events asynchronously', async () => {
      const results = []

      eventBus.on('test', async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        results.push(1)
        return 1
      })

      eventBus.on('test', async () => {
        results.push(2)
        return 2
      })

      const promise = eventBus.emit('test', {}, { async: true })
      results.push(3) // This should happen before the async handlers complete

      const emitResults = await promise

      expect(results).toEqual([3, 2, 1])
      expect(emitResults).toEqual([1, 2])
    })

    it('should handle async errors gracefully', async () => {
      const errorHandler = vi.fn()
      eventBus.on('error', errorHandler)

      eventBus.on('test', async () => {
        throw new Error('Async error')
      })

      await eventBus.emit('test', {}, { async: true })

      expect(errorHandler).toHaveBeenCalled()
    })
  })

  describe('Utility methods', () => {
    it('should return correct listener count', () => {
      eventBus.on('test', () => {})
      eventBus.on('test', () => {})
      eventBus.once('test', () => {})

      expect(eventBus.listenerCount('test')).toBe(3)
      expect(eventBus.listenerCount('nonexistent')).toBe(0)
    })

    it('should return all event names', () => {
      eventBus.on('test1', () => {})
      eventBus.on('test2', () => {})
      eventBus.once('test3', () => {})

      const eventNames = eventBus.eventNames()
      expect(eventNames).toContain('test1')
      expect(eventNames).toContain('test2')
      expect(eventNames).toContain('test3')
      expect(eventNames.length).toBe(3)
    })

    it('should check if event has listeners', () => {
      eventBus.on('test', () => {})

      expect(eventBus.hasListeners('test')).toBe(true)
      expect(eventBus.hasListeners('nonexistent')).toBe(false)
    })

    it('should provide debug info', () => {
      eventBus.on('test1', () => {})
      eventBus.on('test2', () => {})
      eventBus.once('test3', () => {})

      const debugInfo = eventBus.getDebugInfo()

      expect(debugInfo.regularEvents).toContain('test1')
      expect(debugInfo.regularEvents).toContain('test2')
      expect(debugInfo.onceEvents).toContain('test3')
      expect(debugInfo.totalListeners).toBe(3)
    })

    it('should create namespaced events', () => {
      const handler = vi.fn()
      const namespacedBus = eventBus.namespace('test')

      namespacedBus.on('event', handler)
      eventBus.emit('test:event', 'data')

      expect(handler).toHaveBeenCalledWith('data', 'test:event')
    })

    it('should wait for events', async () => {
      setTimeout(() => {
        eventBus.emit('delayed', { value: 'test' })
      }, 10)

      const result = await eventBus.waitFor('delayed', 100)
      expect(result).toEqual({ value: 'test' })
    })

    it('should timeout when waiting for events', async () => {
      try {
        await eventBus.waitFor('never', 10)
        expect.fail('Should have thrown timeout error')
      } catch (error) {
        expect(error.message).toContain('Timeout')
      }
    })
  })
})
