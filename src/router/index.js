import { defineRouter } from '#q-app/wrappers'
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from 'vue-router'
import routes from './routes'

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE),
  })

  // Add navigation guard for challenge mode
  Router.beforeEach((to, from, next) => {
    if (to.meta.requiresActiveChallenge) {
      // Import the store dynamically to avoid circular dependencies
      import('../stores/game').then(({ useGameStore }) => {
        const gameStore = useGameStore()
        if (!gameStore.isChallengeMode) {
          next({ name: 'start' })
          return
        }
        next()
      })
    } else {
      next()
    }
  })

  return Router
})
