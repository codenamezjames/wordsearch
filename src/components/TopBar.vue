<!-- TopBar.vue - Game header with timer and score -->
<template>
  <q-header elevated>
    <q-toolbar>
      <!-- Left Section: Category & Difficulty -->
      <div class="row items-center">
        <q-btn
          flat
          round
          dense
          icon="arrow_back"
          color="primary"
          class="q-mr-sm"
          @click="confirmExit"
          v-if="isGameActive"
        >
          <q-tooltip>Exit Game</q-tooltip>
        </q-btn>
        <div class="column">
          <div class="text-subtitle1 text-weight-medium">{{ currentCategory }}</div>
          <div class="text-caption text-grey">{{ difficultyLabel }}</div>
        </div>
      </div>

      <!-- Center Section: Timer -->
      <q-space />
      <game-timer :max-time="maxGameTime" class="q-mx-md" />
      <q-space />

      <!-- Right Section: Score & Settings -->
      <div class="row items-center">
        <!-- Score Display -->
        <div class="score-display q-mr-md">
          <div class="text-subtitle1 text-weight-medium">Score</div>
          <div class="text-h6 text-primary">{{ formattedScore }}</div>
        </div>

        <!-- Settings Button -->
        <q-btn flat round dense icon="settings" color="grey" @click="toggleSettings">
          <q-tooltip>Game Settings</q-tooltip>
        </q-btn>

        <!-- Sound Toggle -->
        <q-btn
          flat
          round
          dense
          :icon="soundEnabled ? 'volume_up' : 'volume_off'"
          :color="soundEnabled ? 'primary' : 'grey'"
          class="q-ml-sm"
          @click="toggleSound"
        >
          <q-tooltip>{{ soundEnabled ? 'Mute Sound' : 'Enable Sound' }}</q-tooltip>
        </q-btn>

        <!-- Hints Toggle -->
        <q-btn
          flat
          round
          dense
          icon="help"
          :color="hintsEnabled ? 'warning' : 'grey'"
          class="q-ml-sm"
          @click="toggleHints"
        >
          <q-tooltip>{{ hintsEnabled ? 'Disable Hints' : 'Enable Hints' }}</q-tooltip>
        </q-btn>
      </div>
    </q-toolbar>

    <!-- Progress Bar -->
    <div class="progress-container">
      <q-linear-progress
        :value="progress / 100"
        :color="progressColor"
        size="4px"
        class="progress-bar"
      />
      <div class="progress-label text-caption q-px-sm">
        {{ foundWordsCount }}/{{ totalWords }} words found
      </div>
    </div>
  </q-header>
</template>

<script setup>
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import { useGameStore } from '../stores/game'
import GameTimer from './GameTimer.vue'

const props = defineProps({
  showSettings: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['update:showSettings'])

const $q = useQuasar()
const gameStore = useGameStore()

// Game state
const isGameActive = computed(() => gameStore.isGameActive)
const currentCategory = computed(
  () => gameStore.currentCategory.charAt(0).toUpperCase() + gameStore.currentCategory.slice(1),
)

// Difficulty label with icon
const difficultyLabel = computed(() => {
  const labels = {
    baby: '👶 Baby Mode',
    easy: '🌟 Easy',
    medium: '🔥 Medium',
    hard: '💪 Hard',
  }
  return labels[gameStore.difficulty] || gameStore.difficulty
})

// Score formatting
const formattedScore = computed(() => {
  return gameStore.score.toLocaleString()
})

// Progress calculations
const progress = computed(() => gameStore.progress)
const foundWordsCount = computed(() => gameStore.foundWordsCount)
const totalWords = computed(() => gameStore.totalWords)

// Settings state
const soundEnabled = computed(() => gameStore.soundEnabled)
const hintsEnabled = computed(() => gameStore.hintsEnabled)

// Progress bar color based on completion
const progressColor = computed(() => {
  if (progress.value >= 100) return 'positive'
  if (progress.value >= 75) return 'warning'
  return 'primary'
})

// Maximum time for the timer (based on difficulty)
const maxGameTime = computed(() => {
  const times = {
    baby: 120, // 2 minutes
    easy: 300, // 5 minutes
    medium: 480, // 8 minutes
    hard: 600, // 10 minutes
  }
  return times[gameStore.difficulty] || 300
})

// Actions
const toggleSettings = () => {
  emit('update:showSettings', !props.showSettings)
}

const toggleSound = () => {
  gameStore.toggleSound()
}

const toggleHints = () => {
  gameStore.toggleHints()
}

const confirmExit = () => {
  $q.dialog({
    title: 'Exit Game',
    message: 'Are you sure you want to exit? Your progress will be lost.',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    gameStore.isGameActive = false
  })
}
</script>

<style scoped>
.q-toolbar {
  min-height: 72px;
}

.score-display {
  text-align: right;
}

.progress-container {
  position: relative;
  height: 24px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
}

.progress-label {
  text-align: center;
  color: var(--q-primary);
  font-weight: 500;
  margin-bottom: 6px;
}

/* Responsive adjustments */
@media (max-width: 599px) {
  .q-toolbar {
    padding: 0 8px;
  }

  .text-subtitle1 {
    font-size: 0.9rem;
  }

  .text-h6 {
    font-size: 1.1rem;
  }

  .score-display {
    margin-right: 8px;
  }
}
</style>
