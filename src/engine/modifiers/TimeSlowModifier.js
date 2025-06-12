import { BaseModifier } from '../BaseModifier.js'

/**
 * TimeSlowModifier - Example modifier that slows down the game timer
 * This demonstrates how the future card deck system could affect game mechanics
 */
export class TimeSlowModifier extends BaseModifier {
  constructor(options = {}) {
    super({
      name: 'Time Slow',
      type: 'timer',
      duration: options.duration || 20, // 20 seconds default
      stackable: false,
      priority: 5,
      description: 'Slows down the game timer by 50%',
      ...options,
    })

    this.originalTimerSpeed = 1000 // Normal 1 second intervals
    this.slowTimerSpeed = 2000 // Slow 2 second intervals
  }

  /**
   * Check if this modifier applies to timer modifications
   */
  canApply(type, context = {}) {
    if (!super.canApply(type, context)) return false
    return type === 'timer' || type === 'timerInterval'
  }

  /**
   * Apply the time slow effect
   */
  async apply(type, value, context = {}) {
    if (!this.canApply(type, context)) return value

    if (type === 'timerInterval') {
      // Slow down the timer interval
      return this.slowTimerSpeed
    }

    return value
  }

  /**
   * Called when the modifier is activated
   */
  async onActivate() {
    if (this.engine) {
      // Notify the timer system to slow down
      this.engine.emit('timer:setSpeed', {
        speed: 0.5, // Half speed
        source: this.config.name,
      })

      this.engine.emit('ui:showNotification', {
        type: 'modifier',
        title: 'Time Slow Active!',
        message: 'Timer running at half speed',
        icon: '⏰',
        duration: 3000,
      })
    }
  }

  /**
   * Called when the modifier is deactivated
   */
  async onDeactivate() {
    if (this.engine) {
      // Restore normal timer speed
      this.engine.emit('timer:setSpeed', {
        speed: 1.0, // Normal speed
        source: this.config.name,
      })

      this.engine.emit('ui:showNotification', {
        type: 'modifier',
        title: 'Time Slow Ended',
        message: 'Timer back to normal speed',
        icon: '⚡',
        duration: 2000,
      })
    }
  }
}
