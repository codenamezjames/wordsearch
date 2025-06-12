// Core engine components
export { GameEngine } from './GameEngine.js'
export { EventBus } from './EventBus.js'
export { BaseModifier } from './BaseModifier.js'

// Example modifiers (for demonstration and future card deck system)
export { DoublePointsModifier } from './modifiers/DoublePointsModifier.js'
export { TimeSlowModifier } from './modifiers/TimeSlowModifier.js'

// Create a default game engine instance for easy use
import { GameEngine } from './GameEngine.js'
export const gameEngine = new GameEngine()

// Initialize the engine when imported
if (typeof window !== 'undefined') {
  // Only initialize in browser environment
  gameEngine.initialize()
}
