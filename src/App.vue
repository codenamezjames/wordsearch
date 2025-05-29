<template>
  <router-view />
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useGameStore } from './stores/game'

const gameStore = useGameStore()

// Handler for beforeunload event
const handleBeforeUnload = (e) => {
  if (gameStore.isGameActive) {
    const message = 'You have an active game. Are you sure you want to leave?'
    e.returnValue = message
    return message
  }
}

// Add and remove event listener
onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})
</script>
