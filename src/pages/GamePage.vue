<!-- GamePage.vue - Main game page with grid and controls -->
<template>
  <q-page class="bg-primary q-pa-md">
    <!-- Game Header Bar -->
    <div class="row items-center q-mb-md rounded-borders q-pa-md">
      <q-btn flat icon="arrow_back" :to="{ name: 'start' }" label="Back" />
      <q-space />
      <div class="row items-center">
        <game-timer class="q-mr-md" />
        <div class="text-h6">Score: {{ formattedScore }}</div>
      </div>
      <q-space />
      <q-btn flat icon="settings" @click="showSettings = true" />
    </div>

    <!-- Main Game Area -->
    <div class="row q-col-gutter-md game-area">
      <!-- Word List -->
      <div class="col-12 col-md-3">
        <q-card flat bordered class="full-height">
          <q-card-section class="q-pa-md">
            <h3 class="text-h6 q-mb-md">Words to Find</h3>
            <word-list />
          </q-card-section>
        </q-card>
      </div>

      <!-- Game Grid -->
      <div class="col-12 col-md-6">
        <q-card flat bordered class="full-height">
          <q-card-section class="full-height">
            <game-grid class="full-height" />
          </q-card-section>
        </q-card>
      </div>

      <!-- Game Stats -->
      <div class="col-12 col-md-3">
        <q-card flat bordered class="full-height">
          <q-card-section class="q-pa-md">
            <h3 class="text-h6 q-mb-md">Game Stats</h3>
            <div class="q-mb-sm">
              <div class="text-subtitle2">Progress</div>
              <q-linear-progress :value="progress / 100" color="secondary" class="q-mt-sm" />
              <div class="text-caption text-right">{{ progress }}%</div>
            </div>
            <div class="q-mb-sm">
              <div class="text-subtitle2">Accuracy</div>
              <q-linear-progress :value="accuracy / 100" color="positive" class="q-mt-sm" />
              <div class="text-caption text-right">{{ accuracy }}%</div>
            </div>
            <div class="q-mb-md">
              <div class="text-subtitle2">High Score</div>
              <div class="text-h6">{{ previousHighScore }}</div>
            </div>
            <q-btn
              flat
              color="primary"
              label="Hint"
              icon="lightbulb"
              class="full-width"
              :disable="!hintsAvailable"
              @click="useHint"
            />
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Settings Dialog -->
    <q-dialog v-model="showSettings">
      <settings-panel v-model="showSettings" @close="showSettings = false" />
    </q-dialog>

    <!-- End Game Modal -->
    <end-game-modal v-model="showEndGame" @restart="restartGame" />
  </q-page>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, watch, shallowRef, ref, nextTick } from 'vue'
import { useGameStore } from '../stores/game'
import { useGameStats } from '../composables/useGameStats'
import GameGrid from '../components/GameGrid.vue'
import WordList from '../components/WordList.vue'
import GameTimer from '../components/GameTimer.vue'
import SettingsPanel from '../components/SettingsPanel.vue'
import EndGameModal from '../components/EndGameModal.vue'

const gameStore = useGameStore()

// Use shallowRef for complex objects that don't need deep reactivity
const showSettings = shallowRef(false)
const showEndGame = shallowRef(false)

// Cache computed values
const { accuracy, progress, formattedScore, previousHighScore } = useGameStats()
const hintsAvailable = computed(() => gameStore.hintsEnabled && !gameStore.gameComplete)

// Watch for game completion
watch(
  () => gameStore.gameComplete,
  (complete) => {
    if (complete) {
      showEndGame.value = true
    }
  },
  { flush: 'post' }, // Defer watcher to next tick for better performance
)

// Initialize game
const isInitializing = ref(false)

const startGame = async () => {
  if (isInitializing.value) return
  isInitializing.value = true

  await nextTick()

  if (!gameStore.currentCategory || !gameStore.difficulty) {
    // Set defaults for testing
    gameStore.setCategory('animals')
    gameStore.setDifficulty('medium')
  }

  // Start new game and wait for grid initialization
  await nextTick()
  gameStore.startNewGame()
  isInitializing.value = false
}

const restartGame = async () => {
  showEndGame.value = false
  await startGame()
}

onMounted(() => {
  startGame()
})

// Cleanup on leave
onBeforeUnmount(() => {
  gameStore.cleanup()
})

// Hint functionality
const useHint = () => {
  gameStore.useHint()
}
</script>

<style lang="scss" scoped>
.q-page {
  min-height: calc(100vh - 50px); // Account for main header
  display: flex;
  flex-direction: column;
}

.game-area {
  flex: 1;
  min-height: 0; // Important for flex child
}

.full-height {
  height: 100%;
  min-height: 400px; // Ensure minimum height for content
}

.rounded-borders {
  border-radius: 8px;
}

.bg-dark {
  background: rgba(30, 30, 30, 0.95);
}
</style>
