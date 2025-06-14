<template>
  <q-dialog v-model="showModal" persistent transition-show="scale" transition-hide="scale">
    <q-card class="challenge-complete-modal" data-test="challenge-complete-modal">
      <!-- Confetti for success -->
      <div v-if="isSuccess && showConfetti" ref="confettiContainer" class="confetti-container" />

      <q-card-section class="text-center">
        <q-icon
          :name="isSuccess ? 'emoji_events' : 'sentiment_dissatisfied'"
          size="4rem"
          :color="isSuccess ? 'warning' : 'grey-6'"
        />
        <div class="text-h4 q-mt-md" :class="isSuccess ? 'text-positive' : 'text-negative'">
          {{ isSuccess ? 'Challenge Complete!' : 'Challenge Failed' }}
        </div>
        <div class="text-subtitle1 q-mt-sm">
          {{
            isSuccess ? 'Congratulations! You reached the target!' : 'You gave it your best shot!'
          }}
        </div>
      </q-card-section>

      <q-card-section>
        <!-- Final Stats -->
        <div class="row q-col-gutter-md">
          <div class="col-6">
            <q-card flat bordered>
              <q-card-section class="text-center">
                <div class="text-h5">{{ finalScore.toLocaleString() }}</div>
                <div class="text-caption">Final Score</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-6">
            <q-card flat bordered>
              <q-card-section class="text-center">
                <div class="text-h5">{{ targetScore.toLocaleString() }}</div>
                <div class="text-caption">Target Score</div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- Achievement Progress -->
        <q-linear-progress
          :value="achievementPercent / 100"
          size="20px"
          :color="isSuccess ? 'positive' : 'negative'"
          track-color="grey-3"
          class="q-mt-md"
        >
          <div class="absolute-full flex flex-center">
            <q-badge
              color="white"
              :text-color="isSuccess ? 'positive' : 'negative'"
              :label="`${Math.round(achievementPercent)}%`"
            />
          </div>
        </q-linear-progress>

        <!-- Round Breakdown -->
        <div class="q-mt-md">
          <div class="text-subtitle2 q-mb-sm">Round Scores:</div>
          <div class="row q-col-gutter-sm">
            <div v-for="(score, index) in roundScores" :key="index" class="col-auto">
              <q-chip
                :color="score > averageRoundScore ? 'positive' : 'grey-5'"
                text-color="white"
                size="sm"
              >
                R{{ index + 1 }}: {{ score }}
              </q-chip>
            </div>
          </div>
        </div>

        <!-- Stats Summary -->
        <div class="stats-summary q-mt-md">
          <div class="row q-col-gutter-sm text-caption">
            <div class="col-4 text-center">
              <div class="text-weight-bold">{{ totalTime }}</div>
              <div>Total Time</div>
            </div>
            <div class="col-4 text-center">
              <div class="text-weight-bold">{{ bestRound }}</div>
              <div>Best Round</div>
            </div>
            <div class="col-4 text-center">
              <div class="text-weight-bold">{{ averageScore }}</div>
              <div>Avg Score</div>
            </div>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="center">
        <q-btn color="primary" label="Try Again" icon="replay" @click="handlePlayAgain" />
        <q-btn outline color="primary" label="Back to Menu" icon="home" @click="handleExit" />
        <q-btn flat color="grey" icon="share" @click="shareResult">
          <q-tooltip>Share Result</q-tooltip>
        </q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useGameStore } from '../stores/game'
import { useQuasar } from 'quasar'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue', 'play-again', 'exit'])

const gameStore = useGameStore()
const $q = useQuasar()

const confettiContainer = ref(null)
const showConfetti = ref(false)

const showModal = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const isSuccess = computed(() => gameStore.challengeMode.success)
const finalScore = computed(() => gameStore.challengeMode.cumulativeScore)
const targetScore = computed(() => gameStore.challengeMode.targetScore)
const roundScores = computed(() => gameStore.challengeMode.roundScores)
const achievementPercent = computed(() => (finalScore.value / targetScore.value) * 100)

const averageRoundScore = computed(() => {
  if (roundScores.value.length === 0) return 0
  const sum = roundScores.value.reduce((a, b) => a + b, 0)
  return Math.round(sum / roundScores.value.length)
})

const bestRound = computed(() => {
  if (roundScores.value.length === 0) return 0
  return Math.max(...roundScores.value)
})

const averageScore = computed(() => averageRoundScore.value)

const totalTime = computed(() => {
  const elapsed = Date.now() - gameStore.challengeMode.startTime
  const minutes = Math.floor(elapsed / 60000)
  const seconds = Math.floor((elapsed % 60000) / 1000)
  return `${minutes}m ${seconds}s`
})

const handlePlayAgain = () => {
  emit('play-again')
}

const handleExit = () => {
  emit('exit')
}

const shareResult = () => {
  const emoji = isSuccess.value ? '🏆' : '💪'
  const message =
    `${emoji} Word Search Challenge - ${gameStore.challengeMode.difficulty}\n` +
    `📊 Score: ${finalScore.value.toLocaleString()}/${targetScore.value.toLocaleString()}\n` +
    `🎯 Rounds: ${roundScores.value.length}/10\n` +
    `⏱️ Time: ${totalTime.value}\n` +
    `⭐ Best Round: ${bestRound.value}`

  if (navigator.share) {
    navigator
      .share({
        title: 'Word Search Challenge Result',
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

// Trigger confetti on success
const triggerConfetti = () => {
  if (!confettiContainer.value || !isSuccess.value) return

  showConfetti.value = true
  // Simple confetti effect without external library
  // You can install canvas-confetti if needed
  console.log('🎉 Confetti effect triggered!')
}

watch(showModal, (newValue) => {
  if (newValue && isSuccess.value) {
    nextTick(() => {
      triggerConfetti()
    })
  }
})
</script>

<style scoped>
.challenge-complete-modal {
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

.stats-summary {
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  padding: 12px;
}
</style>
