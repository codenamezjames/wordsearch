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

// Note: The engine must be manually initialized after Pinia is ready
// Call gameEngine.initialize() in your application after Pinia setup
