<!-- StatsPage.vue - Game statistics and achievements -->
<template>
  <q-page class="bg-primary q-pa-md">
    <q-card class="stats-container q-pa-xl" :class="{ 'bg-dark': isDark }">
      <!-- Header -->
      <div class="text-center q-mb-xl">
        <h1 class="text-h3 q-mb-md" :class="isDark ? 'text-white' : 'text-primary'">Statistics</h1>
        <q-btn
          flat
          :color="isDark ? 'white' : 'primary'"
          icon="arrow_back"
          :to="{ name: 'start' }"
          label="Back to Menu"
        />
      </div>

      <!-- High Scores -->
      <div class="q-mb-xl">
        <h2 class="text-h4 q-mb-lg" :class="isDark ? 'text-grey-3' : 'text-secondary'">
          High Scores
        </h2>
        <div class="row q-col-gutter-md">
          <div v-for="category in categories" :key="category.id" class="col-12 col-md-6">
            <q-card flat bordered :class="{ 'bg-dark': isDark }">
              <q-card-section>
                <div class="text-h6" :class="isDark ? 'text-grey-3' : ''">{{ category.name }}</div>
                <q-list padding>
                  <q-item v-for="diff in difficulties" :key="diff.id">
                    <q-item-section>
                      <q-item-label :class="isDark ? 'text-grey-4' : ''">{{
                        diff.name
                      }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-item-label class="text-h6" :class="isDark ? 'text-grey-2' : ''">
                        {{ formatScore(getHighScore(category.id, diff.id)) }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>

      <!-- Achievements -->
      <div class="q-mb-xl">
        <h2 class="text-h4 q-mb-lg" :class="isDark ? 'text-grey-3' : 'text-secondary'">
          Achievements
        </h2>
        <div class="row q-col-gutter-md">
          <div v-for="achievement in achievements" :key="achievement.id" class="col-12 col-md-4">
            <q-card
              flat
              bordered
              :class="{
                'bg-dark': isDark,
                'achievement-locked': !achievement.unlocked,
              }"
            >
              <q-card-section>
                <div class="row items-center no-wrap">
                  <div class="col">
                    <div class="text-h6" :class="isDark ? 'text-grey-3' : ''">
                      {{ achievement.title }}
                    </div>
                    <div class="text-subtitle2" :class="isDark ? 'text-grey-5' : ''">
                      {{ achievement.description }}
                    </div>
                  </div>
                  <div class="col-auto">
                    <q-icon
                      :name="achievement.unlocked ? 'emoji_events' : 'lock'"
                      :color="achievement.unlocked ? 'positive' : 'grey'"
                      size="2rem"
                    />
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>

      <!-- Overall Stats -->
      <div class="q-mt-xl">
        <h2 class="text-h4 q-mb-lg" :class="isDark ? 'text-grey-3' : 'text-secondary'">
          Overall Stats
        </h2>
        <div class="row q-col-gutter-lg">
          <div v-for="(stat, key) in statsData" :key="key" class="col-12 col-md-3">
            <q-card flat bordered class="text-center q-pa-md" :class="{ 'bg-dark': isDark }">
              <q-card-section>
                <div class="text-h3" :class="`text-${stat.color}`">{{ stat.value }}</div>
                <div class="text-subtitle1" :class="isDark ? 'text-grey-4' : ''">
                  {{ stat.label }}
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
    </q-card>
  </q-page>
</template>

<script setup>
import { computed } from 'vue'
import { useUserStore } from '../stores/user'
import { useThemeStore } from '../stores/theme'
import { storeToRefs } from 'pinia'

const userStore = useUserStore()
const themeStore = useThemeStore()
const { isDark } = storeToRefs(themeStore)

// Categories and difficulties (should match those in StartMenu.vue)
const categories = [
  { id: 'animals', name: 'Animals' },
  { id: 'countries', name: 'Countries' },
  { id: 'programming', name: 'Programming' },
  { id: 'food', name: 'Food' },
]

const difficulties = [
  { id: 'baby', name: 'Baby' },
  { id: 'easy', name: 'Easy' },
  { id: 'medium', name: 'Medium' },
  { id: 'hard', name: 'Hard' },
]

// Achievements list
const achievements = computed(() => [
  {
    id: 'speed-demon',
    title: 'Speed Demon',
    description: 'Complete a game in under 1 minute',
    unlocked: userStore.hasAchievement('speed-demon'),
  },
  {
    id: 'perfect-aim',
    title: 'Perfect Aim',
    description: '100% accuracy with more than 5 attempts',
    unlocked: userStore.hasAchievement('perfect-aim'),
  },
  {
    id: 'combo-master',
    title: 'Combo Master',
    description: 'Get a 5x combo',
    unlocked: userStore.hasAchievement('combo-master'),
  },
  {
    id: 'high-roller',
    title: 'High Roller',
    description: 'Score over 10,000 points',
    unlocked: userStore.hasAchievement('high-roller'),
  },
  {
    id: 'completionist',
    title: 'Completionist',
    description: 'Complete all categories on hard difficulty',
    unlocked: userStore.hasAchievement('completionist'),
  },
  {
    id: 'word-master',
    title: 'Word Master',
    description: 'Find 1000 words total',
    unlocked: userStore.hasAchievement('word-master'),
  },
])

// Overall stats with colors
const statsData = computed(() => ({
  gamesPlayed: {
    value: userStore.totalGamesPlayed,
    label: 'Games Played',
    color: 'primary',
  },
  wordsFound: {
    value: userStore.totalWordsFound,
    label: 'Words Found',
    color: 'secondary',
  },
  averageAccuracy: {
    value: Math.round(userStore.averageAccuracy) + '%',
    label: 'Avg. Accuracy',
    color: 'accent',
  },
  bestCombo: {
    value: userStore.bestCombo + 'x',
    label: 'Best Combo',
    color: 'positive',
  },
}))

// Helper functions
const getHighScore = (category, difficulty) => {
  return userStore.getHighScore(category, difficulty)
}

const formatScore = (score) => {
  return score ? score.toLocaleString() : '0'
}
</script>

<style lang="scss" scoped>
.stats-container {
  max-width: 1200px;
  margin: 0 auto;
  border-radius: 1rem;

  &.bg-dark {
    background: rgba(30, 30, 30, 0.95);
  }
}

.achievement-locked {
  opacity: 0.7;
  filter: grayscale(0.5);
}
</style>
