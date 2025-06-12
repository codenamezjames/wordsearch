/**
 * StorageService - Abstraction layer for persistent storage
 * Provides a consistent interface for storing and retrieving data
 * with error handling and fallback mechanisms
 */
export class StorageService {
  /**
   * Create a new storage service
   * @param {Object} options - Storage options
   * @param {string} options.namespace - Namespace prefix for keys
   * @param {Storage} options.storage - Storage implementation (default: localStorage)
   */
  constructor(options = {}) {
    this.namespace = options.namespace || 'wordsearch:'
    this.storage = options.storage || localStorage
    this.memoryFallback = new Map()
    this.isAvailable = this.checkAvailability()
  }

  /**
   * Check if storage is available
   * @returns {boolean} - Whether storage is available
   */
  checkAvailability() {
    try {
      const testKey = `${this.namespace}test`
      this.storage.setItem(testKey, 'test')
      this.storage.removeItem(testKey)
      return true
    } catch (error) {
      console.warn('Storage not available, using memory fallback', error)
      return false
    }
  }

  /**
   * Get a namespaced key
   * @param {string} key - Base key
   * @returns {string} - Namespaced key
   */
  getNamespacedKey(key) {
    return `${this.namespace}${key}`
  }

  /**
   * Set a value in storage
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   * @returns {boolean} - Whether the operation was successful
   */
  setItem(key, value) {
    const namespacedKey = this.getNamespacedKey(key)

    try {
      // Handle special types
      const serializedValue = this.serialize(value)

      if (this.isAvailable) {
        this.storage.setItem(namespacedKey, serializedValue)
      } else {
        this.memoryFallback.set(namespacedKey, value)
      }

      return true
    } catch (error) {
      console.error(`Failed to store ${key}:`, error)
      this.memoryFallback.set(namespacedKey, value)
      return false
    }
  }

  /**
   * Get a value from storage
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if not found
   * @returns {*} - Retrieved value or default
   */
  getItem(key, defaultValue = null) {
    const namespacedKey = this.getNamespacedKey(key)

    try {
      if (this.isAvailable) {
        const value = this.storage.getItem(namespacedKey)

        if (value === null) {
          return defaultValue
        }

        return this.deserialize(value)
      } else {
        return this.memoryFallback.has(namespacedKey)
          ? this.memoryFallback.get(namespacedKey)
          : defaultValue
      }
    } catch (error) {
      console.error(`Failed to retrieve ${key}:`, error)
      return this.memoryFallback.has(namespacedKey)
        ? this.memoryFallback.get(namespacedKey)
        : defaultValue
    }
  }

  /**
   * Remove a value from storage
   * @param {string} key - Storage key
   * @returns {boolean} - Whether the operation was successful
   */
  removeItem(key) {
    const namespacedKey = this.getNamespacedKey(key)

    try {
      if (this.isAvailable) {
        this.storage.removeItem(namespacedKey)
      }

      this.memoryFallback.delete(namespacedKey)
      return true
    } catch (error) {
      console.error(`Failed to remove ${key}:`, error)
      return false
    }
  }

  /**
   * Clear all values in the namespace
   * @returns {boolean} - Whether the operation was successful
   */
  clear() {
    try {
      if (this.isAvailable) {
        // Only clear items in our namespace
        const keysToRemove = []

        for (let i = 0; i < this.storage.length; i++) {
          const key = this.storage.key(i)
          if (key.startsWith(this.namespace)) {
            keysToRemove.push(key)
          }
        }

        keysToRemove.forEach((key) => {
          this.storage.removeItem(key)
        })
      }

      this.memoryFallback.clear()
      return true
    } catch (error) {
      console.error('Failed to clear storage:', error)
      return false
    }
  }

  /**
   * Get all keys in the namespace
   * @returns {string[]} - Array of keys
   */
  keys() {
    try {
      const keys = []

      if (this.isAvailable) {
        for (let i = 0; i < this.storage.length; i++) {
          const key = this.storage.key(i)
          if (key.startsWith(this.namespace)) {
            keys.push(key.slice(this.namespace.length))
          }
        }
      } else {
        for (const key of this.memoryFallback.keys()) {
          if (key.startsWith(this.namespace)) {
            keys.push(key.slice(this.namespace.length))
          }
        }
      }

      return keys
    } catch (error) {
      console.error('Failed to get keys:', error)
      return []
    }
  }

  /**
   * Serialize a value for storage
   * @param {*} value - Value to serialize
   * @returns {string} - Serialized value
   */
  serialize(value) {
    if (value === undefined) {
      return JSON.stringify({ type: 'undefined' })
    }

    if (value instanceof Set) {
      return JSON.stringify({
        type: 'Set',
        value: Array.from(value),
      })
    }

    if (value instanceof Map) {
      return JSON.stringify({
        type: 'Map',
        value: Array.from(value.entries()),
      })
    }

    if (value instanceof Date) {
      return JSON.stringify({
        type: 'Date',
        value: value.toISOString(),
      })
    }

    return JSON.stringify({
      type: 'json',
      value,
    })
  }

  /**
   * Deserialize a value from storage
   * @param {string} serialized - Serialized value
   * @returns {*} - Deserialized value
   */
  deserialize(serialized) {
    try {
      const { type, value } = JSON.parse(serialized)

      switch (type) {
        case 'undefined':
          return undefined
        case 'Set':
          return new Set(value)
        case 'Map':
          return new Map(value)
        case 'Date':
          return new Date(value)
        case 'json':
        default:
          return value
      }
    } catch (_error) {
      // For backwards compatibility with old format
      try {
        return JSON.parse(serialized)
      } catch (_e) {
        return serialized
      }
    }
  }
}

// Export a singleton instance with default configuration
export const storageService = new StorageService({ namespace: 'wordsearch:' })

// Export factory function for creating custom instances
export function createStorageService(options) {
  return new StorageService(options)
}

// Export session storage instance
export const sessionStorageService = new StorageService({
  namespace: 'wordsearch:session:',
  storage: window.sessionStorage,
})
