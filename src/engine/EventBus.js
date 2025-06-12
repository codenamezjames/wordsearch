/**
 * EventBus - Centralized event system for decoupled communication
 * Allows components to communicate without direct dependencies
 */
export class EventBus {
  constructor() {
    this.listeners = new Map()
    this.onceListeners = new Map()
    this.maxListeners = 100 // Prevent memory leaks
  }

  /**
   * Register an event listener
   * @param {string} event - Event name
   * @param {Function} handler - Event handler function
   * @param {Object} options - Options for the listener
   * @param {boolean} options.once - Whether to remove after first call
   * @param {number} options.priority - Priority for execution order (higher = earlier)
   */
  on(event, handler, options = {}) {
    if (typeof handler !== 'function') {
      throw new Error('Event handler must be a function')
    }

    const { once = false, priority = 0 } = options
    const listenerMap = once ? this.onceListeners : this.listeners

    if (!listenerMap.has(event)) {
      listenerMap.set(event, [])
    }

    const listeners = listenerMap.get(event)

    // Check max listeners limit
    if (listeners.length >= this.maxListeners) {
      console.warn(`Maximum listeners (${this.maxListeners}) reached for event: ${event}`)
      return this
    }

    // Add listener with metadata
    const listenerData = {
      handler,
      priority,
      id: this.generateListenerId(),
    }

    listeners.push(listenerData)

    // Sort by priority (higher priority first)
    listeners.sort((a, b) => b.priority - a.priority)

    return this
  }

  /**
   * Register a one-time event listener
   * @param {string} event - Event name
   * @param {Function} handler - Event handler function
   * @param {Object} options - Options for the listener
   */
  once(event, handler, options = {}) {
    return this.on(event, handler, { ...options, once: true })
  }

  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {Function} handler - Event handler function to remove
   */
  off(event, handler) {
    const removeFromMap = (listenerMap) => {
      if (!listenerMap.has(event)) return false

      const listeners = listenerMap.get(event)
      const index = listeners.findIndex((l) => l.handler === handler)

      if (index !== -1) {
        listeners.splice(index, 1)
        if (listeners.length === 0) {
          listenerMap.delete(event)
        }
        return true
      }
      return false
    }

    // Try to remove from both regular and once listeners
    const removedFromRegular = removeFromMap(this.listeners)
    const removedFromOnce = removeFromMap(this.onceListeners)

    return removedFromRegular || removedFromOnce
  }

  /**
   * Remove all listeners for an event
   * @param {string} event - Event name
   */
  removeAllListeners(event) {
    if (event) {
      this.listeners.delete(event)
      this.onceListeners.delete(event)
    } else {
      // Remove all listeners for all events
      this.listeners.clear()
      this.onceListeners.clear()
    }
    return this
  }

  /**
   * Emit an event to all registered listeners
   * @param {string} event - Event name
   * @param {*} data - Data to pass to listeners
   * @param {Object} options - Emission options
   * @param {boolean} options.async - Whether to emit asynchronously
   */
  emit(event, data, options = {}) {
    const { async = false } = options

    if (async) {
      return this.emitAsync(event, data)
    } else {
      return this.emitSync(event, data)
    }
  }

  /**
   * Emit event synchronously
   * @param {string} event - Event name
   * @param {*} data - Data to pass to listeners
   */
  emitSync(event, data) {
    const results = []

    // Execute regular listeners
    const regularListeners = this.listeners.get(event) || []
    for (const listenerData of regularListeners) {
      try {
        const result = listenerData.handler(data, event)
        results.push(result)
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error)
        this.emit('error', { event, error, data })
      }
    }

    // Execute and remove once listeners
    const onceListeners = this.onceListeners.get(event) || []
    if (onceListeners.length > 0) {
      for (const listenerData of onceListeners) {
        try {
          const result = listenerData.handler(data, event)
          results.push(result)
        } catch (error) {
          console.error(`Error in once listener for ${event}:`, error)
          this.emit('error', { event, error, data })
        }
      }
      // Remove all once listeners for this event
      this.onceListeners.delete(event)
    }

    return results
  }

  /**
   * Emit event asynchronously
   * @param {string} event - Event name
   * @param {*} data - Data to pass to listeners
   */
  async emitAsync(event, data) {
    const promises = []

    // Execute regular listeners
    const regularListeners = this.listeners.get(event) || []
    for (const listenerData of regularListeners) {
      promises.push(
        Promise.resolve()
          .then(() => listenerData.handler(data, event))
          .catch((error) => {
            console.error(`Error in async event listener for ${event}:`, error)
            this.emit('error', { event, error, data })
            return null
          }),
      )
    }

    // Execute and remove once listeners
    const onceListeners = this.onceListeners.get(event) || []
    if (onceListeners.length > 0) {
      for (const listenerData of onceListeners) {
        promises.push(
          Promise.resolve()
            .then(() => listenerData.handler(data, event))
            .catch((error) => {
              console.error(`Error in async once listener for ${event}:`, error)
              this.emit('error', { event, error, data })
              return null
            }),
        )
      }
      // Remove all once listeners for this event
      this.onceListeners.delete(event)
    }

    return Promise.all(promises)
  }

  /**
   * Get the number of listeners for an event
   * @param {string} event - Event name
   */
  listenerCount(event) {
    const regular = this.listeners.get(event)?.length || 0
    const once = this.onceListeners.get(event)?.length || 0
    return regular + once
  }

  /**
   * Get all event names that have listeners
   */
  eventNames() {
    const regularEvents = Array.from(this.listeners.keys())
    const onceEvents = Array.from(this.onceListeners.keys())
    return [...new Set([...regularEvents, ...onceEvents])]
  }

  /**
   * Check if there are any listeners for an event
   * @param {string} event - Event name
   */
  hasListeners(event) {
    return this.listenerCount(event) > 0
  }

  /**
   * Create a namespaced event emitter
   * @param {string} namespace - Namespace prefix
   */
  namespace(namespace) {
    return {
      on: (event, handler, options) => this.on(`${namespace}:${event}`, handler, options),
      once: (event, handler, options) => this.once(`${namespace}:${event}`, handler, options),
      off: (event, handler) => this.off(`${namespace}:${event}`, handler),
      emit: (event, data, options) => this.emit(`${namespace}:${event}`, data, options),
      removeAllListeners: (event) =>
        this.removeAllListeners(event ? `${namespace}:${event}` : undefined),
    }
  }

  /**
   * Create a promise that resolves when an event is emitted
   * @param {string} event - Event name
   * @param {number} timeout - Optional timeout in milliseconds
   */
  waitFor(event, timeout) {
    return new Promise((resolve, reject) => {
      let timeoutId

      const handler = (data) => {
        if (timeoutId) clearTimeout(timeoutId)
        resolve(data)
      }

      this.once(event, handler)

      if (timeout) {
        timeoutId = setTimeout(() => {
          this.off(event, handler)
          reject(new Error(`Timeout waiting for event: ${event}`))
        }, timeout)
      }
    })
  }

  /**
   * Generate a unique listener ID
   */
  generateListenerId() {
    return `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get debug information about the event bus
   */
  getDebugInfo() {
    const info = {
      totalEvents: this.eventNames().length,
      totalListeners: 0,
      events: {},
    }

    for (const event of this.eventNames()) {
      const count = this.listenerCount(event)
      info.events[event] = count
      info.totalListeners += count
    }

    return info
  }

  /**
   * Set maximum number of listeners per event
   * @param {number} max - Maximum number of listeners
   */
  setMaxListeners(max) {
    this.maxListeners = Math.max(0, max)
    return this
  }
}
