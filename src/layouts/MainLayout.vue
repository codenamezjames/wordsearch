<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title class="text-center">Word Search Game</q-toolbar-title>

        <q-btn flat round :icon="isDark ? 'dark_mode' : 'light_mode'" @click="toggleDarkMode">
          <q-tooltip>Toggle Dark Mode</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { useThemeStore } from 'stores/theme'
import { storeToRefs } from 'pinia'

const themeStore = useThemeStore()
const { isDark } = storeToRefs(themeStore)
const { toggleDarkMode } = themeStore
</script>
