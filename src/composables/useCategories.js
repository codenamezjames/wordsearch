import { computed } from 'vue'
import { useCategoriesStore } from '../stores/categories'

/**
 * @typedef {Object} Category
 * @property {string} id - Category identifier
 * @property {string} name - Display name
 * @property {string} description - Category description
 * @property {string[]} words - List of words in the category
 */

/**
 * Categories composable for managing word categories
 * @returns {{
 *   categories: import('vue').ComputedRef<Category[]>,
 *   availableCategories: import('vue').ComputedRef<string[]>,
 *   getRandomCategory: () => string,
 *   getRandomWords: (categoryName: string, count?: number) => string[],
 *   getCategoryWords: (categoryName: string) => string[],
 *   getCategoryDisplayName: (categoryName: string) => string
 * }}
 */
export function useCategories() {
  const categoriesStore = useCategoriesStore()

  /** @type {import('vue').ComputedRef<Category[]>} */
  const categories = computed(() => {
    return categoriesStore.categoryNames.map((name) => ({
      id: name,
      name: getCategoryDisplayName(name),
      description: getCategoryDescription(name),
      words: categoriesStore.getCategoryWords(name),
    }))
  })

  /** @type {import('vue').ComputedRef<string[]>} */
  const availableCategories = computed(() => categoriesStore.categoryNames)

  /**
   * Get a random category name
   * @returns {string} - Random category name
   */
  const getRandomCategory = () => {
    return categoriesStore.getRandomCategory()
  }

  /**
   * Get random words from a category
   * @param {string} categoryName - Category name
   * @param {number} [count=10] - Number of words to get
   * @returns {string[]} - Random words from the category
   */
  const getRandomWords = (categoryName, count = 10) => {
    return categoriesStore.getRandomWords(categoryName, count)
  }

  /**
   * Get all words from a category
   * @param {string} categoryName - Category name
   * @returns {string[]} - All words in the category
   */
  const getCategoryWords = (categoryName) => {
    return categoriesStore.getCategoryWords(categoryName)
  }

  /**
   * Get display name for a category
   * @param {string} categoryName - Category name
   * @returns {string} - Formatted display name
   */
  const getCategoryDisplayName = (categoryName) => {
    return categoriesStore.getCategoryDisplayName(categoryName)
  }

  /**
   * Get description for a category
   * @param {string} categoryName - Category name
   * @returns {string} - Category description
   */
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

  return {
    categories,
    availableCategories,
    getRandomCategory,
    getRandomWords,
    getCategoryWords,
    getCategoryDisplayName,
  }
}
