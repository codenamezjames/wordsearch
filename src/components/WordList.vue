<!-- WordList.vue - List of words to find -->
<template>
  <div class="word-list-compact">
    <div class="words-grid">
      <div
        v-for="word in words"
        :key="word"
        :class="{ found: isWordFound(word), pending: !isWordFound(word) }"
        class="word-chip"
      >
        <span class="word-text">{{ word }}</span>
        <q-icon v-if="isWordFound(word)" name="check_circle" class="word-icon found-icon" />
      </div>
    </div>

    <div v-if="!words.length" class="empty-state">
      <q-icon name="search" size="1.5rem" color="rgba(255,255,255,0.5)" />
      <span class="empty-text">No words loaded</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStateStore } from '../stores/gameState'

const gameStateStore = useGameStateStore()

// Computed properties from game state store
const words = computed(() => gameStateStore.words)

// Check if a word has been found
const isWordFound = (word) => gameStateStore.foundWords.has(word)
</script>

<style scoped>
.word-list-compact {
  width: 100%;
  padding: 8px 0;
}

.words-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  align-items: center;
  max-width: 100%;
}

.word-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  white-space: nowrap;
  backdrop-filter: blur(5px);
  border: 1px solid transparent;
}

.word-chip.pending {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
  border-color: rgba(255, 255, 255, 0.2);
}

.word-chip.found {
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
  border-color: rgba(76, 175, 80, 0.3);
  transform: scale(0.95);
}

.word-chip.found .word-text {
  text-decoration: line-through;
  opacity: 0.8;
}

.word-chip.found .found-icon {
  color: #4caf50;
  font-size: 16px;
}

.word-chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.word-text {
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.word-icon {
  font-size: 14px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  color: rgba(255, 255, 255, 0.5);
}

.empty-text {
  font-size: 14px;
}

@media (max-width: 768px) {
  .word-chip {
    font-size: 12px;
    padding: 4px 8px;
    gap: 3px;
  }

  .words-grid {
    gap: 6px;
  }
}

@media (max-width: 480px) {
  .word-chip {
    font-size: 11px;
    padding: 3px 6px;
  }

  .words-grid {
    gap: 4px;
  }
}
</style>
