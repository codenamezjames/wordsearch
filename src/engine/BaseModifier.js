/**
 * BaseModifier - Abstract base class for game modifiers
 * Provides the foundation for the plugin/extension system
 * All game modifiers should extend this class
 */
export class BaseModifier {
  /**
   * @param {Object} config - Modifier configuration
   * @param {string} config.name - Unique name for the modifier
   * @param {string} config.type - Type of modifier (score, timer, visual, etc.)
   * @param {number} config.duration - Duration in seconds (0 = permanent)
   * @param {boolean} config.stackable - Whether multiple instances can be active
   * @param {number} config.priority - Priority for execution order (higher = earlier)
   * @param {string} config.description - Human-readable description
   */
  constructor(config = {}) {
    this.config = {
      name: config.name || 'UnnamedModifier',
      type: config.type || 'generic',
      duration: config.duration || 0,
      stackable: config.stackable !== false, // Default to true
      priority: config.priority || 0,
      description: config.description || '',
      ...config,
    }

    this.engine = null
    this.isActive = false
    this.startTime = null
    this.endTime = null
    this.timeoutId = null
    this.metadata = new Map()
  }

  /**
   * Set the game engine reference
   * Called automatically when registering with the engine
   * @param {GameEngine} engine - The game engine instance
   */
  setEngine(engine) {
    this.engine = engine
  }

  /**
   * Check if this modifier can be applied to a specific context
   * Override this method to implement custom logic
   * @param {string} type - Type of modification being requested
   * @param {Object} context - Context data for the modification
   * @returns {boolean} - Whether this modifier should be applied
   */
  canApply(type, _context = {}) {
    if (!this.isActive) return false

    // Check if modifier has expired
    if (this.hasExpired()) {
      this.deactivate()
      return false
    }

    // Default implementation - override in subclasses
    // Context parameter available for subclass overrides
    return this.config.type === type || this.config.type === 'generic'
  }

  /**
   * Apply the modifier to a value
   * This is the main method that subclasses should override
   * @param {string} type - Type of modification
   * @param {*} value - Value to modify
   * @param {Object} context - Context data
   * @returns {*} - Modified value
   */
  async apply(type, value, context = {}) {
    if (!this.canApply(type, context)) {
      return value
    }

    // Default implementation - subclasses should override
    return value
  }

  /**
   * Activate the modifier
   * @param {Object} options - Activation options
   */
  async activate(options = {}) {
    if (this.isActive) {
      if (!this.config.stackable) {
        throw new Error(`Modifier ${this.config.name} is not stackable and is already active`)
      }
    }

    this.isActive = true
    this.startTime = Date.now()

    if (this.config.duration > 0) {
      this.endTime = this.startTime + this.config.duration * 1000
      this.scheduleDeactivation()
    }

    // Call the activation hook
    await this.onActivate(options)

    // Emit activation event
    if (this.engine) {
      this.engine.emit('modifier:activated', {
        name: this.config.name,
        type: this.config.type,
        duration: this.config.duration,
        options,
      })
    }
  }

  /**
   * Deactivate the modifier
   * @param {Object} options - Deactivation options
   */
  async deactivate(options = {}) {
    if (!this.isActive) return

    this.isActive = false

    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }

    // Call the deactivation hook
    await this.onDeactivate(options)

    // Emit deactivation event
    if (this.engine) {
      this.engine.emit('modifier:deactivated', {
        name: this.config.name,
        type: this.config.type,
        options,
      })
    }
  }

  /**
   * Check if the modifier has expired
   * @returns {boolean} - Whether the modifier has expired
   */
  hasExpired() {
    if (!this.isActive || this.config.duration === 0) return false
    return Date.now() >= this.endTime
  }

  /**
   * Get remaining time in seconds
   * @returns {number} - Remaining time in seconds (0 if permanent or expired)
   */
  getRemainingTime() {
    if (!this.isActive || this.config.duration === 0) return 0
    if (this.hasExpired()) return 0

    return Math.max(0, Math.ceil((this.endTime - Date.now()) / 1000))
  }

  /**
   * Get elapsed time since activation in seconds
   * @returns {number} - Elapsed time in seconds
   */
  getElapsedTime() {
    if (!this.startTime) return 0
    return Math.floor((Date.now() - this.startTime) / 1000)
  }

  /**
   * Schedule automatic deactivation
   */
  scheduleDeactivation() {
    if (this.config.duration > 0) {
      this.timeoutId = setTimeout(() => {
        this.deactivate({ reason: 'expired' })
      }, this.config.duration * 1000)
    }
  }

  /**
   * Set metadata for the modifier
   * @param {string} key - Metadata key
   * @param {*} value - Metadata value
   */
  setMetadata(key, value) {
    this.metadata.set(key, value)
  }

  /**
   * Get metadata for the modifier
   * @param {string} key - Metadata key
   * @returns {*} - Metadata value
   */
  getMetadata(key) {
    return this.metadata.get(key)
  }

  /**
   * Get all metadata
   * @returns {Object} - All metadata as an object
   */
  getAllMetadata() {
    return Object.fromEntries(this.metadata)
  }

  /**
   * Get modifier status information
   * @returns {Object} - Status information
   */
  getStatus() {
    return {
      name: this.config.name,
      type: this.config.type,
      isActive: this.isActive,
      duration: this.config.duration,
      remainingTime: this.getRemainingTime(),
      elapsedTime: this.getElapsedTime(),
      stackable: this.config.stackable,
      priority: this.config.priority,
      description: this.config.description,
      metadata: this.getAllMetadata(),
    }
  }

  /**
   * Create a copy of this modifier with new configuration
   * @param {Object} newConfig - New configuration to merge
   * @returns {BaseModifier} - New modifier instance
   */
  clone(newConfig = {}) {
    const CloneClass = this.constructor
    return new CloneClass({ ...this.config, ...newConfig })
  }

  /**
   * Cleanup method called when modifier is removed
   * Override this method to implement custom cleanup logic
   */
  cleanup() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }

    this.metadata.clear()
    this.engine = null
  }

  // ===== HOOKS =====
  // These methods are meant to be overridden by subclasses

  /**
   * Called when the modifier is activated
   * Override this method to implement activation logic
   * @param {Object} _options - Activation options
   */
  async onActivate(_options = {}) {
    // Override in subclasses
  }

  /**
   * Called when the modifier is deactivated
   * Override this method to implement deactivation logic
   * @param {Object} _options - Deactivation options
   */
  async onDeactivate(_options = {}) {
    // Override in subclasses
  }

  /**
   * Called when a word is found (if modifier is active)
   * Override this method to implement word-found logic
   * @param {Object} _data - Word found data
   */
  async onWordFound(_data = {}) {
    // Override in subclasses
  }

  /**
   * Called when the game starts (if modifier is active)
   * Override this method to implement game-start logic
   * @param {Object} _data - Game start data
   */
  async onGameStart(_data = {}) {
    // Override in subclasses
  }

  /**
   * Called when the game ends (if modifier is active)
   * Override this method to implement game-end logic
   * @param {Object} _data - Game end data
   */
  async onGameEnd(_data = {}) {
    // Override in subclasses
  }

  // ===== STATIC METHODS =====

  /**
   * Create a simple modifier from a configuration object
   * @param {Object} config - Modifier configuration
   * @param {Function} applyFn - Function to apply the modification
   * @returns {BaseModifier} - New modifier instance
   */
  static create(config, applyFn) {
    class SimpleModifier extends BaseModifier {
      async apply(type, value, context) {
        if (!this.canApply(type, context)) return value
        return applyFn(value, context, this)
      }
    }

    return new SimpleModifier(config)
  }

  /**
   * Validate modifier configuration
   * @param {Object} config - Configuration to validate
   * @returns {boolean} - Whether configuration is valid
   */
  static validateConfig(config) {
    if (!config.name || typeof config.name !== 'string') {
      return false
    }

    if (config.duration && (typeof config.duration !== 'number' || config.duration < 0)) {
      return false
    }

    if (config.priority && typeof config.priority !== 'number') {
      return false
    }

    return true
  }
}
