<template>
  <router-view />
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useGameStore } from './stores/game'

let gameStore = null

// Handler for beforeunload event
const handleBeforeUnload = (e) => {
  if (gameStore && gameStore.isGameActive) {
    const message = 'You have an active game. Are you sure you want to leave?'
    e.returnValue = message
    return message
  }
}

// Add and remove event listener
onMounted(() => {
  // Initialize the store after Pinia is ready
  gameStore = useGameStore()
  // Initialize the store to load saved settings including difficulty
  gameStore.initialize()
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})
</script>
