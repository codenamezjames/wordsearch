<!-- WordList.vue - List of words to find -->
<template>
  <div class="word-list">
    <div class="word-list-header">
      <h2 class="text-h6">Words to Find</h2>
      <q-badge :color="progress === 100 ? 'positive' : 'primary'" class="progress-badge">
        {{ foundWordsCount }}/{{ totalWords }}
      </q-badge>
    </div>

    <q-list separator>
      <q-item
        v-for="word in words"
        :key="word"
        :class="{ found: isWordFound(word) }"
        class="word-item"
      >
        <q-item-section>
          <q-item-label :class="{ 'text-strike': isWordFound(word) }">
            {{ word }}
          </q-item-label>
        </q-item-section>

        <q-item-section side v-if="isWordFound(word)">
          <q-icon name="check" color="positive" />
        </q-item-section>

        <q-item-section side v-else-if="hintsEnabled">
          <q-btn flat round dense color="grey" icon="help" @click="showHint(word)">
            <q-tooltip>Show hint for {{ word }}</q-tooltip>
          </q-btn>
        </q-item-section>
      </q-item>
    </q-list>

    <!-- Empty state -->
    <div v-if="!words.length" class="empty-state">
      <q-icon name="search" size="2rem" color="grey-6" />
      <p class="text-grey-6">No words loaded</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const gameStore = useGameStore()

// Computed properties from game store
const words = computed(() => gameStore.words)
const foundWordsCount = computed(() => gameStore.foundWordsCount)
const totalWords = computed(() => gameStore.totalWords)
const progress = computed(() => gameStore.progress)
const hintsEnabled = computed(() => gameStore.hintsEnabled)

// Check if a word has been found
const isWordFound = (word) => gameStore.foundWords.has(word)

// Show hint for a word (if hints are enabled)
const showHint = (word) => {
  // This will be implemented when we add hint functionality
  $q.notify({
    message: `Hint for "${word}" coming soon!`,
    color: 'info',
    icon: 'help',
  })
}
</script>

<style scoped>
.word-list {
  width: 100%;
  max-width: 300px;
  border-radius: 8px;
  padding: 1rem;
}

.word-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.word-list-header h2 {
  margin: 0;
}

.progress-badge {
  font-size: 1rem;
  padding: 4px 8px;
}

.word-item {
  transition: background-color 0.3s ease;
  border-radius: 4px;
}

.word-item.found {
  background-color: var(--q-positive);
  background-opacity: 0.1;
}

.word-item:hover {
  background: rgba(0, 0, 0, 0.03);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
}

.empty-state p {
  margin: 0.5rem 0 0;
}
</style>
