<!-- StartMenu.vue - Game start menu and category selection -->
<template>
  <q-page class="start-menu-page">
    <!-- Animated background elements -->
    <div class="background-elements">
      <div
        class="floating-letter"
        v-for="letter in backgroundLetters"
        :key="letter.id"
        :style="letter.style"
      >
        {{ letter.char }}
      </div>
    </div>

    <div class="menu-container">
      <!-- Main Menu Card -->
      <div class="menu-card">
        <!-- Category Selection -->
        <div class="section category-section">
          <h2 class="section-title">
            <q-icon name="category" class="section-icon" />
            Choose Your Theme
          </h2>
          <div class="category-grid">
            <div
              v-for="category in categories"
              :key="category.id"
              class="category-card"
              :class="{ active: selectedCategory === category.id }"
              @click="selectCategory(category.id)"
            >
              <div class="category-icon">
                <q-icon :name="category.icon" />
              </div>
              <div class="category-name">{{ category.name }}</div>
              <div class="category-description">{{ category.description }}</div>
              <div class="category-overlay"></div>
            </div>
          </div>
        </div>

        <!-- Difficulty Selection -->
        <div class="section difficulty-section">
          <h2 class="section-title">
            <q-icon name="tune" class="section-icon" />
            Select Difficulty
          </h2>
          <div class="difficulty-grid">
            <div
              v-for="diff in difficulties"
              :key="diff.id"
              class="difficulty-card"
              :class="{ active: selectedDifficulty === diff.id }"
              @click="selectDifficulty(diff.id)"
            >
              <div class="difficulty-level">{{ diff.name }}</div>
              <div class="difficulty-details">
                <div class="detail-item">
                  <q-icon name="grid_on" />
                  <span>{{ diff.gridSize }}×{{ diff.gridSize }}</span>
                </div>
                <div class="detail-item">
                  <q-icon name="format_list_bulleted" />
                  <span>{{ diff.wordCount }} words</span>
                </div>
              </div>
              <div class="difficulty-overlay"></div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="action-section">
          <div class="row q-col-gutter-md q-mt-lg justify-center">
            <div class="col-sm-6">
              <q-btn
                class="start-button"
                :class="{ ready: canStartGame }"
                :disable="!canStartGame"
                @click="startSingleGame"
                size="lg"
                color="primary"
                no-caps
                unelevated
              >
                <q-icon name="grid_on" class="start-icon" />
                <span>Single Board</span>
                <div class="button-glow"></div>
              </q-btn>
            </div>
            <div class="col-sm-6">
              <q-btn
                class="start-button challenge-button"
                :class="{ ready: canStartGame }"
                :disable="!canStartGame"
                @click="startChallengeMode"
                size="lg"
                color="secondary"
                no-caps
                unelevated
              >
                <q-icon name="emoji_events" class="start-icon" />
                <span>Challenge Mode</span>
                <div class="button-glow"></div>
              </q-btn>
            </div>
          </div>

          <div class="secondary-actions">
            <q-btn
              flat
              class="secondary-btn"
              :to="{ name: 'stats' }"
              icon="bar_chart"
              label="Statistics"
              no-caps
            />
            <q-btn
              flat
              class="secondary-btn"
              @click="showSettings = true"
              icon="settings"
              label="Settings"
              no-caps
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Settings Dialog (if needed) -->
    <q-dialog v-model="showSettings">
      <q-card class="settings-card">
        <q-card-section>
          <div class="text-h6">Game Settings</div>
        </q-card-section>
        <q-card-section>
          <div class="setting-item">
            <q-toggle
              v-model="soundEnabled"
              @update:model-value="toggleSound"
              label="Sound Effects"
              color="secondary"
            />
          </div>
          <div class="setting-item">
            <q-toggle
              v-model="hintsEnabled"
              @update:model-value="toggleHints"
              label="Enable Hints"
              color="secondary"
            />
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Close" @click="showSettings = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/game'
import { useCategoriesStore } from '../stores/categories'

const router = useRouter()
const gameStore = useGameStore()
const categoriesStore = useCategoriesStore()
const showSettings = ref(false)

// Challenge Mode refs (removed - no longer needed)

// Settings
const soundEnabled = computed(() => gameStore.soundEnabled)
const hintsEnabled = computed(() => gameStore.hintsEnabled)

const toggleSound = () => gameStore.toggleSound()
const toggleHints = () => gameStore.toggleHints()

// Background animation letters
const backgroundLetters = ref([])

// Categories with icons
const categories = computed(() => {
  const categoryData = {
    random: { icon: 'shuffle', color: '#1976D2', description: 'Surprise yourself' },
    animals: { icon: 'pets', color: '#4CAF50' },
    disney: { icon: 'castle', color: '#E91E63' },
    famousLandmarks: { icon: 'place', color: '#FF9800' },
    friendsAndFamilies: { icon: 'people', color: '#9C27B0' },
    fruits: { icon: 'apple', color: '#FF5722' },
    greekGods: { icon: 'account_balance', color: '#3F51B5' },
    harryPotter: { icon: 'auto_fix_high', color: '#795548' },
    space: { icon: 'rocket_launch', color: '#607D8B' },
    superheroes: { icon: 'flash_on', color: '#F44336' },
    vampireDiaries: { icon: 'nights_stay', color: '#424242' },
    vegetables: { icon: 'grass', color: '#8BC34A' },
  }

  return [
    ...categoriesStore.categoryNames.map((name) => ({
      id: name,
      name: categoriesStore.getCategoryDisplayName(name),
      description: getCategoryDescription(name),
      icon: categoryData[name]?.icon || 'category',
      color: categoryData[name]?.color || '#1976D2',
    })),
  ]
})

const getCategoryDescription = (categoryName) => {
  const descriptions = {
    animals: 'Discover wildlife',
    disney: 'Magical characters',
    famousLandmarks: 'World wonders',
    friendsAndFamilies: 'Relationships',
    fruits: 'Fresh & healthy',
    greekGods: 'Ancient mythology',
    harryPotter: 'Wizarding world',
    space: 'Cosmic adventure',
    superheroes: 'Save the world',
    vampireDiaries: 'Supernatural drama',
    vegetables: 'Garden fresh',
  }
  return descriptions[categoryName] || 'Word collection'
}

// Difficulties with enhanced data
const difficulties = [
  {
    id: 'baby',
    name: 'Baby',
    gridSize: 8,
    wordCount: 1,
    color: '#4CAF50',
  },
  {
    id: 'easy',
    name: 'Easy',
    gridSize: 8,
    wordCount: 5,
    color: '#2196F3',
  },
  {
    id: 'medium',
    name: 'Medium',
    gridSize: 10,
    wordCount: 8,
    color: '#FF9800',
  },
  {
    id: 'hard',
    name: 'Hard',
    gridSize: 12,
    wordCount: 12,
    color: '#F44336',
  },
]

// Selected options
const selectedCategory = computed(() => gameStore.currentCategory)
const selectedDifficulty = computed(() => gameStore.difficulty)
const canStartGame = computed(() => selectedCategory.value && selectedDifficulty.value)

// Challenge Mode computed (removed - no longer needed)

// Actions
const selectCategory = (category) => {
  gameStore.setCategory(category)
}

const selectDifficulty = (difficulty) => {
  gameStore.setDifficulty(difficulty)
}

// Challenge Mode methods (removed - no longer needed)

const startSingleGame = () => {
  gameStore.challengeMode.isActive = false
  gameStore.startNewGame()
  router.push({ name: 'game' })
}

const startChallengeMode = () => {
  // Use the currently selected category and difficulty from the main menu
  gameStore.initChallengeMode(selectedCategory.value, selectedDifficulty.value)
  gameStore.startNewGame()
  router.push({ name: 'challenge' })
}

// Initialize background animation
onMounted(() => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
  backgroundLetters.value = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    char: letters[Math.floor(Math.random() * letters.length)],
    style: {
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 10}s`,
      animationDuration: `${10 + Math.random() * 20}s`,
    },
  }))

  // Select random theme by default
  const randomCategory = categoriesStore.getRandomCategory()
  selectCategory(randomCategory)
})
</script>

<style lang="scss" scoped>
.start-menu-page {
  min-height: 100vh;
  height: 100vh;
  background: linear-gradient(
    135deg,
    var(--q-primary) 0%,
    var(--q-secondary) 50%,
    var(--q-accent) 100%
  );
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.background-elements {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
}

.floating-letter {
  position: absolute;
  font-size: 3rem;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.03);
  animation: float linear infinite;
  user-select: none;
}

@keyframes float {
  0% {
    transform: translateY(100%) rotate(0deg);
    opacity: 0;
  }
  10%,
  90% {
    opacity: 0.1;
  }
  50% {
    opacity: 0.05;
  }
  100% {
    transform: translateY(-100%) rotate(360deg);
    opacity: 0;
  }
}

.menu-container {
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.hero-section {
  text-align: center;
  margin-bottom: 1rem;
  animation: fadeInUp 1s ease-out;
}

.logo-container {
  .logo-text {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    margin-bottom: 0.25rem;

    .word,
    .search {
      font-size: clamp(1.75rem, 5vw, 2.5rem);
      font-weight: 700;
      text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }

    .word {
      color: white;
    }

    .search {
      background: linear-gradient(45deg, #ffd700, #ffa500);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  }

  .logo-subtitle {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.8);
    font-weight: 300;
  }
}

.menu-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 1rem;
  max-width: 1000px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: fadeInUp 1s ease-out 0.2s both;
}

.section {
  margin-bottom: 1rem;

  &:last-child {
    margin-bottom: 0.5rem;
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  margin-bottom: 0.75rem;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.section-icon {
  font-size: 1.8rem;
  color: white;
  opacity: 0.9;
}

.category-grid {
  display: flex;
  flex-wrap: nowrap;
  gap: 0.5rem;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 1.5rem;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.3) transparent;

  &::-webkit-scrollbar {
    height: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;

    &:hover {
      background: rgba(255, 255, 255, 0.5);
    }
  }
}

.category-card {
  position: relative;
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  text-align: center;
  flex: 0 0 130px;
  min-width: 130px;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }

  &.active {
    border-color: var(--q-accent);
    background: rgba(var(--q-accent-rgb), 0.15);
    transform: translateY(-2px);
  }
}

.category-icon {
  font-size: 1.75rem;
  color: white;
  margin-bottom: 0.35rem;
  opacity: 0.9;
}

.category-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: white;
  margin-bottom: 0.2rem;
}

.category-description {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.1;
}

.category-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, transparent, rgba(var(--q-secondary-rgb), 0.1));
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 14px;
}

.difficulty-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.5rem;
}

.difficulty-card {
  position: relative;
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  text-align: center;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }

  &.active {
    border-color: var(--q-accent);
    background: rgba(var(--q-accent-rgb), 0.15);
    transform: translateY(-2px);
  }
}

.difficulty-level {
  font-size: 1rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.35rem;
  text-transform: uppercase;
}

.difficulty-details {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.detail-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.75rem;
}

.action-section {
  text-align: center;
  margin-top: 0.5rem;
}

.start-button {
  position: relative;
  background: linear-gradient(45deg, var(--q-secondary), var(--q-accent));
  color: white;
  border-radius: 50px;
  padding: 0.6rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  min-width: 280px;
  min-height: 48px;
  margin-bottom: 0.75rem;
  transition: all 0.3s ease;
  overflow: hidden;

  &:not(.ready) {
    opacity: 0.5;
    background: rgba(255, 255, 255, 0.1);
  }

  &.ready:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  }

  .start-icon {
    font-size: 1.5rem;
    margin-right: 0.5rem;
  }

  .button-glow {
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s ease;
  }

  &.ready:hover .button-glow {
    left: 100%;
  }
}

.secondary-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.secondary-btn {
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    color: white;
    background: rgba(255, 255, 255, 0.1);
  }
}

.settings-card {
  min-width: 300px;
  background: rgba(30, 30, 40, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  color: white;

  .text-h6 {
    color: white;
    font-weight: 600;
  }

  .q-card-section {
    padding: 1.5rem;
  }
}

.setting-item {
  margin-bottom: 1.5rem;

  .q-toggle {
    .q-toggle__label {
      color: rgba(255, 255, 255, 0.9);
    }
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Responsive design
@media (max-width: 768px) {
  .menu-container {
    padding: 1rem 0.5rem;
  }

  .menu-card {
    padding: 1rem;
    border-radius: 16px;
  }

  .category-card {
    flex: 0 0 120px;
    min-width: 120px;
  }

  .difficulty-grid {
    display: flex;
    flex-wrap: nowrap;
    gap: 0.5rem;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 1.5rem;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.3) transparent;

    &::-webkit-scrollbar {
      height: 6px;
    }

    &::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 3px;

      &:hover {
        background: rgba(255, 255, 255, 0.5);
      }
    }
  }

  .difficulty-card {
    flex: 0 0 120px;
    min-width: 120px;
  }

  .secondary-actions {
    flex-direction: column;
    gap: 1rem;
  }

  .start-button {
    min-width: 200px;
    padding: 0.6rem 1.75rem;
  }
}

@media (max-width: 480px) {
  .hero-section {
    margin-bottom: 2rem;
  }
}
</style>
