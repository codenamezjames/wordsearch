import { BaseModifier } from '../BaseModifier.js'

/**
 * DoublePointsModifier - Example modifier that doubles all score points
 * This demonstrates how the future card deck system could work
 */
export class DoublePointsModifier extends BaseModifier {
  constructor(options = {}) {
    super({
      name: 'Double Points',
      type: 'score',
      duration: options.duration || 30, // 30 seconds default
      stackable: false,
      priority: 10,
      description: 'Doubles all points earned for a limited time',
      ...options,
    })
  }

  /**
   * Check if this modifier applies to score modifications
   */
  canApply(type, context = {}) {
    if (!super.canApply(type, context)) return false
    return type === 'score'
  }

  /**
   * Apply the double points effect
   */
  async apply(type, value, context = {}) {
    if (!this.canApply(type, context)) return value

    // Double the score
    const doubledValue = value * 2

    // Track how many points we've doubled
    const totalDoubled = this.getMetadata('totalDoubled') || 0
    this.setMetadata('totalDoubled', totalDoubled + (doubledValue - value))

    return doubledValue
  }

  /**
   * Called when the modifier is activated
   */
  async onActivate(_options = {}) {
    this.setMetadata('totalDoubled', 0)
    this.setMetadata('activatedAt', Date.now())

    if (this.engine) {
      this.engine.emit('ui:showNotification', {
        type: 'modifier',
        title: 'Double Points Active!',
        message: `All points doubled for ${this.config.duration} seconds`,
        icon: '⭐',
        duration: 3000,
      })
    }
  }

  /**
   * Called when the modifier is deactivated
   */
  async onDeactivate(_options = {}) {
    const totalDoubled = this.getMetadata('totalDoubled') || 0

    if (this.engine) {
      this.engine.emit('ui:showNotification', {
        type: 'modifier',
        title: 'Double Points Ended',
        message: `Bonus points earned: ${totalDoubled}`,
        icon: '💫',
        duration: 2000,
      })
    }
  }

  /**
   * Get statistics about this modifier's usage
   */
  getStats() {
    return {
      ...this.getStatus(),
      totalDoubled: this.getMetadata('totalDoubled') || 0,
      activatedAt: this.getMetadata('activatedAt'),
      efficiency: this.calculateEfficiency(),
    }
  }

  /**
   * Calculate how efficiently the modifier was used
   */
  calculateEfficiency() {
    const totalDoubled = this.getMetadata('totalDoubled') || 0
    const elapsedTime = this.getElapsedTime()

    if (elapsedTime === 0) return 0
    return Math.round(totalDoubled / elapsedTime)
  }
}
