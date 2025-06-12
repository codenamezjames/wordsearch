import { defineStore } from '#q-app/wrappers'
import { createPinia } from 'pinia'

/*
 * If not building with SSR mode, you can
 * directly export the Store instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Store instance.
 */

export default defineStore((/* { ssrContext } */) => {
  const pinia = createPinia()

  // You can add Pinia plugins here
  // pinia.use(SomePiniaPlugin)

  return pinia
})

// Export the new sub-stores for direct access if needed
export { useGameStateStore } from './gameState'
export { useGameTimerStore } from './gameTimer'
export { useGameScoringStore } from './gameScoring'
export { useChallengeModeStore } from './challengeMode'

// Export storage services
export {
  gameStorage,
  gameStateStorage,
  userDataStorage,
  settingsStorage,
  StorageService,
  StorageError,
} from '../services/StorageService'

// Export game engine
export { gameEngine, GameEngine, EventBus, BaseModifier } from '../engine'
