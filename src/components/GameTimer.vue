<!-- GameTimer.vue - Game timer display component -->
<template>
  <div class="game-timer">
    <q-circular-progress
      :value="progressValue"
      :min="0"
      :max="maxTime"
      :color="timerColor"
      size="60px"
      :thickness="0.2"
      class="q-mr-sm"
    >
      <q-icon :name="timerIcon" :color="timerColor" size="24px" />
    </q-circular-progress>

    <div class="timer-details">
      <div class="time-display text-h5" :class="timerColor">
        {{ formattedTime }}
      </div>
      <div class="timer-label text-caption text-grey">
        {{ isRunning ? 'Time Elapsed' : 'Game Timer' }}
      </div>
    </div>

    <!-- Timer controls (only shown when game is not active) -->
    <div v-if="showControls && !isGameActive" class="timer-controls">
      <q-btn
        flat
        round
        dense
        :icon="isRunning ? 'pause' : 'play_arrow'"
        :color="timerColor"
        @click="toggleTimer"
      >
        <q-tooltip>
          {{ isRunning ? 'Pause Timer' : 'Start Timer' }}
        </q-tooltip>
      </q-btn>
      <q-btn flat round dense icon="restart_alt" color="grey" @click="resetTimer">
        <q-tooltip>Reset Timer</q-tooltip>
      </q-btn>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/game'

const props = defineProps({
  maxTime: {
    type: Number,
    default: 300, // 5 minutes default
  },
  showControls: {
    type: Boolean,
    default: false,
  },
})

const gameStore = useGameStore()

// Timer state
const isRunning = computed(() => gameStore.timer?.isRunning ?? false)
const formattedTime = computed(() => {
  const seconds = gameStore.timer?.seconds ?? 0
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
})
const isGameActive = computed(() => gameStore.isGameActive)

// Progress calculation (0-100)
const progressValue = computed(() => {
  if (!gameStore.timer?.seconds) return 0
  const progress = (gameStore.timer.seconds / props.maxTime) * 100
  return Math.min(progress, 100)
})

// Dynamic timer color based on progress
const timerColor = computed(() => {
  if (!isRunning.value) return 'grey'
  if (progressValue.value >= 80) return 'negative'
  if (progressValue.value >= 60) return 'warning'
  return 'positive'
})

// Dynamic timer icon based on state
const timerIcon = computed(() => {
  if (!isRunning.value) return 'timer'
  if (progressValue.value >= 80) return 'timer_off'
  return 'schedule'
})

// Timer controls
const toggleTimer = () => {
  // TODO: Implement timer controls when needed
  console.log('Timer toggle requested')
}

const resetTimer = () => {
  // TODO: Implement timer reset when needed
  console.log('Timer reset requested')
}
</script>

<style scoped>
.game-timer {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.timer-details {
  margin: 0 1rem;
}

.time-display {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  line-height: 1;
}

.timer-label {
  margin-top: 0.25rem;
}

.timer-controls {
  display: flex;
  gap: 0.5rem;
  margin-left: auto;
}

/* Color classes for time display */
.positive {
  color: var(--q-positive);
}

.warning {
  color: var(--q-warning);
}

.negative {
  color: var(--q-negative);
}

.grey {
  color: var(--q-grey);
}
</style>
