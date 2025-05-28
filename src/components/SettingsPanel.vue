<!-- SettingsPanel.vue - Game settings sidebar component -->
<template>
  <q-dialog v-model="isOpen">
    <q-card style="min-width: 350px">
      <q-card-section>
        <div class="text-h6">Game Settings</div>
      </q-card-section>

      <q-card-section class="q-pa-none">
        <q-list padding>
          <!-- Difficulty Selection -->
          <q-item-label header class="text-subtitle2 q-mt-md">Difficulty</q-item-label>
          <q-item>
            <q-item-section>
              <q-select
                v-model="selectedDifficulty"
                :options="[
                  { label: 'Baby Mode', value: 'baby' },
                  { label: 'Easy', value: 'easy' },
                  { label: 'Medium', value: 'medium' },
                  { label: 'Hard', value: 'hard' },
                ]"
                outlined
                dense
                class="full-width"
                emit-value
                map-options
              />
            </q-item-section>
          </q-item>

          <!-- Category Selection -->
          <q-item-label header class="text-subtitle2 q-mt-md">Word Category</q-item-label>
          <q-item>
            <q-item-section>
              <q-select
                v-model="selectedCategory"
                :options="categoryOptions"
                outlined
                dense
                class="full-width"
                emit-value
                map-options
              />
            </q-item-section>
          </q-item>

          <!-- Game Options -->
          <q-item-label header class="text-subtitle2 q-mt-md">Game Options</q-item-label>

          <!-- Sound Toggle -->
          <q-item>
            <q-item-section>
              <q-item-label>Sound Effects</q-item-label>
              <q-item-label caption>Enable game sound effects</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-toggle v-model="soundEnabled" color="primary" @update:model-value="toggleSound" />
            </q-item-section>
          </q-item>

          <!-- Hints Toggle -->
          <q-item>
            <q-item-section>
              <q-item-label>Word Hints</q-item-label>
              <q-item-label caption>Show hints for finding words</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-toggle v-model="hintsEnabled" color="primary" @update:model-value="toggleHints" />
            </q-item-section>
          </q-item>

          <!-- Stats Section -->
          <q-separator spaced />
          <q-item-label header class="text-subtitle2">Statistics</q-item-label>

          <q-item>
            <q-item-section>
              <q-item-label>Games Played</q-item-label>
              <q-item-label caption>Total games completed</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-chip color="primary" text-color="white" size="sm">
                {{ gamesPlayed }}
              </q-chip>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section>
              <q-item-label>Best Time</q-item-label>
              <q-item-label caption>Current difficulty</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-chip color="positive" text-color="white" size="sm">
                {{ bestTime || '--:--' }}
              </q-chip>
            </q-item-section>
          </q-item>

          <!-- Reset Progress -->
          <q-separator spaced />
          <q-item>
            <q-item-section>
              <q-btn flat color="negative" label="Reset Progress" @click="confirmReset" />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Close" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import { useGameStore } from '../stores/game'
import { useUserStore } from '../stores/user'
import { useTimeFormat } from '../composables/useTimeFormat'
import { useCategoriesStore } from '../stores/categories'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])

const $q = useQuasar()
const gameStore = useGameStore()
const userStore = useUserStore()
const categoriesStore = useCategoriesStore()

// Computed Properties
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// Category options
const categoryOptions = computed(() =>
  categoriesStore.categoryNames.map((cat) => ({
    label: categoriesStore.getCategoryDisplayName(cat),
    value: cat,
  })),
)

const selectedDifficulty = computed({
  get: () => gameStore.difficulty,
  set: (value) => gameStore.setDifficulty(value),
})

const selectedCategory = computed({
  get: () => gameStore.currentCategory,
  set: (value) => gameStore.setCategory(value),
})

const soundEnabled = computed(() => gameStore.soundEnabled)
const hintsEnabled = computed(() => gameStore.hintsEnabled)
const gamesPlayed = computed(() => userStore.stats.totalGamesPlayed)

// Best time formatting
const bestTime = computed(() => {
  const time = userStore.getBestTime(selectedCategory.value, selectedDifficulty.value)
  if (!time) return null

  const { formattedTime } = useTimeFormat(computed(() => time))
  return formattedTime.value
})

const toggleSound = () => {
  gameStore.toggleSound()
}

const toggleHints = () => {
  gameStore.toggleHints()
}

// Reset progress confirmation
const confirmReset = () => {
  $q.dialog({
    title: 'Reset Progress',
    message: 'Are you sure you want to reset all game progress? This cannot be undone.',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    userStore.resetProgress()
    $q.notify({
      message: 'Game progress has been reset',
      color: 'info',
    })
  })
}
</script>

<style scoped>
.q-item {
  border-radius: 8px;
  margin: 4px 0;
}

.q-separator {
  margin: 16px 0;
}

:deep(.q-field__native) {
  color: inherit;
}

:deep(.q-field__input) {
  color: inherit;
}

:deep(.q-item) {
  color: inherit;
}

:deep(.q-field__label) {
  color: inherit;
}

:deep(.q-field__marginal) {
  color: inherit;
}
</style>
