import { computed } from 'vue'
import { useThemeStore } from '../stores/theme'

/**
 * Theme composable for managing application theme
 * @returns {{
 *   isDark: import('vue').ComputedRef<boolean>,
 *   toggleTheme: () => void,
 *   setTheme: (isDark: boolean) => void
 * }}
 */
export function useTheme() {
  const themeStore = useThemeStore()

  /** @type {import('vue').ComputedRef<boolean>} */
  const isDark = computed(() => themeStore.isDark)

  /**
   * Toggle between light and dark theme
   * @returns {void}
   */
  const toggleTheme = () => {
    themeStore.toggleTheme()
  }

  /**
   * Set theme to light or dark
   * @param {boolean} isDark - Whether to use dark theme
   * @returns {void}
   */
  const setTheme = (isDark) => {
    themeStore.setTheme(isDark)
  }

  return {
    isDark,
    toggleTheme,
    setTheme,
  }
}
