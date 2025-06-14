<!-- EndGameModal.vue - Victory/game over modal -->
<template>
  <q-dialog
    v-model="showModal"
    transition-show="scale"
    transition-hide="scale"
    data-test="end-game-modal"
  >
    <q-card class="end-game-modal">
      <!-- Confetti overlay (only shown on victory) -->
      <div v-if="isVictory && showConfetti" ref="confettiContainer" class="confetti-container" />

      <!-- Header with result -->
      <q-card-section class="text-center q-pb-none">
        <div class="text-h4 text-weight-bold" :class="resultTextColor">
          {{ isVictory ? 'Victory!' : "Time's Up!" }}
        </div>
        <div class="text-subtitle1 q-mt-sm">
          {{ isVictory ? 'Congratulations!' : 'Better luck next time!' }}
        </div>
      </q-card-section>

      <!-- Stats Grid -->
      <q-card-section>
        <div class="row q-col-gutter-md">
          <!-- Time Taken -->
          <div class="col-6">
            <q-card flat bordered>
              <q-card-section class="text-center">
                <q-icon name="timer" size="2rem" color="primary" />
                <div class="text-h5 q-mt-sm">{{ formattedTime }}</div>
                <div class="text-caption">Time {{ isVictory ? 'Taken' : 'Elapsed' }}</div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Score -->
          <div class="col-6">
            <q-card flat bordered>
              <q-card-section class="text-center">
                <q-icon name="stars" size="2rem" color="warning" />
                <div class="text-h5 q-mt-sm">{{ formattedScore }}</div>
                <div class="text-caption">Final Score</div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Words Found -->
          <div class="col-6">
            <q-card flat bordered>
              <q-card-section class="text-center">
                <q-icon name="search" size="2rem" color="info" />
                <div class="text-h5 q-mt-sm">{{ foundWordsCount }}/{{ totalWords }}</div>
                <div class="text-caption">Words Found</div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Accuracy -->
          <div class="col-6">
            <q-card flat bordered>
              <q-card-section class="text-center">
                <q-icon name="gps_fixed" size="2rem" color="positive" />
                <div class="text-h5 q-mt-sm">{{ accuracy }}%</div>
                <div class="text-caption">Accuracy</div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- High Score Section -->
        <div v-if="isVictory" class="high-score-section q-mt-md">
          <q-banner v-if="isNewHighScore" rounded class="bg-positive text-white">
            <template v-slot:avatar>
              <q-icon name="emoji_events" />
            </template>
            New High Score! Previous best: {{ formatScore(previousHighScore) }}
          </q-banner>
        </div>

        <!-- Missed Words (only shown on game over) -->
        <div v-if="!isVictory && missedWords.length > 0" class="missed-words q-mt-md">
          <div class="text-subtitle2">Missed Words:</div>
          <div class="row q-col-gutter-sm q-mt-sm">
            <div v-for="word in missedWords" :key="word" class="col-auto">
              <q-chip outline color="grey" size="sm">{{ word }}</q-chip>
            </div>
          </div>
        </div>
      </q-card-section>

      <!-- Action Buttons -->
      <q-card-actions align="center" class="q-pa-md">
        <q-btn color="primary" label="Play Again" icon="replay" @click="restartGame" />
        <q-btn
          outline
          color="primary"
          label="Back to Menu"
          icon="home"
          class="q-ml-sm"
          @click="exitToMenu"
        />
        <q-btn flat color="grey" icon="share" class="q-ml-sm" @click="shareResult">
          <q-tooltip>Share Result</q-tooltip>
        </q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/game'
import { useGameStateStore } from '../stores/gameState'
import { useUserStore } from '../stores/user'
import { useQuasar } from 'quasar'
import { useTimeFormat } from '../composables/useTimeFormat'
import confetti from 'canvas-confetti'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue', 'restart'])

const $q = useQuasar()
const router = useRouter()
const gameStore = useGameStore()
const userStore = useUserStore()

// Refs
const confettiContainer = ref(null)
const showConfetti = ref(false)

// Computed Properties
const showModal = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const isVictory = computed(() => gameStore.foundWordsCount === gameStore.totalWords)
const resultTextColor = computed(() => (isVictory.value ? 'text-positive' : 'text-warning'))

// Use the new time formatting utility
const { formattedTime } = useTimeFormat(computed(() => gameStore.timer.seconds))

const formattedScore = computed(() => gameStore.score.toLocaleString())
const foundWordsCount = computed(() => gameStore.foundWordsCount)
const totalWords = computed(() => gameStore.totalWords)

const accuracy = computed(() => {
  if (gameStore.totalAttempts === 0) return 100
  return Math.round((gameStore.foundWordsCount / gameStore.totalAttempts) * 100)
})

const missedWords = computed(() =>
  gameStore.words.filter((word) => !gameStore.foundWords.has(word)),
)

// High score tracking
const isNewHighScore = computed(() => {
  const currentScore = gameStore.score
  const previousBest = userStore.getHighScore(gameStore.currentCategory, gameStore.difficulty)
  return currentScore > (previousBest || 0)
})

const previousHighScore = computed(
  () => userStore.getHighScore(gameStore.currentCategory, gameStore.difficulty) || 0,
)

// Format score helper
const formatScore = (score) => score.toLocaleString()

// Actions
const restartGame = () => {
  showModal.value = false
  emit('restart')
}

const exitToMenu = () => {
  showModal.value = false
  const gameState = useGameStateStore()
  gameState.isGameActive = false
  gameStore.cleanup()
  router.push({ name: 'start' })
}

const shareResult = () => {
  const emoji = isVictory.value ? '🎉' : '⏰'
  const message =
    `${emoji} Word Search - ${gameStore.difficulty}\n` +
    `📝 Found ${foundWordsCount.value}/${totalWords.value} words\n` +
    `⭐ Score: ${formattedScore.value}\n` +
    `⏱️ Time: ${formattedTime.value}\n` +
    `🎯 Accuracy: ${accuracy.value}%`

  if (navigator.share) {
    navigator
      .share({
        title: 'Word Search Result',
        text: message,
      })
      .catch(() => {
        copyToClipboard(message)
      })
  } else {
    copyToClipboard(message)
  }
}

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    $q.notify({
      message: 'Result copied to clipboard!',
      color: 'positive',
      icon: 'content_copy',
    })
  })
}

// Confetti effect
const triggerConfetti = () => {
  if (!confettiContainer.value || !isVictory.value) return

  showConfetti.value = true
  const myConfetti = confetti.create(confettiContainer.value, {
    resize: true,
    useWorker: true,
  })

  myConfetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
  })
}

// Watch for modal opening
watch(showModal, (newValue) => {
  if (newValue && isVictory.value) {
    // Use nextTick to ensure container is mounted
    nextTick(() => {
      triggerConfetti()
    })
  }
})

// Cleanup confetti on unmount
onUnmounted(() => {
  if (confettiContainer.value) {
    confetti.reset()
  }
})
</script>

<style scoped>
.end-game-modal {
  min-width: 400px;
  max-width: 600px;
}

.confetti-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
}

.missed-words {
  max-height: 100px;
  overflow-y: auto;
}

.high-score-section {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
