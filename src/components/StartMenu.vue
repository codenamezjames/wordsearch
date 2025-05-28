<!-- StartMenu.vue - Main menu component -->
<template>
  <div class="start-menu">
    <div class="menu-content">
      <!-- Game Logo/Title -->
      <div class="title-section">
        <h1 class="text-h3 text-weight-bold q-mb-none">Word Search</h1>
        <p class="text-subtitle1 text-grey-7 q-mt-sm">Find words, beat time, have fun!</p>
      </div>

      <!-- Quick Start Section -->
      <div class="quick-start-section q-mt-lg">
        <h2 class="text-h5 q-mb-md">Quick Start</h2>
        <div class="difficulty-buttons row q-col-gutter-md">
          <div v-for="option in difficultyOptions" :key="option.value" class="col-12 col-sm-6">
            <q-btn
              :label="option.label"
              :color="option.color"
              class="full-width"
              size="lg"
              @click="startGame(option.value)"
            >
              <template v-slot:default>
                <div class="column items-center">
                  <div class="text-subtitle1">{{ option.label }}</div>
                  <div class="text-caption">{{ getDifficultyDescription(option.value) }}</div>
                </div>
              </template>
            </q-btn>
          </div>
        </div>
      </div>

      <!-- Category Selection -->
      <div class="category-section q-mt-lg">
        <h2 class="text-h5 q-mb-md">Categories</h2>
        <div class="category-grid row q-col-gutter-md">
          <div v-for="category in categoryOptions" :key="category.value" class="col-6 col-sm-4">
            <q-card
              class="category-card"
              :class="{ selected: selectedCategory === category.value }"
              @click="selectCategory(category.value)"
            >
              <q-card-section>
                <div class="text-center">
                  <q-icon :name="getCategoryIcon(category.value)" size="2rem" />
                  <div class="text-subtitle2 q-mt-sm">{{ category.label }}</div>
                  <q-badge v-if="getBestScore(category.value)" color="positive" class="q-mt-xs">
                    Best: {{ formatTime(getBestScore(category.value)) }}
                  </q-badge>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>

      <!-- Stats Preview -->
      <div class="stats-section q-mt-lg">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-4">
            <q-card class="stat-card">
              <q-card-section class="text-center">
                <div class="text-h4 text-weight-bold">{{ totalGamesPlayed }}</div>
                <div class="text-caption">Games Played</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-12 col-sm-4">
            <q-card class="stat-card">
              <q-card-section class="text-center">
                <div class="text-h4 text-weight-bold">{{ totalWordsFound }}</div>
                <div class="text-caption">Words Found</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-12 col-sm-4">
            <q-card class="stat-card">
              <q-card-section class="text-center">
                <div class="text-h4 text-weight-bold">{{ winRate }}%</div>
                <div class="text-caption">Win Rate</div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons q-mt-lg">
        <q-btn
          color="primary"
          label="Start Game"
          class="q-mr-sm"
          size="lg"
          icon="play_arrow"
          @click="startGame()"
        />
        <q-btn
          outline
          color="primary"
          label="Settings"
          size="lg"
          icon="settings"
          @click="openSettings"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import { useCategoriesStore } from '../stores/categories'
import { useUserStore } from '../stores/user'
import { useTimeFormat } from '../composables/useTimeFormat'

const emit = defineEmits(['openSettings'])

const gameStore = useGameStore()
const categoriesStore = useCategoriesStore()
const userStore = useUserStore()

// Difficulty options
const difficultyOptions = [
  { label: 'Casual', value: 'easy', color: 'positive' },
  { label: 'Challenge', value: 'medium', color: 'warning' },
  { label: 'Expert', value: 'hard', color: 'negative' },
]

const getDifficultyDescription = (difficulty) => {
  const descriptions = {
    baby: '8x8 grid, 1 word',
    easy: '8x8 grid, 5 words',
    medium: '10x10 grid, 8 words',
    hard: '12x12 grid, 12 words',
  }
  return descriptions[difficulty] || ''
}

// Category options
const categoryOptions = computed(() =>
  categoriesStore.availableCategories.map((cat) => ({
    label: cat.charAt(0).toUpperCase() + cat.slice(1),
    value: cat,
  })),
)

const selectedCategory = computed(() => gameStore.currentCategory)

// Category icons (you can customize these)
const getCategoryIcon = (category) => {
  const icons = {
    animals: 'pets',
    countries: 'public',
    food: 'restaurant',
    sports: 'sports',
    // Add more category icons as needed
  }
  return icons[category] || 'label'
}

// Stats computations
const totalGamesPlayed = computed(() => userStore.totalGamesPlayed)
const totalWordsFound = computed(() => userStore.totalWordsFound)
const winRate = computed(() => {
  if (totalGamesPlayed.value === 0) return 0
  return Math.round((userStore.totalWins / totalGamesPlayed.value) * 100)
})

// Get best score for a category
const getBestScore = (category) => {
  const bestTime = userStore.getBestTime(category, gameStore.difficulty)
  if (!bestTime) return null

  const { formattedTime } = useTimeFormat(computed(() => bestTime))
  return formattedTime.value
}

// Format time helper
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Actions
const selectCategory = (category) => {
  gameStore.setCategory(category)
}

const startGame = (difficulty) => {
  if (difficulty) {
    gameStore.setDifficulty(difficulty)
  }
  gameStore.startNewGame()
}

const openSettings = () => {
  emit('openSettings')
}
</script>

<style scoped>
.start-menu {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.menu-content {
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.title-section {
  text-align: center;
  margin-bottom: 2rem;
}

.category-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.category-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.category-card.selected {
  border: 2px solid var(--q-primary);
}

.stat-card {
  background: #f8f9fa;
}

.action-buttons {
  text-align: center;
}

/* Responsive adjustments */
@media (max-width: 599px) {
  .start-menu {
    padding: 1rem;
  }

  .menu-content {
    padding: 1rem;
  }

  .text-h3 {
    font-size: 2rem;
  }
}
</style>
