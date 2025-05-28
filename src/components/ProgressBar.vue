<!-- ProgressBar.vue - Game progress indicator -->
<template>
  <div class="progress-wrapper">
    <!-- Main Progress Bar -->
    <q-linear-progress
      :value="progress / 100"
      :color="progressColor"
      :class="{
        'progress-bar': true,
        'pulse-animation': shouldPulse,
      }"
      size="10px"
      rounded
    >
      <div class="absolute-full flex flex-center">
        <q-badge :color="progressColor" :label="`${Math.round(progress)}%`" floating />
      </div>
    </q-linear-progress>

    <!-- Stats Row -->
    <div class="stats-row q-mt-sm">
      <!-- Words Found -->
      <div class="stat-item">
        <q-icon name="search" size="1.2rem" color="primary" class="q-mr-xs" />
        <span class="text-weight-medium">{{ foundWordsCount }}/{{ totalWords }}</span>
        <span class="text-caption q-ml-xs">words found</span>
      </div>

      <!-- Time Remaining -->
      <div class="stat-item" v-if="showTimer">
        <q-icon name="timer" size="1.2rem" color="warning" class="q-mr-xs" />
        <span class="text-weight-medium">{{ formattedTimeRemaining }}</span>
        <span class="text-caption q-ml-xs">remaining</span>
      </div>

      <!-- Score -->
      <div class="stat-item">
        <q-icon name="stars" size="1.2rem" color="positive" class="q-mr-xs" />
        <span class="text-weight-medium">{{ formattedScore }}</span>
        <span class="text-caption q-ml-xs">points</span>
      </div>
    </div>

    <!-- Milestone Markers -->
    <div class="milestone-markers">
      <div
        v-for="milestone in milestones"
        :key="milestone.value"
        class="milestone-marker"
        :style="{
          left: `${milestone.value}%`,
          opacity: progress >= milestone.value ? 1 : 0.5,
        }"
        :class="{ 'milestone-reached': progress >= milestone.value }"
      >
        <q-tooltip>{{ milestone.label }}</q-tooltip>
        <q-icon
          :name="milestone.icon"
          :color="progress >= milestone.value ? milestone.color : 'grey'"
          size="1rem"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useGameStore } from '../stores/game'
import { useTimeFormat } from '../composables/useTimeFormat'

defineProps({
  showTimer: {
    type: Boolean,
    default: true,
  },
})

const gameStore = useGameStore()
const shouldPulse = ref(false)

// Progress calculation
const progress = computed(() => gameStore.progress)
const foundWordsCount = computed(() => gameStore.foundWordsCount)
const totalWords = computed(() => gameStore.totalWords)

// Score formatting
const formattedScore = computed(() => gameStore.score.toLocaleString())

// Time remaining calculation using useTimeFormat
const remainingSeconds = computed(() =>
  Math.max(0, gameStore.timer.maxTime - gameStore.timer.seconds),
)
const { formattedTime: formattedTimeRemaining } = useTimeFormat(remainingSeconds)

// Progress color based on completion
const progressColor = computed(() => {
  if (progress.value >= 100) return 'positive'
  if (progress.value >= 75) return 'warning'
  if (progress.value >= 50) return 'info'
  return 'primary'
})

// Milestone definitions
const milestones = [
  { value: 25, label: '25% Complete', icon: 'flag', color: 'primary' },
  { value: 50, label: 'Halfway There!', icon: 'flag', color: 'info' },
  { value: 75, label: 'Almost Done!', icon: 'flag', color: 'warning' },
  { value: 100, label: 'Complete!', icon: 'flag', color: 'positive' },
]
</script>

<style scoped>
.progress-wrapper {
  position: relative;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.progress-bar {
  border-radius: 4px;
}

.stats-row {
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.stat-item {
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.milestone-markers {
  position: absolute;
  top: 0.5rem;
  left: 1rem;
  right: 1rem;
  height: 20px;
  pointer-events: none;
}

.milestone-marker {
  position: absolute;
  transform: translateX(-50%);
  transition: all 0.3s ease;
}

.milestone-reached {
  transform: translateX(-50%) scale(1.2);
}

.pulse-animation {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}
</style>
