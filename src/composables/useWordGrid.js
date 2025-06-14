// useWordGrid.js - Grid generation and word placement logic
import { ref, computed, watch } from 'vue'
import { useGameStore } from '../stores/game'

/**
 * @typedef {Object} GridCell
 * @property {string} letter - The letter in the cell
 * @property {boolean} isSelected - Whether the cell is currently selected
 * @property {boolean} isFound - Whether the cell is part of a found word
 * @property {number} row - The row index of the cell
 * @property {number} col - The column index of the cell
 */

/**
 * @typedef {Object} WordPlacement
 * @property {string} word - The word to place
 * @property {number} row - Starting row
 * @property {number} col - Starting column
 * @property {number} direction - Direction index (0-7)
 */

/**
 * @typedef {Object} GridConfig
 * @property {number} size - Grid size (width/height)
 * @property {string[]} words - Words to place in the grid
 */

/**
 * Word grid composable for managing the game grid
 * @returns {{
 *   grid: import('vue').Ref<string[][]>,
 *   gridSize: import('vue').ComputedRef<number>,
 *   initializeGrid: () => void,
 *   placeWords: (words: string[]) => { placedWords: string[], failedWords: string[] },
 *   selectCell: (row: number, col: number) => void,
 *   clearSelection: () => void,
 *   reset: () => void
 * }}
 */
export function useWordGrid() {
  /** @type {import('vue').Ref<string[][]>} */
  const grid = ref([])

  // Lazy initialization of game store to avoid Pinia issues
  const getGameStore = () => useGameStore()

  /** @type {import('vue').ComputedRef<number>} */
  const gridSize = computed(() => getGameStore().gridSize)

  // Directions for word placement (8 possible directions)
  const directions = [
    [0, 1], // right
    [1, 0], // down
    [1, 1], // diagonal down-right
    [-1, 1], // diagonal up-right
    [0, -1], // left
    [-1, 0], // up
    [-1, -1], // diagonal up-left
    [1, -1], // diagonal down-left
  ]

  /**
   * Initialize an empty grid
   * @param {boolean} [shouldPlaceWords=true] - Whether to place words after initialization
   * @returns {Promise<void>}
   */
  const initializeGrid = async (shouldPlaceWords = true) => {
    const size = gridSize.value

    if (size <= 0) {
      return
    }

    // Initialize with empty cells
    grid.value = Array(size)
      .fill(null)
      .map(() => Array(size).fill(''))

    // Get words from game store and place them
    if (shouldPlaceWords) {
      const words = getGameStore().words
      if (words.length > 0) {
        await placeWordsOnGrid(words)
      }
    }

    // Update game store grid
    getGameStore().updateGrid(grid.value)
  }

  /**
   * Check if a word can be placed at a position in a direction
   * @param {string} word - Word to check
   * @param {number} row - Starting row
   * @param {number} col - Starting column
   * @param {number[]} direction - Direction vector [dy, dx]
   * @returns {boolean} - Whether the word can be placed
   */
  const canPlaceWord = (word, row, col, direction) => {
    const size = gridSize.value
    const [dy, dx] = direction

    // Check if word fits within grid bounds
    if (
      row + dy * (word.length - 1) < 0 ||
      row + dy * (word.length - 1) >= size ||
      col + dx * (word.length - 1) < 0 ||
      col + dx * (word.length - 1) >= size
    ) {
      return false
    }

    // Check if path is clear or matches existing letters
    for (let i = 0; i < word.length; i++) {
      const y = row + dy * i
      const x = col + dx * i
      const cell = grid.value[y][x]
      if (cell !== '' && cell !== word[i]) {
        return false
      }
    }

    return true
  }

  /**
   * Place a word on the grid
   * @param {string} word - Word to place
   * @param {number} row - Starting row
   * @param {number} col - Starting column
   * @param {number[]} direction - Direction vector [dy, dx]
   */
  const placeWord = (word, row, col, direction) => {
    const [dy, dx] = direction
    for (let i = 0; i < word.length; i++) {
      const y = row + dy * i
      const x = col + dx * i
      grid.value[y][x] = word[i]
    }
  }

  /**
   * Fill empty cells with random letters
   */
  const fillEmptyCells = () => {
    const size = gridSize.value
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (grid.value[y][x] === '') {
          grid.value[y][x] = getRandomLetter()
        }
      }
    }
  }

  /**
   * Get a random letter
   * @returns {string} - Random letter
   */
  const getRandomLetter = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    return letters[Math.floor(Math.random() * letters.length)]
  }

  /**
   * Place words on the grid
   * @param {string[]} words - Words to place
   * @returns {{ placedWords: string[], failedWords: string[] }} - Results of word placement
   */
  const placeWordsOnGrid = async (words) => {
    const placedWords = []
    const failedWords = []
    const size = gridSize.value

    // Sort words by length (longest first for better placement)
    const sortedWords = [...words].sort((a, b) => b.length - a.length)

    // Try to place each word with enhanced retry mechanism
    for (const word of sortedWords) {
      let placed = false
      let currentWord = word
      let wordAttempts = 0
      const maxWordAttempts = 3 // Try up to 3 different words from the same category

      // Try placing the current word, with fallback to alternative words
      while (!placed && wordAttempts < maxWordAttempts) {
        // Try multiple times with random positions for the current word
        for (let attempts = 0; attempts < 200 && !placed; attempts++) {
          const row = Math.floor(Math.random() * size)
          const col = Math.floor(Math.random() * size)
          const direction = directions[Math.floor(Math.random() * directions.length)]

          if (canPlaceWord(currentWord, row, col, direction)) {
            placeWord(currentWord, row, col, direction)
            placedWords.push(currentWord)
            placed = true
            break
          }
        }

        // If word still not placed, try to get an alternative word from the same category
        if (!placed) {
          wordAttempts++
          if (wordAttempts < maxWordAttempts) {
            try {
              const alternativeWord = await getAlternativeWord(currentWord, [
                ...placedWords,
                ...failedWords,
              ])
              if (alternativeWord && alternativeWord !== currentWord) {
                currentWord = alternativeWord
              } else {
                // No more alternatives available, break the retry loop
                break
              }
            } catch (error) {
              console.warn('Failed to get alternative word, continuing with original:', error)
              break
            }
          }
        }
      }

      if (!placed) {
        failedWords.push(word)
      }
    }

    // Fill remaining cells with random letters
    fillEmptyCells()

    // Update game store grid
    getGameStore().updateGrid(grid.value)

    return { placedWords, failedWords }
  }

  /**
   * Get an alternative word from the same category
   * @param {string} originalWord - The original word that failed to place
   * @param {string[]} usedWords - Words already placed or failed
   * @returns {string|null} - Alternative word or null if none available
   */
  const getAlternativeWord = async (originalWord, usedWords) => {
    try {
      const gameStore = getGameStore()
      const currentCategory = gameStore.currentCategory
      const currentGridSize = gridSize.value

      // Import categories store dynamically to avoid circular dependencies
      const { useCategoriesStore } = await import('../stores/categories')
      const categoriesStore = useCategoriesStore()

      // Get all words from the current category
      const categoryWords = categoriesStore.getCategoryWords(currentCategory)

      if (!categoryWords || categoryWords.length === 0) {
        return null
      }

      // Filter out words that are already used or too long for the grid
      const maxWordLength = Math.floor(currentGridSize * 0.8) // Max 80% of grid size
      const availableWords = categoryWords.filter(
        (word) =>
          !usedWords.includes(word) &&
          word !== originalWord &&
          word.length <= maxWordLength &&
          word.length >= 3, // Minimum word length
      )

      if (availableWords.length === 0) {
        return null
      }

      // Prefer words of similar length to the original
      const originalLength = originalWord.length
      const similarLengthWords = availableWords.filter(
        (word) => Math.abs(word.length - originalLength) <= 2,
      )

      const wordsToChooseFrom = similarLengthWords.length > 0 ? similarLengthWords : availableWords

      // Return a random alternative word
      return wordsToChooseFrom[Math.floor(Math.random() * wordsToChooseFrom.length)]
    } catch (error) {
      console.warn('Failed to get alternative word:', error)
      return null
    }
  }

  /**
   * Place words on the grid and initialize
   * @param {string[]} words - Words to place
   * @returns {Promise<{ placedWords: string[], failedWords: string[] }>} - Results of word placement
   */
  const placeWords = async (words) => {
    // Initialize empty grid without placing words
    await initializeGrid(false)
    // Place words on the empty grid
    return await placeWordsOnGrid(words)
  }

  /**
   * Select a cell in the grid
   * @param {number} row - Row index
   * @param {number} col - Column index
   * @returns {void}
   */
  const selectCell = (/*row, col*/) => {
    // TODO: Implement cell selection logic
  }

  /**
   * Clear current selection
   * @returns {void}
   */
  const clearSelection = () => {
    // TODO: Implement selection clearing
  }

  /**
   * Reset the grid
   * @returns {void}
   */
  const reset = () => {
    grid.value = []
  }

  /**
   * Check if a word exists in the grid
   * @param {string} word - Word to search for
   * @returns {boolean} - Whether the word exists in the grid
   */
  const wordExistsInGrid = (word) => {
    const size = gridSize.value
    if (!grid.value || grid.value.length === 0) return false

    // Check all positions and directions
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        for (const direction of directions) {
          if (checkWordAtPosition(word, row, col, direction)) {
            return true
          }
        }
      }
    }
    return false
  }

  /**
   * Check if a word exists at a specific position and direction
   * @param {string} word - Word to check
   * @param {number} row - Starting row
   * @param {number} col - Starting column
   * @param {number[]} direction - Direction vector [dy, dx]
   * @returns {boolean} - Whether the word exists at this position
   */
  const checkWordAtPosition = (word, row, col, direction) => {
    const size = gridSize.value
    const [dy, dx] = direction

    // Check bounds
    if (
      row + dy * (word.length - 1) < 0 ||
      row + dy * (word.length - 1) >= size ||
      col + dx * (word.length - 1) < 0 ||
      col + dx * (word.length - 1) >= size
    ) {
      return false
    }

    // Check if letters match
    for (let i = 0; i < word.length; i++) {
      const y = row + dy * i
      const x = col + dx * i
      if (grid.value[y][x] !== word[i]) {
        return false
      }
    }
    return true
  }

  /**
   * Validate a selection of cells and return the word if valid
   * @param {Array<{x: number, y: number}>} selection - Array of selected cell coordinates
   * @returns {string|null} - The word formed by the selection, or null if invalid
   */
  const validateSelection = (selection) => {
    if (!selection || selection.length === 0) return null
    if (!grid.value || grid.value.length === 0) return null

    // Minimum word length validation
    if (selection.length < 3) return null

    // Extract letters from selection
    const word = selection
      .map(({ x, y }) => {
        if (y < 0 || y >= grid.value.length || x < 0 || x >= grid.value[0].length) {
          return ''
        }
        return grid.value[y][x]
      })
      .join('')

    return word.length >= 3 ? word : null
  }

  // Flag to prevent recursive watch triggers
  let isUpdatingWords = false
  // Flag to prevent multiple simultaneous word placements
  let isPlacingWords = false

  // Watch for grid size changes and reinitialize
  watch(
    [gridSize, () => getGameStore().words, () => getGameStore().isGameActive],
    async ([newSize, newWords, isGameActive], [_oldSize, oldWords, _wasGameActive]) => {
      if (isUpdatingWords || isPlacingWords || !isGameActive) {
        return
      }

      if (newSize > 0 && newWords?.length > 0) {
        // Skip if words haven't actually changed (unless it's the initial load)
        const wordsChanged = JSON.stringify(newWords) !== JSON.stringify(oldWords)
        const isInitialLoad = !oldWords || oldWords.length === 0

        if (!wordsChanged && !isInitialLoad) {
          return
        }

        try {
          isPlacingWords = true
          const { placedWords, failedWords } = await placeWords(newWords)

          // Always update game state with the words that were actually placed
          // This ensures the word list matches what's actually on the grid
          const hasWordSubstitutions = placedWords.some((word) => !newWords.includes(word))

          if (
            placedWords.length !== newWords.length ||
            failedWords.length > 0 ||
            hasWordSubstitutions
          ) {
            isUpdatingWords = true
            getGameStore().updateWords(placedWords)
            setTimeout(() => {
              isUpdatingWords = false
            }, 100)
          }
        } catch {
          isUpdatingWords = false
        } finally {
          isPlacingWords = false
        }
      } else if (newSize > 0) {
        await initializeGrid(false)
      }
    },
    { immediate: true },
  )

  // Watch grid changes and sync with game store
  watch(
    grid,
    (newGrid) => {
      if (newGrid.length > 0) {
        getGameStore().updateGrid(newGrid)
      }
    },
    { deep: true },
  )

  return {
    grid,
    gridSize,
    initializeGrid,
    placeWords,
    selectCell,
    clearSelection,
    reset,
    wordExistsInGrid,
    validateSelection,
  }
}
