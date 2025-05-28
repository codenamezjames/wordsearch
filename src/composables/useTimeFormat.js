import { computed, shallowRef } from 'vue'

/**
 * @typedef {Object} TimeFormatOptions
 * @property {boolean} [showHours=false] - Whether to show hours in the format
 * @property {boolean} [showMilliseconds=false] - Whether to show milliseconds
 * @property {boolean} [useLetters=false] - Whether to use letter suffixes (h, m, s)
 */

/**
 * Format seconds into a time string
 * @param {number} totalSeconds - Total seconds to format
 * @param {TimeFormatOptions} [options] - Formatting options
 * @returns {string} - Formatted time string
 */
export const formatTime = (totalSeconds, options = {}) => {
  const { showHours = false, showMilliseconds = false, useLetters = false } = options

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = Math.floor(totalSeconds % 60)
  const ms = Math.floor((totalSeconds % 1) * 1000)

  if (useLetters) {
    if (hours > 0 || showHours) {
      return `${hours}h ${minutes}m ${seconds}s`
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    }
    if (showMilliseconds) {
      return `${seconds}.${ms.toString().padStart(3, '0')}s`
    }
    return `${seconds}s`
  }

  const parts = []

  if (hours > 0 || showHours) {
    parts.push(hours.toString().padStart(2, '0'))
  }

  parts.push(minutes.toString().padStart(2, '0'))
  parts.push(seconds.toString().padStart(2, '0'))

  if (showMilliseconds) {
    parts.push(ms.toString().padStart(3, '0'))
  }

  return parts.join(':')
}

/**
 * Time formatting composable
 * @param {import('vue').Ref<number>} seconds - Ref containing seconds to format
 * @param {TimeFormatOptions} [options] - Formatting options
 * @returns {{
 *   formattedTime: import('vue').ComputedRef<string>
 * }}
 */
export function useTimeFormat(seconds, options = {}) {
  // Use shallowRef for options to prevent deep reactivity
  const formatOptions = shallowRef(options)

  // Cache the last computed value to prevent unnecessary updates
  const lastValue = shallowRef({ seconds: -1, result: '' })

  const formattedTime = computed(() => {
    const currentSeconds = seconds.value

    // Return cached value if seconds haven't changed
    if (lastValue.value.seconds === currentSeconds) {
      return lastValue.value.result
    }

    // Compute new value and update cache
    const result = formatTime(currentSeconds, formatOptions.value)
    lastValue.value = { seconds: currentSeconds, result }

    return result
  })

  return {
    formattedTime,
  }
}
