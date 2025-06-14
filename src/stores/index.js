import { createPinia } from 'pinia'

// Quasar expects a default export that returns a Pinia instance
export default function (/* { ssrContext } */) {
  const pinia = createPinia()

  // You can add Pinia plugins here
  // pinia.use(SomePiniaPlugin)

  return pinia
}

// Export the new sub-stores for direct access if needed
export { useGameStateStore } from './gameState'
export { useGameTimerStore } from './gameTimer'
export { useGameScoringStore } from './gameScoring'
export { useChallengeModeStore } from './challengeMode'

// Export storage services
export {
  storageService,
  sessionStorageService,
  createStorageService,
} from '../services/StorageService'

// Export game state storage functions
export * from '../services/GameStateStorage'

// Export game engine
export { gameEngine, GameEngine, EventBus, BaseModifier } from '../engine'
