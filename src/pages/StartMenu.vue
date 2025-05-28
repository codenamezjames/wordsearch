<!-- StartMenu.vue - Game start menu and category selection -->
<template>
  <q-page class="fullscreen bg-primary">
    <div class="column items-center justify-center q-pa-md">
      <q-card class="start-menu-container q-pa-lg" :class="{ 'bg-dark': isDark }">
        <h1 class="text-h2 text-center" :class="isDark ? 'text-white' : 'text-primary'">
          Word Search
        </h1>

        <!-- Category Selection -->
        <div class="q-mb-lg">
          <h2 class="text-h5 q-mb-md" :class="isDark ? 'text-grey-3' : 'text-secondary'">
            Select Category
          </h2>
          <div class="row q-col-gutter-md justify-center">
            <div v-for="category in categories" :key="category.id" class="col-12 col-sm-6 col-md-4">
              <q-card
                flat
                bordered
                class="cursor-pointer"
                :class="{
                  'bg-secondary-1': selectedCategory === category.id && !isDark,
                  'bg-secondary-9': selectedCategory === category.id && isDark,
                }"
                @click="selectCategory(category.id)"
              >
                <q-card-section>
                  <div class="text-h6">{{ category.name }}</div>
                  <div class="text-caption">{{ category.description }}</div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </div>

        <!-- Difficulty Selection -->
        <div class="q-mb-xl">
          <h2 class="text-h5 q-mb-md" :class="isDark ? 'text-grey-3' : 'text-secondary'">
            Select Difficulty
          </h2>
          <div class="row q-col-gutter-md justify-center">
            <div class="col-12 col-sm-6 col-md-3" v-for="diff in difficulties" :key="diff.id">
              <q-btn
                :label="diff.name"
                class="full-width"
                :color="selectedDifficulty === diff.id ? 'secondary' : 'primary'"
                :flat="selectedDifficulty !== diff.id"
                @click="selectDifficulty(diff.id)"
              />
            </div>
          </div>
        </div>

        <!-- Start Button -->
        <div class="text-center">
          <q-btn
            label="Start Game"
            color="accent"
            size="lg"
            :to="{ name: 'game' }"
            :disable="!canStartGame"
            unelevated
            rounded
          />
        </div>

        <!-- Stats Link -->
        <div class="text-center q-mt-xl">
          <q-btn
            flat
            :color="isDark ? 'white' : 'primary'"
            label="View Statistics"
            :to="{ name: 'stats' }"
            icon="bar_chart"
          />
        </div>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import { useThemeStore } from '../stores/theme'
import { useCategoriesStore } from '../stores/categories'
import { storeToRefs } from 'pinia'

const gameStore = useGameStore()
const themeStore = useThemeStore()
const categoriesStore = useCategoriesStore()
const { isDark } = storeToRefs(themeStore)

// Categories
const categories = computed(() => {
  return categoriesStore.categoryNames.map((name) => ({
    id: name,
    name: categoriesStore.getCategoryDisplayName(name),
    description: getCategoryDescription(name),
  }))
})

// Get description for a category
const getCategoryDescription = (categoryName) => {
  const descriptions = {
    animals: 'Find various animal names',
    disney: 'Disney characters and movies',
    famousLandmarks: 'Famous landmarks around the world',
    friendsAndFamilies: 'Family and relationship terms',
    fruits: 'Various fruit names',
    greekGods: 'Greek mythology deities',
    harryPotter: 'Harry Potter characters and terms',
    space: 'Space and astronomy terms',
    superheroes: 'Superhero names and characters',
    vampireDiaries: 'Vampire Diaries characters',
    vegetables: 'Various vegetable names',
  }
  return descriptions[categoryName] || 'A collection of words'
}

// Difficulties
const difficulties = [
  { id: 'baby', name: 'Baby', description: '8x8 grid, 1 word' },
  { id: 'easy', name: 'Easy', description: '8x8 grid, 5 words' },
  { id: 'medium', name: 'Medium', description: '10x10 grid, 8 words' },
  { id: 'hard', name: 'Hard', description: '12x12 grid, 12 words' },
]

// Selected options
const selectedCategory = computed(() => gameStore.currentCategory)
const selectedDifficulty = computed(() => gameStore.difficulty)

// Can start game if both category and difficulty are selected
const canStartGame = computed(() => selectedCategory.value && selectedDifficulty.value)

// Actions
const selectCategory = (category) => {
  gameStore.setCategory(category)
}

const selectDifficulty = (difficulty) => {
  gameStore.setDifficulty(difficulty)
}
</script>

<style lang="scss" scoped>
.start-menu-container {
  max-width: 1200px;
  width: 90%;
  border-radius: 1rem;

  &.bg-dark {
    background: rgba(30, 30, 30, 0.95);
  }
}
</style>
