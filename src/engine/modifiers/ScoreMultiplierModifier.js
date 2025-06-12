import { BaseModifier } from '../BaseModifier'

/**
 * ScoreMultiplierModifier - Multiplies the score by a specified factor
 * Example implementation of a game modifier using the BaseModifier system
 */
export class ScoreMultiplierModifier extends BaseModifier {
  /**
   * Create a new score multiplier modifier
   * @param {Object} options - Modifier options
   * @param {number} options.multiplier - Score multiplier factor (default: 2)
   * @param {number} options.duration - Duration in seconds (default: 30)
   * @param {boolean} options.stackable - Whether multiple can be active (default: false)
   * @param {number} options.priority - Priority for execution order (default: 10)
   */
  constructor(options = {}) {
    super({
      name: options.name || 'ScoreMultiplier',
      type: 'score',
      duration: options.duration || 30,
      stackable: options.stackable !== undefined ? options.stackable : false,
      priority: options.priority || 10,
      description: options.description || `Multiplies score by ${options.multiplier || 2}x`,
    })

    this.multiplier = options.multiplier || 2
    this.setMetadata('multiplier', this.multiplier)
  }

  /**
   * Apply the score multiplier to the value
   * @param {string} type - Type of modification
   * @param {number} value - Value to modify
   * @param {Object} context - Context data
   * @returns {number} - Modified value
   */
  async apply(type, value, context = {}) {
    if (!this.canApply(type, context)) {
      return value
    }

    // Only apply to score type
    if (type === 'score') {
      return value * this.multiplier
    }

    return value
  }

  /**
   * Called when the modifier is activated
   * @param {Object} options - Activation options
   */
  async onActivate(options = {}) {
    // Emit a custom event when activated
    if (this.engine) {
      this.engine.emit('modifier:scoreMultiplier:activated', {
        multiplier: this.multiplier,
        duration: this.config.duration,
        options,
      })
    }
  }

  /**
   * Called when the modifier is deactivated
   * @param {Object} options - Deactivation options
   */
  async onDeactivate(options = {}) {
    // Emit a custom event when deactivated
    if (this.engine) {
      this.engine.emit('modifier:scoreMultiplier:deactivated', {
        multiplier: this.multiplier,
        options,
      })
    }
  }

  /**
   * Factory method to create common score multiplier instances
   * @param {number} multiplier - Score multiplier value
   * @param {number} duration - Duration in seconds
   * @returns {ScoreMultiplierModifier} - Configured modifier instance
   */
  static create(multiplier, duration) {
    return new ScoreMultiplierModifier({
      name: `${multiplier}x Score`,
      multiplier,
      duration,
      description: `Multiplies score by ${multiplier}x for ${duration} seconds`,
    })
  }
}

// Export common presets
export const DOUBLE_SCORE = () => ScoreMultiplierModifier.create(2, 30)
export const TRIPLE_SCORE = () => ScoreMultiplierModifier.create(3, 20)
export const MEGA_SCORE = () => ScoreMultiplierModifier.create(5, 10)
