import { ref } from 'vue'
import { useTimeFormat } from './useTimeFormat'

/**
 * Timer composable for tracking game duration
 * @returns {{
 *   seconds: import('vue').Ref<number>,
 *   isRunning: import('vue').Ref<boolean>,
 *   formattedTime: import('vue').ComputedRef<string>,
 *   start: () => void,
 *   stop: () => void,
 *   reset: () => void,
 *   cleanup: () => void
 * }}
 */
export function useTimer() {
  /** @type {import('vue').Ref<number>} */
  const seconds = ref(0)

  /** @type {import('vue').Ref<number | null>} */
  const timerInterval = ref(null)

  /** @type {import('vue').Ref<boolean>} */
  const isRunning = ref(false)

  // Use the new time formatting utility
  const { formattedTime } = useTimeFormat(seconds)

  /**
   * Starts the timer if not already running
   * @returns {void}
   */
  const start = () => {
    if (!isRunning.value) {
      isRunning.value = true
      timerInterval.value = setInterval(() => {
        seconds.value++
      }, 1000)
    }
  }

  /**
   * Stops the timer if running
   * @returns {void}
   */
  const stop = () => {
    if (timerInterval.value) {
      clearInterval(timerInterval.value)
      timerInterval.value = null
      isRunning.value = false
    }
  }

  /**
   * Resets the timer to 0 and stops it
   * @returns {void}
   */
  const reset = () => {
    stop()
    seconds.value = 0
  }

  /**
   * Cleanup function to prevent memory leaks
   * @returns {void}
   */
  const cleanup = () => {
    stop()
  }

  return {
    seconds,
    isRunning,
    formattedTime,
    start,
    stop,
    reset,
    cleanup,
  }
}
