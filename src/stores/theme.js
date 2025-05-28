import { defineStore } from 'pinia'
import { useQuasar } from 'quasar'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const $q = useQuasar()
  const isDark = ref($q.dark.isActive)

  // Watch for system dark mode changes
  watch(
    () => $q.dark.isActive,
    (val) => {
      isDark.value = val
    },
  )

  // Toggle dark mode
  function toggleDarkMode() {
    $q.dark.toggle()
    isDark.value = $q.dark.isActive
  }

  // Set specific dark mode
  function setDarkMode(value) {
    $q.dark.set(value)
    isDark.value = value
  }

  return {
    isDark,
    toggleDarkMode,
    setDarkMode,
  }
})
