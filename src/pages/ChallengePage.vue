<template>
  <!-- Loading state -->
  <div v-if="!gameStore.challengeMode" class="full-height flex flex-center">
    <q-spinner-dots color="primary" size="50px" />
  </div>

  <!-- Challenge Content -->
  <div v-else class="full-height column no-wrap">
    <!-- Challenge Header -->
    <div class="challenge-header">
      <div class="q-px-md q-py-sm row items-center">
        <q-btn flat round icon="arrow_back" @click="handleExitChallenge" />

        <div class="q-ml-md row items-center q-gutter-md flex-grow">
          <div>
            <div class="text-h6">Challenge Mode</div>
            <div class="text-caption">
              {{ gameStore.currentCategory }} - {{ gameStore.difficulty }}
            </div>
          </div>

          <q-chip color="primary" text-color="white">
            Round {{ gameStore.challengeMode.currentRound || 1 }} of
            {{ gameStore.challengeMode.totalRounds || 10 }}
          </q-chip>
        </div>
      </div>

      <!-- Score Progress Bar -->
      <div class="q-px-md q-pb-md">
        <div class="text-subtitle2 q-mb-sm">
          Score: {{ gameStore.challengeMode.cumulativeScore?.toLocaleString() || '0' }} /
          {{ gameStore.challengeMode.targetScore?.toLocaleString() || '0' }}
        </div>
        <q-linear-progress
          :value="(challengeProgress || 0) / 100"
          size="20px"
          color="positive"
          track-color="grey-3"
          class="challenge-progress-bar"
        >
          <div class="absolute-full flex flex-center">
            <q-badge
              color="white"
              text-color="primary"
              :label="`${Math.round(challengeProgress || 0)}%`"
            />
          </div>
        </q-linear-progress>
      </div>
    </div>

    <!-- Main Game Content -->
    <div class="col-grow column no-wrap">
      <TopBar class="q-mb-md" :show-settings="showSettings" />

      <!-- Desktop Layout -->
      <div v-if="$q.screen.gt.xs" class="col-grow row q-gutter-md no-wrap">
        <div class="col-grow flex flex-center">
          <GameGrid />
        </div>
        <div class="col-auto" style="width: 300px">
          <div class="column full-height">
            <WordList class="col-grow" />
            <ProgressBar class="q-mt-md" />
          </div>
        </div>
      </div>

      <!-- Mobile Layout -->
      <div v-else class="col-grow column no-wrap">
        <div class="col-grow flex flex-center full-height">
          <GameGrid />
        </div>
      </div>
    </div>

    <!-- Mobile Sidebar (Fixed Bottom) -->
    <div
      class="xs fixed-bottom full-width bg-background q-pa-sm"
      style="height: 120px; border-top: 1px solid rgba(255, 255, 255, 0.1); z-index: 50"
    >
      <WordList style="height: 100%; overflow-y: auto" />
    </div>

    <!-- Round Transition Modal -->
    <RoundTransitionModal
      v-model="showRoundTransition"
      @continue="handleContinue"
      @exit="handleExitChallenge"
    />

    <!-- Challenge Complete Modal -->
    <ChallengeCompleteModal
      v-model="showChallengeComplete"
      @play-again="handlePlayAgain"
      @exit="handleExitChallenge"
    />

    <!-- Settings Panel -->
    <SettingsPanel v-model="showSettings" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/game'
import { useQuasar } from 'quasar'
import TopBar from '../components/TopBar.vue'
import GameGrid from '../components/GameGrid.vue'
import WordList from '../components/WordList.vue'
import ProgressBar from '../components/ProgressBar.vue'
import RoundTransitionModal from '../components/RoundTransitionModal.vue'
import ChallengeCompleteModal from '../components/ChallengeCompleteModal.vue'
import SettingsPanel from '../components/SettingsPanel.vue'

const router = useRouter()
const gameStore = useGameStore()
const $q = useQuasar()

// Refs
const showRoundTransition = ref(false)
const showChallengeComplete = ref(false)
const showSettings = ref(false)

// Computed
const challengeProgress = computed(() => gameStore.challengeProgress || 0)

// Watch for game completion
watch(
  () => gameStore.gameComplete,
  (newVal) => {
    if (newVal && gameStore.isChallengeMode) {
      // Delay to allow final animations
      setTimeout(() => {
        if (gameStore.challengeMode.completed) {
          showChallengeComplete.value = true
        } else {
          showRoundTransition.value = true
        }
      }, 1500)
    }
  },
)

// Methods
const handleContinue = () => {
  showRoundTransition.value = false
  gameStore.nextChallengeRound()
}

const handlePlayAgain = () => {
  showChallengeComplete.value = false
  // Restart challenge with same settings
  gameStore.initChallengeMode(gameStore.challengeMode.category, gameStore.challengeMode.difficulty)
  gameStore.startNewGame()
}

const handleExitChallenge = () => {
  $q.dialog({
    title: 'Exit Challenge?',
    message: 'Are you sure you want to exit the challenge? Your progress will be lost.',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    gameStore.exitChallengeMode()
    router.push({ name: 'start' })
  })
}

// Lifecycle
onMounted(() => {
  // Verify challenge mode is active
  if (!gameStore.challengeMode?.isActive) {
    console.warn('Challenge mode not active, redirecting to start menu')
    router.push({ name: 'start' })
  }
})
</script>

<style scoped>
/* Only styling-related CSS, no layout */
.challenge-header {
  background: rgba(var(--q-primary-rgb), 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.challenge-progress-bar {
  border-radius: 10px;
}

.challenge-progress-bar :deep(.q-linear-progress__model) {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
}

/* Dark mode adjustments */
body.body--dark .challenge-header {
  background: rgba(0, 0, 0, 0.95);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
</style>
