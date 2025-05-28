<template>
  <q-layout view="hHh LpR fFf" class="game-layout">
    <!-- Minimal header - only shown when needed -->
    <q-header v-if="showHeader" class="game-header" height-hint="60">
      <q-toolbar class="q-px-md">
        <q-toolbar-title class="text-center text-weight-medium"> Word Search </q-toolbar-title>

        <q-btn
          flat
          round
          :icon="isDark ? 'dark_mode' : 'light_mode'"
          @click="toggleDarkMode"
          class="header-btn"
        >
          <q-tooltip>Toggle Dark Mode</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <!-- Main content fills remaining space -->
    <q-page-container class="game-container">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useThemeStore } from 'stores/theme'
import { storeToRefs } from 'pinia'

const route = useRoute()
const themeStore = useThemeStore()
const { isDark } = storeToRefs(themeStore)
const { toggleDarkMode } = themeStore

// Only show header on non-game pages
const showHeader = computed(() => {
  return route.name !== 'game'
})
</script>

<style lang="scss" scoped>
.game-layout {
  --header-height: 60px;

  .game-header {
    background: rgba(var(--q-primary-rgb), 0.95);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;

    .header-btn {
      transition: all 0.2s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        transform: scale(1.05);
      }
    }
  }

  .game-container {
    height: 100vh;
    overflow: hidden;
  }
}

// Dark mode adjustments
body.body--dark .game-header {
  background: rgba(0, 0, 0, 0.95);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
</style>
