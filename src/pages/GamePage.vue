<!-- GamePage.vue - Main game page with grid and controls -->
<template>
  <q-page class="game-page">
    <!-- Top HUD - Compact game info -->
    <div class="game-hud top-hud">
      <div class="hud-left">
        <q-btn flat round icon="arrow_back" :to="{ name: 'start' }" class="back-btn" size="md">
          <q-tooltip>Back to Menu</q-tooltip>
        </q-btn>

        <div class="score-display">
          <div class="score-value">{{ formattedScore }}</div>
          <div class="score-label">Score</div>
        </div>
      </div>

      <div class="hud-center">
        <div class="progress-container">
          <q-circular-progress
            :value="progress"
            :max="100"
            size="50px"
            :thickness="0.15"
            color="secondary"
            track-color="rgba(255,255,255,0.1)"
            class="progress-ring"
          >
            <div class="progress-text">{{ Math.round(progress) }}%</div>
          </q-circular-progress>
        </div>

        <game-timer class="timer-display" />
      </div>

      <div class="hud-right">
        <q-btn
          flat
          round
          icon="lightbulb"
          @click="useHint"
          :disable="!hintsAvailable"
          class="hint-btn"
          size="md"
        >
          <q-tooltip>Use Hint</q-tooltip>
        </q-btn>

        <q-btn
          flat
          round
          icon="settings"
          @click="showSettings = true"
          class="settings-btn"
          size="md"
        >
          <q-tooltip>Settings</q-tooltip>
        </q-btn>
      </div>
    </div>

    <!-- Main Game Grid - Takes up majority of screen -->
    <div class="game-board-container">
      <game-grid class="game-board" />
    </div>

    <!-- Bottom HUD - Word list -->
    <div class="game-hud bottom-hud">
      <div class="words-container">
        <word-list class="word-list-compact" />
      </div>
    </div>

    <!-- Floating action buttons for mobile -->
    <q-page-sticky position="bottom-right" :offset="[18, 18]" class="mobile-only">
      <q-btn
        fab
        icon="lightbulb"
        color="secondary"
        @click="useHint"
        :disable="!hintsAvailable"
        class="mobile-hint-btn"
      />
    </q-page-sticky>

    <!-- Dialogs -->
    <q-dialog v-model="showSettings" class="settings-dialog">
      <settings-panel v-model="showSettings" @close="showSettings = false" />
    </q-dialog>

    <end-game-modal v-model="showEndGame" @restart="restartGame" />
  </q-page>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, watch, shallowRef, ref, nextTick } from 'vue'
import { useGameStore } from '../stores/game'
import { useGameStateStore } from '../stores/gameState'
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
const { progress, formattedScore } = useGameStats()
const hintsAvailable = computed(() => gameStore.hintsEnabled && !gameStore.gameComplete)

// Watch for game completion using the underlying gameState store directly
watch(
  () => {
    const gameState = useGameStateStore()
    return gameState.gameComplete
  },
  (complete) => {
    if (complete && !gameStore.isChallengeMode) {
      showEndGame.value = true
    }
  },
  { flush: 'post' },
)

// Also watch for when all words are found as a backup
watch(
  () => {
    const gameState = useGameStateStore()
    return gameState.isGameComplete
  },
  (complete) => {
    if (complete && !gameStore.isChallengeMode && !showEndGame.value) {
      showEndGame.value = true
    }
  },
  { flush: 'post' },
)

// Initialize game
const isInitializing = ref(false)

const startGame = async () => {
  if (isInitializing.value) return
  isInitializing.value = true

  await nextTick()

  const gameState = useGameStateStore()
  if (!gameState.currentCategory) {
    gameState.currentCategory = 'animals'
  }
  if (!gameState.difficulty) {
    gameState.difficulty = 'medium'
  }

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

onBeforeUnmount(() => {
  gameStore.cleanup()
})

const useHint = () => {
  gameStore.useHint()
}
</script>

<style lang="scss" scoped>
.game-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, var(--q-primary) 0%, var(--q-secondary) 100%);
  overflow: hidden;
  position: relative;
}

.game-hud {
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 8px 16px;
  display: flex;
  align-items: center;
  z-index: 10;
  transition: all 0.3s ease;

  &.top-hud {
    justify-content: space-between;
    border-bottom: none;
    border-top: none;
    border-left: none;
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  &.bottom-hud {
    justify-content: center;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    border-bottom: none;
    border-left: none;
    border-right: none;
  }
}

.hud-left,
.hud-right {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 150px;
}

.hud-left {
  justify-content: flex-start;
}

.hud-right {
  justify-content: flex-end;
}

.hud-center {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
  justify-content: center;
}

.back-btn,
.hint-btn,
.settings-btn {
  color: rgba(255, 255, 255, 0.9);
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: scale(1.05);
    color: white;
  }

  &:disabled {
    opacity: 0.3;
  }
}

.score-display {
  text-align: center;
  color: white;

  .score-value {
    font-size: 18px;
    font-weight: 600;
    line-height: 1;
  }

  .score-label {
    font-size: 11px;
    opacity: 0.8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}

.progress-container {
  .progress-ring {
    animation: pulse 2s infinite;
  }

  .progress-text {
    font-size: 10px;
    font-weight: 600;
    color: white;
  }
}

.timer-display {
  color: white;
  font-size: 16px;
  font-weight: 500;
}

.game-board-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  min-height: 0;
}

.game-board {
  max-width: 100%;
  max-height: 100%;
  aspect-ratio: 1;
}

.words-container {
  max-width: 100%;
  overflow: hidden;
}

.word-list-compact {
  color: white;
}

.mobile-hint-btn {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.05);
  }
}

.mobile-only {
  @media (min-width: 768px) {
    display: none;
  }
}

.settings-dialog {
  z-index: 9999;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

// Dark mode adjustments
body.body--dark .game-hud {
  background: rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 255, 255, 0.05);
}

// Responsive adjustments
@media (max-width: 768px) {
  .hud-left,
  .hud-right {
    min-width: auto;
    gap: 8px;
  }

  .hud-center {
    gap: 12px;
  }

  .score-display .score-value {
    font-size: 16px;
  }

  .game-board-container {
    padding: 12px;
  }
}

@media (max-height: 600px) {
  .game-hud {
    padding: 4px 12px;
  }

  .game-board-container {
    padding: 8px;
  }
}
</style>
