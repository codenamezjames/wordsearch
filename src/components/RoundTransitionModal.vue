<template>
  <q-dialog v-model="showModal" persistent transition-show="scale" transition-hide="scale">
    <q-card class="round-transition-modal" data-test="round-transition-modal">
      <q-card-section class="text-center">
        <q-icon name="emoji_events" size="3rem" color="positive" />
        <div class="text-h5 q-mt-md">Round Complete!</div>
      </q-card-section>

      <q-card-section>
        <!-- Round Score -->
        <div class="text-center q-mb-md">
          <div class="text-subtitle2">Round Score</div>
          <div class="text-h4 text-weight-bold text-positive">
            +{{ lastRoundScore.toLocaleString() }}
          </div>
        </div>

        <!-- Cumulative Progress -->
        <q-separator class="q-my-md" />

        <div class="row q-col-gutter-md">
          <div class="col-6">
            <div class="text-center">
              <div class="text-caption">Total Score</div>
              <div class="text-h6">
                {{ gameStore.challengeMode.cumulativeScore.toLocaleString() }}
              </div>
            </div>
          </div>
          <div class="col-6">
            <div class="text-center">
              <div class="text-caption">Target Score</div>
              <div class="text-h6">{{ gameStore.challengeMode.targetScore.toLocaleString() }}</div>
            </div>
          </div>
        </div>

        <!-- Progress Bar -->
        <q-linear-progress
          :value="progressPercent / 100"
          size="15px"
          color="positive"
          track-color="grey-3"
          class="q-mt-md"
        />

        <!-- Next Round Info -->
        <div class="text-center q-mt-md">
          <q-chip outline color="primary">
            Next: Round {{ nextRound }} of {{ gameStore.challengeMode.totalRounds }}
          </q-chip>
        </div>
      </q-card-section>

      <q-card-actions align="center">
        <q-btn
          color="primary"
          label="Continue"
          icon-right="arrow_forward"
          @click="handleContinue"
        />
        <q-btn flat color="negative" label="Exit Challenge" @click="handleExit" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/game'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue', 'continue', 'exit'])

const gameStore = useGameStore()

const showModal = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const lastRoundScore = computed(() => {
  const scores = gameStore.challengeMode.roundScores
  return scores.length > 0 ? scores[scores.length - 1] : 0
})

const progressPercent = computed(
  () => (gameStore.challengeMode.cumulativeScore / gameStore.challengeMode.targetScore) * 100,
)

const nextRound = computed(() =>
  Math.min(gameStore.challengeMode.currentRound + 1, gameStore.challengeMode.totalRounds),
)

const handleContinue = () => {
  emit('continue')
}

const handleExit = () => {
  emit('exit')
}
</script>

<style scoped>
.round-transition-modal {
  min-width: 350px;
  max-width: 450px;
}
</style>
